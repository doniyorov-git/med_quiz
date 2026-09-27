import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  HeartPulse,
  House,
  Info,
  Layers3,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Swords,
  Sun,
  Trophy,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type Theme = 'light' | 'dark';
type Subject = {
  id: string;
  name: string;
  shortDescription: string;
  icon: string;
  category: string;
  questionCount: number;
  progress: number;
  color: string;
};
type Question = {
  id: string;
  subjectId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
};
type User = {
  id: string;
  name: string;
  initials: string;
  university: string;
  course: string;
  level: number;
  xp: number;
  streak: number;
  solvedTests: number;
  averageScore: number;
  avatarColor: string;
};
type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  unlocked: boolean;
  tone: string;
};
type BattlePlayer = {
  id: string;
  name: string;
  initials: string;
  score: number;
  progress: number;
  isCurrentUser?: boolean;
};

const user: User = {
  id: 'user-1',
  name: 'Madina Karimova',
  initials: 'MK',
  university: 'Toshkent Tibbiyot Akademiyasi',
  course: '3-kurs',
  level: 12,
  xp: 2480,
  streak: 7,
  solvedTests: 86,
  averageScore: 78,
  avatarColor: '#2563EB',
};

const subjects: Subject[] = [
  { id: 'anatomy', name: 'Anatomiya', shortDescription: 'Inson tanasi tuzilishi', icon: 'layers', category: 'Asosiy fanlar', questionCount: 240, progress: 68, color: '#2563EB' },
  { id: 'physiology', name: 'Fiziologiya', shortDescription: 'Tana faoliyati va tizimlar', icon: 'heart-pulse', category: 'Asosiy fanlar', questionCount: 185, progress: 52, color: '#10B981' },
  { id: 'biochemistry', name: 'Biokimyo', shortDescription: 'Hayotning molekulyar asosi', icon: 'flask', category: 'Asosiy fanlar', questionCount: 160, progress: 41, color: '#F59E0B' },
  { id: 'microbiology', name: 'Mikrobiologiya', shortDescription: 'Mikroorganizmlar olami', icon: 'microscope', category: 'Klinik fanlar', questionCount: 210, progress: 35, color: '#8B5CF6' },
  { id: 'pharmacology', name: 'Farmakologiya', shortDescription: 'Dori vositalari va ta’siri', icon: 'pill', category: 'Klinik fanlar', questionCount: 190, progress: 24, color: '#EF4444' },
  { id: 'pathology', name: 'Patologiya', shortDescription: 'Kasalliklarning mexanizmlari', icon: 'activity', category: 'Klinik fanlar', questionCount: 140, progress: 18, color: '#0EA5E9' },
];

const questions: Record<string, Question[]> = {
  anatomy: [
    { id: 'a-1', subjectId: 'anatomy', prompt: 'Yurakning qaysi qismi katta qon aylanish doirasiga qon haydaydi?', options: ['O‘ng bo‘lmacha', 'Chap qorincha', 'O‘ng qorincha', 'Chap bo‘lmacha'], correctIndex: 1, explanation: 'Chap qorincha kislorodga boy qonni aorta orqali katta qon aylanish doirasiga chiqaradi.', difficulty: 'Easy' },
    { id: 'a-2', subjectId: 'anatomy', prompt: 'Bosh miya po‘stlog‘ining harakat markazi qaysi bo‘lakda joylashgan?', options: ['Peshona bo‘lagi', 'Tepa bo‘lagi', 'Ensa bo‘lagi', 'Chakka bo‘lagi'], correctIndex: 0, explanation: 'Birlamchi motor korteks peshona bo‘lagidagi precentral pushtada joylashadi.', difficulty: 'Medium' },
    { id: 'a-3', subjectId: 'anatomy', prompt: 'Buyrakning funksional birligi nima deb ataladi?', options: ['Alveola', 'Nefron', 'Akinus', 'Osteon'], correctIndex: 1, explanation: 'Nefron siydik hosil bo‘lishining barcha asosiy bosqichlarini bajaradigan buyrak birligidir.', difficulty: 'Easy' },
    { id: 'a-4', subjectId: 'anatomy', prompt: 'Qaysi suyak inson tanasidagi eng uzun suyak hisoblanadi?', options: ['Yelka suyagi', 'Boldir suyagi', 'Son suyagi', 'Umurtqa'], correctIndex: 2, explanation: 'Son suyagi — uzunligi va mustahkamligi bilan ajralib turadigan eng katta suyak.', difficulty: 'Easy' },
  ],
  physiology: [
    { id: 'p-1', subjectId: 'physiology', prompt: 'Tinch holatda kattalar yuragining o‘rtacha urish tezligi qancha?', options: ['20–30/min', '60–80/min', '100–120/min', '140–160/min'], correctIndex: 1, explanation: 'Sog‘lom kattalarda tinch holatdagi yurak urishi odatda daqiqasiga 60–80 marta bo‘ladi.', difficulty: 'Easy' },
    { id: 'p-2', subjectId: 'physiology', prompt: 'Nafas olishning asosiy boshqaruv markazi qayerda?', options: ['Orqa miyada', 'Uzunchoq miyada', 'Miyachada', 'Talamusda'], correctIndex: 1, explanation: 'Uzunchoq miya va ko‘prik nafas ritmini boshqaruvchi asosiy markazlarni o‘z ichiga oladi.', difficulty: 'Medium' },
    { id: 'p-3', subjectId: 'physiology', prompt: 'Gemoglobinning asosiy vazifasi nima?', options: ['Glyukozani parchalash', 'Kislorodni tashish', 'Gormon ishlab chiqarish', 'Suvni filtrlash'], correctIndex: 1, explanation: 'Gemoglobin eritrotsitlarda kislorodni o‘pkadan to‘qimalarga tashiydi.', difficulty: 'Easy' },
  ],
  biochemistry: [
    { id: 'b-1', subjectId: 'biochemistry', prompt: 'Hujayraning asosiy energiya valyutasi qaysi molekula?', options: ['DNK', 'ATP', 'RNK', 'Kollagen'], correctIndex: 1, explanation: 'ATP hujayra ichidagi ko‘pchilik energiya talab qiluvchi jarayonlarni ta’minlaydi.', difficulty: 'Easy' },
    { id: 'b-2', subjectId: 'biochemistry', prompt: 'Glikoliz jarayoni hujayraning qaysi qismida kechadi?', options: ['Yadroda', 'Sitoplazmada', 'Mitoxondriya matriksida', 'Lizosomada'], correctIndex: 1, explanation: 'Glikoliz kislorod mavjudligidan qat’i nazar sitoplazmada sodir bo‘ladi.', difficulty: 'Medium' },
    { id: 'b-3', subjectId: 'biochemistry', prompt: 'Qaysi vitamin kalsiy almashinuvida muhim rol o‘ynaydi?', options: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin B1'], correctIndex: 2, explanation: 'Vitamin D ichakda kalsiy so‘rilishini va suyak mineralizatsiyasini qo‘llab-quvvatlaydi.', difficulty: 'Easy' },
  ],
  microbiology: [
    { id: 'm-1', subjectId: 'microbiology', prompt: 'Gram bo‘yashda binafsha rangni saqlab qoluvchi bakteriyalar qanday ataladi?', options: ['Gram-manfiy', 'Gram-musbat', 'Spora hosil qiluvchi', 'Kislotaga chidamli'], correctIndex: 1, explanation: 'Qalin peptidoglikan qavati kristall violet kompleksini ushlab qoladi.', difficulty: 'Medium' },
    { id: 'm-2', subjectId: 'microbiology', prompt: 'Viruslar ko‘payishi uchun nimaga muhtoj?', options: ['Mustaqil metabolizmga', 'Tirik hujayraga', 'Faqat suvga', 'Kislorodsiz muhitga'], correctIndex: 1, explanation: 'Viruslar majburiy hujayra ichi parazitlari bo‘lib, tirik hujayra mexanizmlaridan foydalanadi.', difficulty: 'Easy' },
  ],
  pharmacology: [
    { id: 'ph-1', subjectId: 'pharmacology', prompt: 'Paratsetamolning asosiy terapevtik ta’siri qaysi?', options: ['Antipiretik va analgetik', 'Antikoagulyant', 'Bronxodilatator', 'Diuretik'], correctIndex: 0, explanation: 'Paratsetamol og‘riqni kamaytiradi va isitmani tushiradi.', difficulty: 'Easy' },
    { id: 'ph-2', subjectId: 'pharmacology', prompt: 'Antibiotiklar asosan qaysi organizmlarga qarshi ishlaydi?', options: ['Viruslarga', 'Bakteriyalarga', 'Gijjalarga', 'Allergenlarga'], correctIndex: 1, explanation: 'Antibiotiklar bakterial hujayraning muhim jarayonlarini nishonga oladi.', difficulty: 'Easy' },
  ],
  pathology: [
    { id: 'pa-1', subjectId: 'pathology', prompt: 'Yallig‘lanishning klassik belgilaridan biri qaysi?', options: ['Rangparlik', 'Qizarish', 'Bradikardiya', 'Gipotermiya'], correctIndex: 1, explanation: 'Qizarish, shish, issiqlik, og‘riq va funksiya buzilishi klassik belgilar hisoblanadi.', difficulty: 'Easy' },
    { id: 'pa-2', subjectId: 'pathology', prompt: 'Gipertrofiya nimani anglatadi?', options: ['Hujayra sonining kamayishi', 'Hujayra hajmining kattalashishi', 'To‘qima nekrozi', 'Yangi tomir hosil bo‘lishi'], correctIndex: 1, explanation: 'Gipertrofiya hujayralar hajmining ortishi natijasida a’zo kattalashishidir.', difficulty: 'Medium' },
  ],
};

const achievements: Achievement[] = [
  { id: 'first-step', title: 'Birinchi qadam', description: 'Birinchi testni yakunlang', icon: 'play', progress: 100, unlocked: true, tone: 'blue' },
  { id: 'week-focus', title: 'Hafta diqqatida', description: '7 kunlik streak hosil qiling', icon: 'flame', progress: 100, unlocked: true, tone: 'amber' },
  { id: 'anatomy-guide', title: 'Anatomiya bilimdoni', description: 'Anatomiya bo‘yicha 50 savol', icon: 'layers', progress: 68, unlocked: false, tone: 'violet' },
  { id: 'battle-ready', title: 'Jangovar tayyor', description: '5 ta battle o‘ynang', icon: 'swords', progress: 60, unlocked: false, tone: 'emerald' },
  { id: 'perfect-score', title: 'Aniq javob', description: 'Testda 100% natija', icon: 'target', progress: 42, unlocked: false, tone: 'rose' },
  { id: 'night-owl', title: 'Tungi izlanish', description: '21:00 dan keyin 10 test', icon: 'moon', progress: 30, unlocked: false, tone: 'slate' },
];

const iconMap: Record<string, LucideIcon> = {
  activity: HeartPulse,
  award: Award,
  bell: Bell,
  book: BookOpen,
  brain: Brain,
  flame: Flame,
  layers: Layers3,
  lock: LockKeyhole,
  moon: Moon,
  play: Play,
  pill: ShieldCheck,
  microscope: Brain,
  flask: Sparkles,
  'heart-pulse': HeartPulse,
  swords: Swords,
  target: Trophy,
};

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value));
};

function AppIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = iconMap[name] ?? BookOpen;
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />;
}

function Avatar({ initials, color = '#2563EB', small = false }: { initials: string; color?: string; small?: boolean }) {
  return (
    <span
      className={`${small ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
      style={{ backgroundColor: color }}
      aria-label={`${initials} avatar`}
      data-testid={`avatar-${initials}`}
    >
      {initials}
    </span>
  );
}

function ProgressBar({ value, color = '#2563EB', label }: { value: number; color?: string; label?: string }) {
  return (
    <div className="w-full" aria-label={label}>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ThemeButton({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      aria-label={theme === 'light' ? 'Tungi rejimni yoqish' : 'Yorug‘ rejimni yoqish'}
      data-testid="button-theme-toggle"
    >
      {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
    </button>
  );
}

const navItems = [
  { href: '/dashboard', label: 'Umumiy', icon: House },
  { href: '/subjects', label: 'Fanlar', icon: BookOpen },
  { href: '/battle/lobby', label: 'Battle', icon: Swords },
  { href: '/leaderboard', label: 'Reyting', icon: Trophy },
];

function AppShell({ children, theme, onToggle }: { children: ReactNode; theme: Theme; onToggle: () => void }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => href === '/dashboard' ? location === href : location.startsWith(href);
  return (
    <div className="min-h-[100dvh] bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground lg:flex">
        <Link href="/dashboard" className="mb-9 flex items-center gap-3 px-3" data-testid="link-sidebar-logo">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Brain size={22} /></span>
          <span><span className="block text-[17px] font-semibold tracking-tight">Med<span className="text-blue-300">Quiz</span></span><span className="block text-[10px] uppercase tracking-[0.18em] text-slate-400">study companion</span></span>
        </Link>
        <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">O‘rganish</div>
        <nav className="space-y-1" aria-label="Asosiy navigatsiya">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${isActive(item.href) ? 'bg-blue-500/15 font-semibold text-blue-200' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`} data-testid={`link-nav-${item.label}`}><Icon size={18} /><span>{item.label}</span>{isActive(item.href) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-300" />}</Link>;
          })}
          <Link href="/achievements" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${isActive('/achievements') ? 'bg-blue-500/15 font-semibold text-blue-200' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`} data-testid="link-nav-achievements"><Award size={18} /><span>Yutuqlar</span></Link>
        </nav>
        <div className="mt-auto">
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between text-xs"><span className="text-slate-400">Kunlik maqsad</span><span className="font-semibold text-blue-200">3 / 5</span></div>
            <ProgressBar value={60} color="#60A5FA" />
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Yana 2 ta savol. Bugungi streakni ushlang.</p>
          </div>
          <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5" data-testid="link-sidebar-profile">
            <Avatar initials={user.initials} color={user.avatarColor} small /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{user.name}</span><span className="block text-[11px] text-slate-500">Level {user.level}</span></span><MoreHorizontal size={17} className="text-slate-500" />
          </Link>
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:ml-[248px] lg:px-8">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted lg:hidden" aria-label="Navigatsiya menyusini ochish" data-testid="button-mobile-menu">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          <div className="lg:hidden"><Link href="/dashboard" className="flex items-center gap-2 font-semibold" data-testid="link-mobile-logo"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Brain size={17} /></span>Med<span className="text-primary">Quiz</span></Link></div>
          <div className="hidden lg:block"><span className="text-sm text-muted-foreground">Bugun, 24 may</span><h1 className="text-base font-semibold">O‘qishni davom ettiring</h1></div>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeButton theme={theme} onToggle={onToggle} />
          <button type="button" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Bildirishnomalar" data-testid="button-notifications"><Bell size={19} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" /></button>
          <Link href="/profile" className="ml-1" aria-label="Profilga o‘tish" data-testid="link-header-profile"><Avatar initials={user.initials} color={user.avatarColor} small /></Link>
        </div>
      </header>
      {menuOpen && <div className="fixed inset-x-0 top-[68px] z-20 border-b border-border bg-card p-3 shadow-lg lg:hidden"><nav className="grid grid-cols-2 gap-2">{[...navItems, { href: '/achievements', label: 'Yutuqlar', icon: Award }].map((item) => { const Icon = item.icon; return <Link key={item.href} onClick={() => setMenuOpen(false)} href={item.href} className="flex items-center gap-2 rounded-xl p-3 text-sm hover:bg-muted" data-testid={`link-mobile-${item.label}`}><Icon size={17} className="text-primary" />{item.label}</Link>; })}</nav></div>}
      <main className="min-h-[calc(100dvh-68px)] pb-24 lg:ml-[248px] lg:pb-8">{children}</main>
      <nav className="fixed inset-x-3 bottom-3 z-30 flex h-[66px] items-center justify-around rounded-2xl border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur lg:hidden" aria-label="Mobil navigatsiya">
        {navItems.concat({ href: '/profile', label: 'Profil', icon: UserRound }).map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={`flex h-full min-w-[52px] flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] ${isActive(item.href) ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground'}`} data-testid={`link-bottom-${item.label}`}><Icon size={18} /><span>{item.label}</span></Link>; })}
      </nav>
    </div>
  );
}

function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">{children}</div>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</div><h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[30px]">{title}</h2>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</div>;
}

function Home({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return <div className="min-h-[100dvh] overflow-hidden bg-background app-grid">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="flex items-center gap-3" data-testid="link-home-logo"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Brain size={22} /></span><span className="font-semibold tracking-tight">Med<span className="text-primary">Quiz</span></span></Link>
      <div className="flex items-center gap-2"><span className="hidden text-xs text-muted-foreground sm:inline">O‘qish yo‘lingiz sizdan boshlanadi</span><ThemeButton theme={theme} onToggle={onToggle} /><Link href="/dashboard" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-home-signin">Kirish</Link></div>
    </header>
    <main className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-20 lg:pb-24 lg:pt-20">
      <div className="animate-rise">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Tibbiyot talabalariga mo‘ljallangan</div>
        <h1 className="max-w-2xl text-[42px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-6xl lg:text-[70px]">Imtihonlarga <span className="text-primary">ishonch</span> bilan kiring.</h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Har kuni bir nechta aqlli savol. O‘zbek tibbiyot talabalari uchun tuzilgan qisqa mashg‘ulotlar bilan bilimni mustahkamlang.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-blue-500/15 transition-transform hover:-translate-y-0.5" data-testid="link-home-start">Birinchi testni boshlash <ChevronRight size={17} /></Link><Link href="/subjects" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted" data-testid="link-home-subjects">Fanlarni ko‘rish</Link></div>
        <div className="mt-12 flex items-center gap-6 text-sm"><div><div className="font-semibold">6</div><div className="text-muted-foreground">asosiy fan</div></div><div className="h-8 w-px bg-border" /><div><div className="font-semibold">1,120+</div><div className="text-muted-foreground">savol</div></div><div className="h-8 w-px bg-border" /><div><div className="font-semibold">10 daqiqa</div><div className="text-muted-foreground">kunlik odat</div></div></div>
      </div>
      <div className="relative animate-rise [animation-delay:100ms]">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative rounded-[24px] border border-border bg-card p-4 shadow-2xl shadow-slate-900/10 sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Bugungi yo‘l</p><p className="mt-1 text-lg font-semibold">Kichik qadamlar</p></div><span className="rounded-lg bg-amber-500/10 p-2 text-amber-500"><Flame size={19} /></span></div>
          <div className="rounded-2xl bg-primary p-5 text-primary-foreground"><div className="flex items-start justify-between"><div><p className="text-xs text-blue-100">Keyingi mashg‘ulot</p><h3 className="mt-1 text-xl font-semibold">Anatomiya</h3></div><span className="rounded-lg bg-white/15 p-2"><Layers3 size={20} /></span></div><div className="mt-8 flex items-end justify-between"><div><p className="text-3xl font-semibold">12</p><p className="text-xs text-blue-100">savol · 8 daqiqa</p></div><Link href="/quiz/anatomy" className="rounded-xl bg-white px-3.5 py-2.5 text-xs font-semibold text-primary transition-transform hover:-translate-y-0.5" data-testid="link-hero-quiz">Boshlash</Link></div></div>
          <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-border p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">Haftalik XP</span><BarChart3 size={16} className="text-emerald-500" /></div><p className="text-xl font-semibold">+640</p><p className="mt-1 text-[11px] text-emerald-500">12% o‘sish</p></div><div className="rounded-xl border border-border p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">Streak</span><Flame size={16} className="text-amber-500" /></div><p className="text-xl font-semibold">7 kun</p><p className="mt-1 text-[11px] text-muted-foreground">Bugun davom eting</p></div></div>
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-muted p-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500"><Check size={16} /></span><p className="text-xs leading-5"><span className="font-medium">Bugungi maqsadning 60%</span><br /><span className="text-muted-foreground">Yana 2 ta javob qoldi</span></p></div>
        </div>
      </div>
    </main>
  </div>;
}

function Dashboard() {
  const progress = readStorage<Record<string, number>>('medquiz-progress', {});
  const visibleSubjects = subjects.slice(0, 3);
  return <PageContainer>
    <PageHeading eyebrow="Umumiy ko‘rinish" title={`Assalomu alaykum, ${user.name.split(' ')[0]}`} description="Bugun ham bir oz o‘rganish — ertangi ishonch uchun katta qadam." action={<div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400"><Flame size={15} /> {user.streak} kunlik streak</div>} />
    <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
      <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg shadow-blue-500/10 sm:p-8"><div className="absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-10 rounded-full border-[28px] border-white/10" /><div className="relative"><div className="flex items-start justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-100">Tavsiya etilgan</p><h3 className="mt-3 text-2xl font-semibold">Anatomiya bilan davom eting</h3><p className="mt-2 max-w-md text-sm leading-6 text-blue-100">Kecha qolgan mavzuni 10 daqiqalik test bilan mustahkamlang.</p></div><span className="rounded-xl bg-white/15 p-3"><Layers3 size={25} /></span></div><div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/quiz/anatomy" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-primary transition-transform hover:-translate-y-0.5" data-testid="link-dashboard-next-action"><Play size={16} fill="currentColor" /> Testni boshlash</Link><span className="text-xs text-blue-100">12 savol · taxminan 8 daqiqa</span></div></div></div>
      <div className="card-surface rounded-2xl p-6"><div className="flex items-center justify-between"><h3 className="font-semibold">Kunlik maqsad</h3><span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500"><Check size={17} /></span></div><p className="mt-5 text-3xl font-semibold">3 <span className="text-base font-normal text-muted-foreground">/ 5 savol</span></p><ProgressBar value={60} color="#10B981" label="Kunlik maqsad 60 foiz" /><p className="mt-4 text-xs leading-5 text-muted-foreground">Yana 2 ta savolga javob bering va bugungi maqsadni yoping.</p><Link href="/subjects" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" data-testid="link-dashboard-go-subjects">Mashqni tanlash <ChevronRight size={14} /></Link></div>
    </section>
    <section className="mt-7 grid gap-4 sm:grid-cols-3"><StatCard icon={<BarChart3 size={18} />} label="O‘rtacha natija" value={`${user.averageScore}%`} note="So‘nggi 30 kun" tone="blue" /><StatCard icon={<Sparkles size={18} />} label="Jami XP" value={user.xp.toLocaleString('uz-UZ')} note="Level 12" tone="amber" /><StatCard icon={<Trophy size={18} />} label="Reyting" value="#24" note="Bu hafta" tone="violet" /></section>
    <section className="mt-9"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-semibold">Davom etayotgan fanlar</h3><p className="mt-1 text-xs text-muted-foreground">O‘zlashtirishingizni kuzatib boring</p></div><Link href="/subjects" className="text-xs font-semibold text-primary hover:underline" data-testid="link-dashboard-all-subjects">Barchasi</Link></div><div className="grid gap-4 md:grid-cols-3">{visibleSubjects.map((subject) => <SubjectMiniCard key={subject.id} subject={{ ...subject, progress: progress[subject.id] ?? subject.progress }} />)}</div></section>
    <section className="mt-9 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="card-surface rounded-2xl p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold">So‘nggi natijalar</h3><p className="mt-1 text-xs text-muted-foreground">Bilim yo‘lingizdagi kichik g‘alabalar</p></div><Link href="/profile" className="text-xs font-semibold text-primary" data-testid="link-dashboard-history">Tarix</Link></div><div className="space-y-1">{['Anatomiya', 'Fiziologiya', 'Biokimyo'].map((name, index) => <div key={name} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-muted"><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${index === 0 ? 'bg-blue-500/10 text-blue-500' : index === 1 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}><BookOpen size={17} /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{name}</p><p className="text-[11px] text-muted-foreground">{index + 2} kun oldin · 10 savol</p></div><span className="text-sm font-semibold text-emerald-500">{[82, 76, 68][index]}%</span><ChevronRight size={15} className="text-muted-foreground" /></div>)}</div></div><div className="card-surface rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Yaqin yutuq</h3><p className="mt-1 text-xs text-muted-foreground">Anatomiya bilimdoni</p></div><span className="rounded-lg bg-violet-500/10 p-2 text-violet-500"><Award size={18} /></span></div><div className="mt-6 flex items-end justify-between"><span className="text-2xl font-semibold">34 <span className="text-sm font-normal text-muted-foreground">/ 50 savol</span></span><span className="text-xs font-medium text-violet-500">68%</span></div><div className="mt-3"><ProgressBar value={68} color="#8B5CF6" /></div><Link href="/achievements" className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-primary" data-testid="link-dashboard-achievements">Barcha yutuqlar <ChevronRight size={14} /></Link></div></section>
  </PageContainer>;
}

function StatCard({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note: string; tone: 'blue' | 'amber' | 'violet' }) {
  const toneClass = { blue: 'bg-blue-500/10 text-blue-500', amber: 'bg-amber-500/10 text-amber-500', violet: 'bg-violet-500/10 text-violet-500' }[tone];
  return <div className="card-surface rounded-2xl p-5"><span className={`mb-4 inline-flex rounded-lg p-2.5 ${toneClass}`}>{icon}</span><p className="text-xs text-muted-foreground">{label}</p><div className="mt-1 flex items-baseline justify-between gap-2"><p className="text-2xl font-semibold">{value}</p><span className="text-[11px] text-muted-foreground">{note}</span></div></div>;
}

function SubjectMiniCard({ subject }: { subject: Subject }) {
  return <Link href={`/quiz/${subject.id}`} className="card-surface group rounded-2xl p-5 transition-transform hover:-translate-y-1" data-testid={`card-dashboard-subject-${subject.id}`}><div className="flex items-start justify-between"><span className="rounded-xl p-2.5" style={{ color: subject.color, backgroundColor: `${subject.color}18` }}><AppIcon name={subject.icon} size={20} /></span><ChevronRight size={17} className="text-muted-foreground transition-transform group-hover:translate-x-1" /></div><h4 className="mt-5 font-semibold">{subject.name}</h4><p className="mt-1 text-xs text-muted-foreground">{subject.shortDescription}</p><div className="mt-5 flex items-center justify-between text-xs"><span className="text-muted-foreground">{subject.progress}% yakunlandi</span><span className="font-medium" style={{ color: subject.color }}>{subject.questionCount} savol</span></div><div className="mt-2"><ProgressBar value={subject.progress} color={subject.color} /></div></Link>;
}

function Subjects() {
  const [filter, setFilter] = useState('Barchasi');
  const progress = readStorage<Record<string, number>>('medquiz-progress', {});
  const categories = ['Barchasi', 'Asosiy fanlar', 'Klinik fanlar'];
  const shown = subjects.filter((subject) => filter === 'Barchasi' || subject.category === filter);
  return <PageContainer><PageHeading eyebrow="Kutubxona" title="Fanlar" description="Imtihon rejangizga mos fanni tanlang va bilimni qisqa mashg‘ulotlarda mustahkamlang." action={<Link href="/quiz/anatomy" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm" data-testid="link-subjects-quick-start"><Play size={16} fill="currentColor" /> Tezkor test</Link>} /><div className="mb-7 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Fan kategoriyalari">{categories.map((category) => <button type="button" key={category} onClick={() => setFilter(category)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${filter === category ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`} data-testid={`button-filter-${category}`}>{category}</button>)}</div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{shown.map((subject, index) => <SubjectCard key={subject.id} subject={{ ...subject, progress: progress[subject.id] ?? subject.progress }} index={index} />)}</div><div className="mt-7 flex items-start gap-3 rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4 text-sm"><Info size={18} className="mt-0.5 shrink-0 text-primary" /><p className="leading-6 text-muted-foreground">Savollar bosqichma-bosqich murakkablashadi. Xato javoblar ham o‘rganishning bir qismi — har bir javobdan keyin qisqa izoh beriladi.</p></div></PageContainer>;
}

function SubjectCard({ subject, index }: { subject: Subject; index: number }) {
  return <article className="card-surface group relative overflow-hidden rounded-2xl p-5 transition-transform hover:-translate-y-1 sm:p-6" style={{ animationDelay: `${index * 50}ms` }}><div className="absolute right-0 top-0 h-20 w-20 rounded-bl-[40px] opacity-10" style={{ backgroundColor: subject.color }} /><div className="relative"><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: subject.color, backgroundColor: `${subject.color}18` }}><AppIcon name={subject.icon} size={22} /></span><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">{subject.category}</span></div><h3 className="mt-5 text-lg font-semibold">{subject.name}</h3><p className="mt-1 text-xs text-muted-foreground">{subject.shortDescription}</p><div className="mt-6 flex items-end justify-between"><div><span className="text-2xl font-semibold">{subject.progress}%</span><span className="ml-1 text-xs text-muted-foreground">o‘zlashtirish</span></div><span className="text-xs text-muted-foreground">{subject.questionCount} savol</span></div><div className="mt-3"><ProgressBar value={subject.progress} color={subject.color} /></div><Link href={`/quiz/${subject.id}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary" data-testid={`link-subject-start-${subject.id}`}>Mashqni boshlash <ChevronRight size={15} /></Link></div></article>;
}

function Quiz({ theme }: { theme: Theme }) {
  const params = useParams<{ subjectId: string }>();
  const subject = subjects.find((item) => item.id === params.subjectId) ?? subjects[0];
  const quizQuestions = questions[subject.id] ?? questions.anatomy;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [seconds, setSeconds] = useState(90);
  const currentQuestion = quizQuestions[current];

  useEffect(() => {
    if (finished || submitted) return;
    const timer = window.setInterval(() => setSeconds((value) => value <= 1 ? 0 : value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [finished, submitted]);

  useEffect(() => {
    if (seconds === 0 && !finished) setFinished(true);
  }, [seconds, finished]);

  const completeQuiz = (finalScore: number) => {
    setScore(finalScore);
    setFinished(true);
    const progress = readStorage<Record<string, number>>('medquiz-progress', {});
    writeStorage('medquiz-progress', { ...progress, [subject.id]: Math.min(100, Math.max(progress[subject.id] ?? subject.progress, (progress[subject.id] ?? subject.progress) + 4)) });
    const history = readStorage<Array<{ subject: string; score: number; date: string }>>('medquiz-history', []);
    writeStorage('medquiz-history', [{ subject: subject.name, score: finalScore, date: new Date().toISOString() }, ...history].slice(0, 8));
  };

  const handleNext = () => {
    if (selected === null) return;
    const nextScore = score + (selected === currentQuestion.correctIndex ? 1 : 0);
    if (current === quizQuestions.length - 1) completeQuiz(nextScore);
    else { setScore(nextScore); setCurrent((value) => value + 1); setSelected(null); setSubmitted(false); }
  };

  if (finished) return <PageContainer><div className="mx-auto max-w-2xl py-8 text-center sm:py-16"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500"><Trophy size={38} /></div><p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Mashg‘ulot yakunlandi</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{subject.name} natijasi</h2><p className="mt-3 text-sm text-muted-foreground">Bugun o‘zingiz uchun yana bir qadam tashladingiz.</p><div className="card-surface mx-auto mt-8 grid max-w-md grid-cols-3 divide-x divide-border rounded-2xl p-5"><div><p className="text-2xl font-semibold">{score}/{quizQuestions.length}</p><p className="mt-1 text-[11px] text-muted-foreground">To‘g‘ri javob</p></div><div><p className="text-2xl font-semibold text-emerald-500">{Math.round((score / quizQuestions.length) * 100)}%</p><p className="mt-1 text-[11px] text-muted-foreground">Natija</p></div><div><p className="text-2xl font-semibold text-amber-500">+{score * 15}</p><p className="mt-1 text-[11px] text-muted-foreground">XP olindi</p></div></div><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/subjects" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-muted" data-testid="link-quiz-back-subjects">Fanlarga qaytish</Link><button type="button" onClick={() => window.location.reload()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground" data-testid="button-quiz-retry"><RotateCcw size={16} /> Qayta ishlash</button></div></div></PageContainer>;

  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remaining = (seconds % 60).toString().padStart(2, '0');
  return <PageContainer><div className="mx-auto max-w-3xl"><div className="mb-7 flex items-center justify-between"><Link href="/subjects" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground" data-testid="link-quiz-back"><ChevronRight size={17} className="rotate-180" /> Fanlarga qaytish</Link><div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${seconds < 20 ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'}`}><Clock3 size={15} /> {minutes}:{remaining}</div></div><div className="mb-8 flex items-center gap-3"><div className="flex-1"><div className="flex justify-between text-xs text-muted-foreground"><span>{subject.name}</span><span>{current + 1} / {quizQuestions.length}</span></div><div className="mt-2"><ProgressBar value={((current + 1) / quizQuestions.length) * 100} color={subject.color} /></div></div><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: subject.color, backgroundColor: `${subject.color}18` }}><AppIcon name={subject.icon} size={19} /></span></div><div className="card-surface rounded-2xl p-5 sm:p-8"><div className="mb-7 flex items-center justify-between"><span className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">{currentQuestion.difficulty === 'Easy' ? 'Oson' : currentQuestion.difficulty === 'Medium' ? 'O‘rta' : 'Qiyin'}</span><span className="text-xs text-muted-foreground">+15 XP</span></div><h2 className="text-xl font-semibold leading-8 sm:text-2xl">{currentQuestion.prompt}</h2><div className="mt-7 space-y-3" role="radiogroup" aria-label="Javob variantlari">{currentQuestion.options.map((option, index) => { const isCorrect = index === currentQuestion.correctIndex; const isSelected = selected === index; const stateClass = submitted && isCorrect ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : submitted && isSelected ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300' : isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50 hover:bg-muted'; return <button type="button" key={option} onClick={() => !submitted && setSelected(index)} disabled={submitted} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition-colors ${stateClass}`} role="radio" aria-checked={isSelected} data-testid={`button-answer-${current}-${index}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${submitted && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : submitted && isSelected ? 'border-red-500 bg-red-500 text-white' : isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}>{submitted && isCorrect ? <Check size={14} /> : String.fromCharCode(65 + index)}</span><span className="flex-1">{option}</span>{submitted && isCorrect && <Check size={17} className="text-emerald-500" />}</button>; })}</div>{submitted && <div className={`mt-6 rounded-xl p-4 text-sm leading-6 ${selected === currentQuestion.correctIndex ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}><div className="mb-1 flex items-center gap-2 font-semibold">{selected === currentQuestion.correctIndex ? <Check size={16} /> : <X size={16} />} {selected === currentQuestion.correctIndex ? 'To‘g‘ri javob' : 'To‘g‘ri javobni ko‘rib chiqing'}</div>{currentQuestion.explanation}</div>}<div className="mt-7 flex justify-end">{!submitted ? <button type="button" onClick={() => setSubmitted(true)} disabled={selected === null} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-submit-answer">Javobni tekshirish</button> : <button type="button" onClick={handleNext} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground" data-testid="button-next-question">{current === quizQuestions.length - 1 ? 'Natijani ko‘rish' : 'Keyingi savol'} <ChevronRight size={16} /></button>}</div></div></div></PageContainer>;
}

function BattleLobby() {
  const [, setLocation] = useLocation();
  const [selectedSubject, setSelectedSubject] = useState('anatomy');
  const [questionCount, setQuestionCount] = useState('10');
  const [joinCode, setJoinCode] = useState('');
  const [notice, setNotice] = useState('');
  const createRoom = () => setLocation(`/battle/room-${Math.floor(1000 + Math.random() * 8999)}`);
  const joinRoom = () => joinCode.trim() ? setLocation(`/battle/${joinCode.trim().toLowerCase()}`) : setNotice('Avval xona kodini kiriting.');
  return <PageContainer><PageHeading eyebrow="Do‘stona bellashuv" title="Battle maydoni" description="Kursdoshlaringiz bilan bilimni sinang. Tezlik emas, aniqlik g‘olibni belgilaydi." /><div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><section className="card-surface rounded-2xl p-5 sm:p-7"><div className="mb-7 flex items-start justify-between"><div><h3 className="text-lg font-semibold">Yangi battle yarating</h3><p className="mt-1 text-xs text-muted-foreground">Sozlang va xona kodini do‘stlaringizga yuboring.</p></div><span className="rounded-xl bg-primary/10 p-3 text-primary"><Swords size={21} /></span></div><label className="block text-xs font-semibold text-muted-foreground" htmlFor="battle-subject">Fan</label><select id="battle-subject" value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none" data-testid="select-battle-subject">{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select><div className="mt-6"><span className="text-xs font-semibold text-muted-foreground">Savollar soni</span><div className="mt-2 grid grid-cols-3 gap-2">{['5', '10', '15'].map((count) => <button type="button" key={count} onClick={() => setQuestionCount(count)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${questionCount === count ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted'}`} data-testid={`button-battle-count-${count}`}>{count} savol</button>)}</div></div><button type="button" onClick={createRoom} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground" data-testid="button-create-battle"><Swords size={17} /> Battle yaratish</button></section><section className="card-surface rounded-2xl p-5 sm:p-7"><div className="mb-7"><span className="inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-500"><UsersRound size={21} /></span><h3 className="mt-5 text-lg font-semibold">Mavjud xonaga qo‘shiling</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Do‘stingiz yuborgan xona kodini kiriting.</p></div><label className="block text-xs font-semibold text-muted-foreground" htmlFor="join-code">Xona kodi</label><input id="join-code" value={joinCode} onChange={(event) => { setJoinCode(event.target.value); setNotice(''); }} placeholder="Masalan, room-2481" className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none placeholder:text-muted-foreground" data-testid="input-join-code" /><button type="button" onClick={joinRoom} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3.5 text-sm font-semibold hover:bg-muted" data-testid="button-join-battle">Xonaga qo‘shilish <ChevronRight size={16} /></button>{notice && <p className="mt-3 text-xs text-red-500" role="alert">{notice}</p>}<div className="mt-8 border-t border-border pt-5"><p className="text-xs font-semibold">Battle qanday ishlaydi?</p><div className="mt-3 space-y-3 text-xs text-muted-foreground"><p className="flex gap-2"><span className="font-semibold text-primary">01</span> Xona yarating yoki kod orqali qo‘shiling.</p><p className="flex gap-2"><span className="font-semibold text-primary">02</span> Bir xil savollarga javob bering.</p><p className="flex gap-2"><span className="font-semibold text-primary">03</span> Natijani reytingda ko‘ring.</p></div></div></section></div></PageContainer>;
}

function BattleRoom() {
  const params = useParams<{ roomId: string }>();
  const [, setLocation] = useLocation();
  const battleQuestions = questions.physiology;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [players, setPlayers] = useState<BattlePlayer[]>([
    { id: 'user-1', name: 'Madina Karimova', initials: 'MK', score: 0, progress: 0, isCurrentUser: true },
    { id: 'user-2', name: 'Jasur A.', initials: 'JA', score: 15, progress: 34 },
    { id: 'user-3', name: 'Nilufar R.', initials: 'NR', score: 10, progress: 24 },
  ]);
  const question = battleQuestions[current];
  const answer = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    const correct = index === question.correctIndex;
    setPlayers((items) => items.map((player) => player.isCurrentUser ? { ...player, score: player.score + (correct ? 15 : 0), progress: Math.round(((current + 1) / battleQuestions.length) * 100) } : player));
  };
  const next = () => {
    if (current >= battleQuestions.length - 1) setDone(true);
    else { setCurrent((value) => value + 1); setSelected(null); }
  };
  const rankedPlayers = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  if (done) return <PageContainer><div className="mx-auto max-w-2xl py-10 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500"><Trophy size={38} /></div><p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Battle yakunlandi</p><h2 className="mt-3 text-3xl font-semibold">Yaxshi kurashdingiz</h2><p className="mt-3 text-sm text-muted-foreground">Natijangiz saqlandi. Keyingi bahsda yana bir qadam oldinga chiqing.</p><div className="card-surface mx-auto mt-8 max-w-sm rounded-2xl p-4">{rankedPlayers.map((player, index) => <div key={player.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0"><span className="w-5 text-sm font-semibold text-muted-foreground">#{index + 1}</span><Avatar initials={player.initials} color={player.isCurrentUser ? user.avatarColor : '#64748B'} small /><span className="flex-1 text-left text-sm font-medium">{player.name}</span><span className="text-sm font-semibold">{player.score} XP</span></div>)}</div><button type="button" onClick={() => setLocation('/battle/lobby')} className="mt-7 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground" data-testid="button-battle-again">Yangi battle</button></div></PageContainer>;
  return <PageContainer><div className="mx-auto max-w-4xl"><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Jonli xona · {params.roomId}</div><h2 className="mt-2 text-2xl font-semibold">Fiziologiya battle</h2></div><div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs font-medium"><UsersRound size={15} /> 3 ishtirokchi</div></div><div className="grid gap-5 lg:grid-cols-[1fr_300px]"><section className="card-surface rounded-2xl p-5 sm:p-8"><div className="mb-6 flex items-center justify-between"><span className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">Savol {current + 1} / {battleQuestions.length}</span><span className="text-xs text-muted-foreground">+15 XP</span></div><ProgressBar value={((current + 1) / battleQuestions.length) * 100} color="#2563EB" /><h3 className="mt-8 text-xl font-semibold leading-8">{question.prompt}</h3><div className="mt-7 grid gap-3 sm:grid-cols-2">{question.options.map((option, index) => <button type="button" key={option} disabled={selected !== null} onClick={() => answer(index)} className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-colors ${selected === index ? (index === question.correctIndex ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10') : selected !== null && index === question.correctIndex ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-primary/50 hover:bg-muted'}`} data-testid={`button-battle-answer-${index}`}><span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-xs font-semibold">{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{selected !== null && <div className="mt-6 flex flex-col justify-between gap-4 rounded-xl bg-muted p-4 sm:flex-row sm:items-center"><p className="text-xs text-muted-foreground">{selected === question.correctIndex ? 'Ajoyib, to‘g‘ri javob.' : `To‘g‘ri javob: ${question.options[question.correctIndex]}`}</p><button type="button" onClick={next} className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground" data-testid="button-battle-next">{current === battleQuestions.length - 1 ? 'Natijani ko‘rish' : 'Keyingi savol'}</button></div>}</section><aside className="card-surface rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Jonli reyting</h3><span className="text-[11px] text-muted-foreground">yangilanmoqda</span></div><div className="space-y-2">{rankedPlayers.map((player, index) => <div key={player.id} className={`flex items-center gap-2 rounded-xl p-3 ${player.isCurrentUser ? 'bg-primary/5' : ''}`}><span className="w-4 text-xs font-semibold text-muted-foreground">{index + 1}</span><Avatar initials={player.initials} color={player.isCurrentUser ? user.avatarColor : '#64748B'} small /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{player.name}</p><div className="mt-1"><ProgressBar value={player.progress} color={player.isCurrentUser ? '#2563EB' : '#94A3B8'} /></div></div><span className="text-xs font-semibold">{player.score}</span></div>)}</div></aside></div></div></PageContainer>;
}

function Leaderboard() {
  const [tab, setTab] = useState('Haftalik');
  const people = [
    { rank: 1, name: 'Aziza Tursunova', initials: 'AT', xp: 3240, change: '+2', color: '#8B5CF6' },
    { rank: 2, name: 'Bekzod Rahimov', initials: 'BR', xp: 2985, change: '+1', color: '#10B981' },
    { rank: 3, name: 'Madina Karimova', initials: 'MK', xp: 2480, change: '—', color: user.avatarColor, current: true },
    { rank: 4, name: 'Shahnoza Aliyeva', initials: 'SA', xp: 2310, change: '-2', color: '#F59E0B' },
    { rank: 5, name: 'Diyorbek Sodiqov', initials: 'DS', xp: 2180, change: '+3', color: '#0EA5E9' },
    { rank: 6, name: 'Malika Jo‘rayeva', initials: 'MJ', xp: 1975, change: '—', color: '#EF4444' },
  ];
  return <PageContainer><PageHeading eyebrow="Sog‘lom raqobat" title="Reyting" description="O‘zingizni boshqalar bilan emas, kechagi o‘zingiz bilan solishtiring. Har bir XP — bir qadam." action={<div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400"><Trophy size={15} /> Sizning o‘rningiz #24</div>} /><div className="mb-6 flex w-full max-w-md rounded-xl bg-muted p-1">{['Kunlik', 'Haftalik', 'All time'].map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${tab === item ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`} data-testid={`button-leaderboard-${item}`}>{item}</button>)}</div><div className="grid gap-5 lg:grid-cols-[1fr_330px]"><section className="card-surface overflow-hidden rounded-2xl"><div className="grid grid-cols-[44px_1fr_80px_55px] items-center gap-3 border-b border-border px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span>#</span><span>Talaba</span><span className="text-right">XP</span><span className="text-right">O‘zgarish</span></div><div className="divide-y divide-border">{people.map((person) => <div key={person.name} className={`grid grid-cols-[44px_1fr_80px_55px] items-center gap-3 px-5 py-4 ${person.current ? 'bg-primary/5' : ''}`} data-testid={`row-leaderboard-${person.rank}`}><span className={`text-sm font-semibold ${person.rank <= 3 ? 'text-amber-500' : 'text-muted-foreground'}`}>{person.rank}</span><div className="flex min-w-0 items-center gap-3"><Avatar initials={person.initials} color={person.color} small /><div className="min-w-0"><p className="truncate text-sm font-medium">{person.name}{person.current && <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">Siz</span>}</p><p className="text-[11px] text-muted-foreground">Level {12 - Math.floor(person.rank / 2)}</p></div></div><span className="text-right text-sm font-semibold">{person.xp.toLocaleString('uz-UZ')}</span><span className={`text-right text-[11px] font-semibold ${person.change.startsWith('-') ? 'text-red-500' : person.change === '—' ? 'text-muted-foreground' : 'text-emerald-500'}`}>{person.change}</span></div>)}</div></section><aside className="space-y-5"><div className="card-surface rounded-2xl p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500"><Flame size={19} /></span><div><p className="text-sm font-semibold">Streak sovrini</p><p className="text-xs text-muted-foreground">7 kun ketma-ket</p></div></div><p className="mt-5 text-xs leading-5 text-muted-foreground">Har kuni kamida bitta savol yechib, reytingdagi o‘rningizni saqlang.</p></div><div className="card-surface rounded-2xl p-5"><p className="text-sm font-semibold">Sizning o‘sishingiz</p><div className="mt-5 flex items-end justify-between"><span className="text-2xl font-semibold">+18%</span><span className="text-xs text-emerald-500">so‘nggi 7 kun</span></div><div className="mt-4 flex h-16 items-end gap-1.5">{[35, 48, 42, 60, 54, 72, 86].map((height, index) => <span key={index} className={`flex-1 rounded-t-md ${index === 6 ? 'bg-primary' : 'bg-primary/20'}`} style={{ height: `${height}%` }} />)}</div></div></aside></div></PageContainer>;
}

function Profile() {
  const [reminders, setReminders] = useState(() => readStorage('medquiz-reminders', true));
  const [compact, setCompact] = useState(() => readStorage('medquiz-compact', false));
  const toggle = (key: string, value: boolean, setter: (value: boolean) => void) => { setter(!value); writeStorage(key, !value); };
  return <PageContainer><PageHeading eyebrow="Hisob" title="Profil" description="O‘qish odatlaringiz, natijalaringiz va shaxsiy sozlamalar shu yerda." action={<button type="button" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted" data-testid="button-profile-edit"><Settings2 size={16} /> Sozlamalar</button>} /><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><section className="card-surface rounded-2xl p-6"><div className="flex items-center gap-4"><Avatar initials={user.initials} color={user.avatarColor} /><div><h3 className="font-semibold">{user.name}</h3><p className="mt-1 text-xs text-muted-foreground">{user.university}</p><span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">{user.course} · Level {user.level}</span></div></div><div className="mt-7 rounded-xl bg-muted p-4"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Keyingi level</span><span className="text-xs font-semibold">2,480 / 3,000 XP</span></div><div className="mt-3"><ProgressBar value={83} color="#2563EB" /></div><p className="mt-3 text-[11px] text-muted-foreground">Yana 520 XP to‘plang.</p></div><div className="mt-6 grid grid-cols-3 divide-x divide-border text-center"><div><p className="text-xl font-semibold">{user.solvedTests}</p><p className="mt-1 text-[10px] text-muted-foreground">Testlar</p></div><div><p className="text-xl font-semibold">{user.averageScore}%</p><p className="mt-1 text-[10px] text-muted-foreground">O‘rtacha</p></div><div><p className="text-xl font-semibold">{user.streak}</p><p className="mt-1 text-[10px] text-muted-foreground">Streak</p></div></div></section><section className="card-surface rounded-2xl p-6"><h3 className="font-semibold">Sozlamalar</h3><p className="mt-1 text-xs text-muted-foreground">MedQuiz sizga qulay ishlashi uchun.</p><div className="mt-6 divide-y divide-border"><SettingRow icon={<Bell size={17} />} title="Kunlik eslatmalar" description="O‘qish vaqti kelganda eslatish" enabled={reminders} onToggle={() => toggle('medquiz-reminders', reminders, setReminders)} testId="toggle-reminders" /><SettingRow icon={<Layers3 size={17} />} title="Ixcham ko‘rinish" description="Ko‘proq ma’lumotni bir ekranga sig‘dirish" enabled={compact} onToggle={() => toggle('medquiz-compact', compact, setCompact)} testId="toggle-compact" /><div className="flex items-center gap-3 py-4"><span className="rounded-lg bg-primary/10 p-2 text-primary"><ShieldCheck size={17} /></span><div className="flex-1"><p className="text-sm font-medium">Ma’lumotlar xavfsizligi</p><p className="mt-1 text-xs text-muted-foreground">Sizning progress ma’lumotlaringiz shu qurilmada saqlanadi.</p></div><Check size={17} className="text-emerald-500" /></div></div><button type="button" onClick={() => { writeStorage('medquiz-theme', 'light'); document.documentElement.classList.remove('dark'); }} className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-red-500 hover:underline" data-testid="button-profile-reset"><LogOut size={15} /> Sessiyani tozalash</button></section></div></PageContainer>;
}

function SettingRow({ icon, title, description, enabled, onToggle, testId }: { icon: ReactNode; title: string; description: string; enabled: boolean; onToggle: () => void; testId: string }) {
  return <div className="flex items-center gap-3 py-4"><span className="rounded-lg bg-muted p-2 text-muted-foreground">{icon}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><button type="button" onClick={onToggle} className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} aria-label={`${title}ni ${enabled ? 'o‘chirish' : 'yoqish'}`} data-testid={testId}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>;
}

function Achievements() {
  const unlocked = achievements.filter((item) => item.unlocked).length;
  return <PageContainer><PageHeading eyebrow="Progress" title="Yutuqlar" description={`${unlocked} ta yutuq ochildi. Har bir belgi sizning muntazamligingiz haqida.`} action={<div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary"><Award size={15} /> {unlocked} / {achievements.length}</div>} /><div className="mb-7 rounded-2xl bg-sidebar p-5 text-sidebar-foreground sm:p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Sizning kolleksiyangiz</p><h3 className="mt-2 text-xl font-semibold">Bilimni odatga aylantiring</h3><p className="mt-2 max-w-lg text-xs leading-5 text-slate-400">Yangi yutuqlar harakatni ko‘rinadigan qiladi. Keyingi nishon sizga o‘ylagandan yaqinroq.</p></div><div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-blue-400/30 text-center"><div><div className="text-lg font-semibold">42%</div><div className="text-[9px] text-slate-400">umumiy</div></div></div></div></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{achievements.map((item) => <AchievementCard key={item.id} item={item} />)}</div></PageContainer>;
}

function AchievementCard({ item }: { item: Achievement }) {
  const colors: Record<string, string> = { blue: 'bg-blue-500/10 text-blue-500', amber: 'bg-amber-500/10 text-amber-500', violet: 'bg-violet-500/10 text-violet-500', emerald: 'bg-emerald-500/10 text-emerald-500', rose: 'bg-rose-500/10 text-rose-500', slate: 'bg-slate-500/10 text-slate-500' };
  return <article className={`card-surface rounded-2xl p-5 ${!item.unlocked ? 'opacity-80' : ''}`} data-testid={`card-achievement-${item.id}`}><div className="flex items-start justify-between"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors[item.tone]}`}><AppIcon name={item.icon} size={23} /></span>{item.unlocked ? <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-500">Ochildi</span> : <LockKeyhole size={17} className="text-muted-foreground" />}</div><h3 className="mt-5 font-semibold">{item.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p><div className="mt-5 flex items-center justify-between text-[11px]"><span className="text-muted-foreground">{item.unlocked ? 'Bajarildi' : `${item.progress}% bajarildi`}</span>{!item.unlocked && <span className="font-semibold text-primary">{item.progress}/100</span>}</div>{!item.unlocked && <div className="mt-2"><ProgressBar value={item.progress} color="#2563EB" /></div>}</article>;
}

function Router({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const shell = (page: ReactNode) => <AppShell theme={theme} onToggle={onToggle}>{page}</AppShell>;
  return <Switch>
    <Route path="/" component={() => <Home theme={theme} onToggle={onToggle} />} />
    <Route path="/dashboard">{shell(<Dashboard />)}</Route>
    <Route path="/subjects">{shell(<Subjects />)}</Route>
    <Route path="/quiz/:subjectId">{shell(<Quiz theme={theme} />)}</Route>
    <Route path="/battle/lobby">{shell(<BattleLobby />)}</Route>
    <Route path="/battle/:roomId">{shell(<BattleRoom />)}</Route>
    <Route path="/leaderboard">{shell(<Leaderboard />)}</Route>
    <Route path="/profile">{shell(<Profile />)}</Route>
    <Route path="/achievements">{shell(<Achievements />)}</Route>
    <Route component={NotFound} />
  </Switch>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => readStorage<Theme>('medquiz-theme', 'light'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    writeStorage('medquiz-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((value) => value === 'light' ? 'dark' : 'light');
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><Router theme={theme} onToggle={toggleTheme} /></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;