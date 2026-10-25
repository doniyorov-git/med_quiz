import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'wouter';
import {
  HiChartBar,
  HiCollection,
  HiHome,
  HiOutlineChartBar,
  HiOutlineChartSquareBar,
  HiOutlineCog,
  HiOutlineCollection,
  HiOutlineDocumentText,
  HiOutlineExclamationCircle,
  HiOutlineHome,
  HiOutlineLightningBolt,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineSearch,
  HiOutlineStar,
  HiOutlineUser,
  HiOutlineX,
  HiUser,
} from 'react-icons/hi';
import { HiOutlineBell } from 'react-icons/hi';
import { useBanks, useInvites, useOnline, useStatsMap, useStore } from '@/lib/store';
import { getMedicalTitle, joinRoom, respondInvite } from '@/lib/model';
import { ThemeSwitch } from '@/components/theme-toggle';

import { HiOutlineUserGroup, HiUserGroup } from 'react-icons/hi';

export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <i className={`${name} leading-none ${className}`} aria-hidden="true" />;
}

const kinds = {
  primary: 'btn-primary',
  line: 'btn-secondary',
  quiet: 'btn-ghost',
  danger: 'btn-ghost text-rose-500 hover:bg-rose-500/10 dark:text-coral-400',
};

export function Btn({
  kind = 'primary',
  className = '',
  testId,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: keyof typeof kinds; testId?: string }) {
  return <button {...props} data-testid={testId} className={`${kinds[kind]} ${className}`} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="input-label">{label}</span>
      {children}
    </label>
  );
}

export const fieldClass = 'input-field';

const sideNav = [
  { href: '/dashboard', label: 'Boshqaruv', icon: HiOutlineHome },
  { href: '/blog', label: 'Blog & Lenta', icon: HiOutlineDocumentText },
  { href: '/banks', label: 'To‘plamlar', icon: HiOutlineCollection },
  { href: '/mistakes', label: 'Xatolarim', icon: HiOutlineExclamationCircle },
  { href: '/battle', label: 'Battle', icon: HiOutlineLightningBolt },
  { href: '/leaderboard', label: 'Reyting', icon: HiOutlineChartSquareBar },
  { href: '/achievements', label: 'Yutuqlar', icon: HiOutlineStar },
];

const mobileNav = [
  { href: '/dashboard', label: 'Asosiy', icon: 'ri-home-5-line', active: 'ri-home-5-fill' },
  { href: '/blog', label: 'Blog', icon: 'ri-article-line', active: 'ri-article-fill' },
  { href: '/battle', label: 'Battle', icon: 'ri-sword-line', active: 'ri-sword-fill' },
  { href: '/leaderboard', label: 'Reyting', icon: 'ri-trophy-line', active: 'ri-trophy-fill' },
  { href: '/profile', label: 'Profil', icon: 'ri-user-3-line', active: 'ri-user-3-fill' },
];

function SideDock({ xp, streak, quizzes }: { xp: number; streak: number; quizzes: number }) {
  const into = xp % 500;

  return (
    <div className="space-y-2.5">
      <Link href="/leaderboard" className="block rounded-[10px] border border-slate-200/80 bg-slate-50/80 p-3 transition hover:border-med-500/40 dark:border-white/10 dark:bg-white/5" data-testid="link-side-points">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">To‘plangan ball</p>
        <p className="font-display text-2xl font-bold leading-none text-slate-900 dark:text-white">{(xp ?? 0).toLocaleString('uz-UZ')} <span className="text-sm font-semibold text-med-600 dark:text-med-400">XP</span></p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-[10px] bg-slate-200 dark:bg-white/10">
          <div className="h-full rounded-[10px] bg-med-500" style={{ width: `${(into / 500) * 100}%` }} />
        </div>
        <p className="mt-1 text-[10px] text-slate-500">Keyingi darajagacha {500 - into} XP</p>
      </Link>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/dashboard" className="rounded-[10px] border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-amber-700 dark:text-orange-300 transition hover:bg-amber-500/20">
          <p className="text-[10px] uppercase tracking-wide">Streak</p>
          <p className="font-display text-sm font-bold">{streak} kun</p>
        </Link>
        <Link href="/achievements" className="rounded-[10px] border border-slate-200/80 bg-slate-50/80 px-2.5 py-2 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-white/10">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Testlar</p>
          <p className="font-display text-sm font-bold">{quizzes}</p>
        </Link>
      </div>
    </div>
  );
}

function isActive(location: string, href: string) {
  if (href === '/dashboard') return location === '/dashboard';
  if (href === '/blog') return location.startsWith('/blog');
  if (href === '/banks') return location.startsWith('/banks') || location.startsWith('/play');
  if (href === '/mistakes') return location.startsWith('/mistakes');
  if (href === '/battle') return location.startsWith('/battle');
  return location === href || location.startsWith(`${href}/`);
}

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { me, leave } = useStore();
  const stats = useStatsMap()[me?.id ?? ''];
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  const myTitle = getMedicalTitle(stats?.xp ?? 0);

  const itemClass = (href: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-[10px] font-medium transition-all duration-200 ${
      isActive(location, href)
        ? 'bg-med-500/15 text-med-700 dark:text-med-400 font-semibold shadow-xs'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-50">
        <div className="flex flex-col flex-grow bg-white/95 dark:bg-[#111827] border-r border-slate-200/80 dark:border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3 px-6 py-5 border-b border-slate-200/80 dark:border-white/10" data-testid="link-logo">
            <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-med-500 to-med-600 flex items-center justify-center shadow-md shadow-med-500/30">
              <span className="text-xl font-display font-bold text-white">M</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white">MedQuiz</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tibbiy ta’lim</p>
            </div>
          </Link>
          <nav className="flex min-h-0 flex-1 flex-col px-3 py-4 overflow-y-auto scrollbar-hide" aria-label="Asosiy">
            <div className="space-y-1">
              {sideNav.map((item) => (
                <Link key={item.href} href={item.href} className={itemClass(item.href)} data-testid={`link-nav-${item.label}`}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="mt-auto pt-4">
              <SideDock xp={stats?.xp ?? 0} streak={stats?.streak ?? 0} quizzes={stats?.quizzes ?? 0} />
            </div>
          </nav>
          <div className="p-4 border-t border-slate-200/80 dark:border-white/10">
            <div className="mb-2.5">
              <ThemeSwitch />
            </div>
            <Link href="/profile" className={`flex items-center gap-3 p-3 rounded-[10px] transition-all ${isActive(location, '/profile') ? 'bg-med-500/10' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}>
              <Avatar name={me?.name ?? ''} image={me?.avatar} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate text-slate-900 dark:text-white">{me?.name}</p>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1 font-medium">
                  <Icon name={myTitle.icon} className="text-sm text-primary" />
                  <span>{myTitle.title}</span>
                </p>
              </div>
            </Link>
            <div className="mt-3 flex items-center gap-2">
              <Link href="/profile" className="flex flex-1 items-center justify-center rounded-[10px] px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white" aria-label="Sozlamalar">
                <HiOutlineCog className="h-5 w-5" />
              </Link>
              <button type="button" onClick={leave} className="flex flex-1 items-center justify-center rounded-[10px] px-3 py-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400" aria-label="Chiqish" data-testid="button-leave-side">
                <HiOutlineLogout className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {open && <button type="button" className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden" aria-label="Menyuni yopish" onClick={() => setOpen(false)} />}
      {open && (
        <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111827] shadow-2xl lg:hidden">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-med-500 to-med-600 text-white shadow-md">
                  <span className="font-display text-xl font-bold">M</span>
                </div>
                <span className="font-display text-lg font-bold text-slate-900 dark:text-white">MedQuiz</span>
              </div>
              <button type="button" className="rounded-[10px] p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5" onClick={() => setOpen(false)} aria-label="Yopish">
                <HiOutlineX className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
              <div className="space-y-1">
                {sideNav.map((item) => (
                  <Link key={item.href} href={item.href} className={itemClass(item.href)}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-auto pt-4">
                <SideDock xp={stats?.xp ?? 0} streak={stats?.streak ?? 0} quizzes={stats?.quizzes ?? 0} />
              </div>
            </nav>
            <div className="border-t border-slate-200/80 dark:border-white/10 p-4 space-y-3">
              <ThemeSwitch />
              <button type="button" onClick={leave} className="flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 font-semibold text-xs border border-rose-500/20">
                <HiOutlineLogout className="h-5 w-5" /> Chiqish
              </button>
            </div>
          </div>
        </aside>
      )}

      <div className="min-w-0 flex-1 overflow-x-hidden lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl shadow-xs transition-colors duration-200">
          <div className="flex items-center justify-between px-4 py-3.5 lg:px-8">
            <button type="button" className="rounded-[10px] p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 lg:hidden" aria-label="Menyu" onClick={() => setOpen(true)}>
              <HiOutlineMenu className="h-6 w-6" />
            </button>
            <Link href="/dashboard" className="hidden items-center gap-2.5 sm:flex" data-testid="link-header-logo">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-med-500 to-med-600 font-display text-lg font-bold text-white shadow-xs">M</span>
              <span className="font-display text-lg font-bold text-slate-900 dark:text-white">MedQuiz</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="group flex items-center gap-2 rounded-[10px] border border-slate-200/80 bg-slate-100/80 px-2.5 py-1.5 sm:px-3 sm:py-2 transition-colors hover:bg-slate-200/60 dark:border-white/10 dark:bg-[#1f2937]/50 dark:hover:bg-[#1f2937]">
                <HiOutlineSearch className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white shrink-0" />
                <input
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Qidirish..."
                  className="w-16 sm:w-28 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 md:w-44"
                  data-testid="input-search"
                />
                <kbd className="hidden rounded-[6px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1f2937] px-1.5 py-0.5 text-[11px] text-slate-500 md:inline">⌘K</kbd>
              </div>
              <InviteBell />
              <Link href="/profile" className="hidden lg:flex items-center gap-3 rounded-[10px] p-1.5 pr-3 hover:bg-slate-100 dark:hover:bg-white/5" data-testid="link-header-profile">
                <Avatar name={me?.name ?? ''} image={me?.avatar} rounded="rounded-[10px]" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{me?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <Icon name={myTitle.icon} className="text-primary text-xs" />
                    <span>{myTitle.title}</span>
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>

      {searchOpen && <SearchSheet query={query} setQuery={setQuery} onClose={() => setSearchOpen(false)} />}
      <GlobalInvitePopup />

      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="absolute inset-0 border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl shadow-lg" />
        <div className="relative flex h-16 items-center px-1 pb-safe">
          {mobileNav.map((item) => {
            const active = isActive(location, item.href);
            const iconName = active ? item.active : item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex-1 min-w-0 h-full flex flex-col items-center justify-center text-center px-0.5"
              >
                {active && <span className="absolute -top-0.5 h-1 w-8 rounded-[10px] bg-med-500" />}
                <Icon
                  name={iconName}
                  className={`text-xl transition-transform ${active ? 'text-med-600 dark:text-med-400 scale-105' : 'text-slate-500 dark:text-slate-400'}`}
                />
                <span
                  className={`mt-1 text-[11px] font-medium leading-none truncate max-w-full ${
                    active ? 'text-med-600 dark:text-med-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function playInviteChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.28);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.14);
    gain2.gain.setValueAtTime(0.2, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.45);
  } catch {}
}

export function GlobalInvitePopup() {
  const { me } = useStore();
  const invites = useInvites();
  const [, setLocation] = useLocation();
  const incoming = invites.filter((invite) => invite.toId === me?.id && invite.status === 'pending');
  const activeInvite = incoming[0];
  const [announcedId, setAnnouncedId] = useState<string | null>(null);

  useEffect(() => {
    if (activeInvite && activeInvite.id !== announcedId) {
      setAnnouncedId(activeInvite.id);
      playInviteChime();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([100, 50, 100]);
        } catch {}
      }
    }
  }, [activeInvite, announcedId]);

  if (!activeInvite || !me) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Battle taklifi"
        className="relative w-full max-w-sm overflow-hidden rounded-[10px] border-2 border-primary/40 bg-white dark:bg-[#111827] p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white"
      >
        {/* Pulsing battle icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[10px] bg-primary/10 text-primary ring-4 ring-primary/15 animate-bounce">
          <Icon name="ri-sword-line" className="text-3xl" />
        </div>

        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            Jonli chaqiruv
          </span>
          <h3 className="mt-1.5 font-display text-lg sm:text-xl font-bold">
            Battle taklifi keldi!
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white font-bold">{activeInvite.fromName}</strong> sizni tibbiy bellashuvga chorlamoqda!
          </p>
        </div>

        {/* Room / Bank info box */}
        <div className="mt-4 rounded-[10px] border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 text-center">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Test mavzusi:</p>
          <p className="text-sm font-bold text-primary mt-0.5 line-clamp-1">
            {activeInvite.bankName}
          </p>
          <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-slate-500 font-mono">
            <span>Xona kodi:</span>
            <span className="font-bold tracking-wider text-slate-800 dark:text-slate-200">{activeInvite.roomCode}</span>
          </div>
        </div>

        {/* Action Buttons: Qabul qilish & Rad etish */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[10px] bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-white/5 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold transition-all border border-slate-200 dark:border-white/10 active:scale-95"
            onClick={() => respondInvite(activeInvite.id, 'rejected')}
          >
            <Icon name="ri-close-line" className="text-base" />
            <span>Rad etish</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
            onClick={() => {
              respondInvite(activeInvite.id, 'accepted');
              joinRoom(me, activeInvite.roomCode);
              setLocation(`/battle/${activeInvite.roomCode}`);
            }}
          >
            <Icon name="ri-check-line" className="text-base" />
            <span>Qabul qilish</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function InviteBell() {
  const { me } = useStore();
  const invites = useInvites();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [risen, setRisen] = useState(false);
  const incoming = invites.filter((invite) => invite.toId === me?.id && invite.status === 'pending');

  useEffect(() => {
    if (!open) {
      setRisen(false);
      return;
    }
    const frame = requestAnimationFrame(() => setRisen(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="relative rounded-[10px] border border-slate-200/80 bg-white/80 p-2 text-slate-600 backdrop-blur-xl hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300 dark:hover:bg-[#1f2937] dark:hover:text-white"
        aria-label="Takliflar"
        data-testid="button-invites"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="ri-notification-3-line" className="text-lg" />
        {incoming.length > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white animate-pulse">
            {incoming.length}
          </span>
        )}
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex items-end">
          <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-xs" aria-label="Takliflarni yopish" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Takliflar"
            className="relative z-10 max-h-[80vh] w-full overflow-y-auto rounded-t-[10px] border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#111827] pb-safe shadow-2xl backdrop-blur-xl"
            style={{ transform: risen ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 280ms ease-out' }}
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-[10px] bg-slate-300 dark:bg-white/15" />
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-4 py-3">
              <p className="font-display font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Icon name="ri-notification-3-line" className="text-primary" /> Takliflar
              </p>
              <button type="button" onClick={() => setOpen(false)} className="rounded-[10px] p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white" aria-label="Yopish">
                <Icon name="ri-close-line" className="text-xl" />
              </button>
            </div>
            {!incoming.length && <p className="px-4 py-6 text-sm text-slate-500 text-center">Yangi taklif yo‘q</p>}
            {incoming.map((invite) => (
              <div key={invite.id} className="border-b border-slate-200/80 dark:border-white/10 px-4 py-3" data-testid={`invite-${invite.id}`}>
                <p className="text-sm text-slate-800 dark:text-slate-200"><span className="font-semibold">{invite.fromName}</span> sizni «{invite.bankName}» battleiga chaqirdi.</p>
                <div className="mt-3 flex gap-2">
                  <Btn
                    className="px-3 py-2 text-xs !rounded-[10px]"
                    testId={`button-accept-${invite.id}`}
                    onClick={() => {
                      respondInvite(invite.id, 'accepted');
                      if (me) joinRoom(me, invite.roomCode);
                      setOpen(false);
                      setLocation(`/battle/${invite.roomCode}`);
                    }}
                  >
                    <Icon name="ri-check-line" className="mr-1" /> Qabul
                  </Btn>
                  <Btn kind="line" className="px-3 py-2 text-xs !rounded-[10px]" testId={`button-reject-${invite.id}`} onClick={() => respondInvite(invite.id, 'rejected')}>
                    <Icon name="ri-close-line" className="mr-1" /> Rad
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function SearchSheet({ query, setQuery, onClose }: { query: string; setQuery: (value: string) => void; onClose: () => void }) {
  const banks = useBanks();
  const shown = banks.filter((bank) => bank.name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-xs" aria-label="Qidiruvni yopish" onClick={onClose} />
      <div className="glass-card relative w-full max-w-lg overflow-hidden bg-white dark:bg-[#111827] shadow-2xl rounded-[10px]">
        <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/10 px-4 py-3">
          <HiOutlineSearch className="h-5 w-5 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="To‘plam nomi" className="flex-1 bg-transparent text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" />
          <button type="button" onClick={onClose} className="rounded-[10px] p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5" aria-label="Yopish"><HiOutlineX className="h-5 w-5" /></button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {!shown.length && <p className="px-3 py-6 text-sm text-slate-500">To‘plam topilmadi</p>}
          {shown.map((bank) => (
            <Link key={bank.id} href={`/banks/${bank.id}`} onClick={onClose} className="flex items-center gap-3 rounded-[10px] px-3 py-3 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200">
              <HiOutlineDocumentText className="h-5 w-5 text-med-600 dark:text-med-400" />
              <span className="font-medium">{bank.name}</span>
              <span className="ml-auto text-xs text-slate-500">{(bank.questions ?? []).length} ta savol</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Avatar({ name, image, large = false, rounded = 'rounded-[10px]' }: { name?: string | null; image?: string | null; large?: boolean; rounded?: string }) {
  const size = large ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm';
  if (image) return <img src={image} alt="" className={`${size} ${rounded} object-cover ring-2 ring-primary/30 shadow-xs`} />;
  const letter = (name || 'M').trim()[0]?.toUpperCase() || 'M';
  return <span className={`${size} inline-flex items-center justify-center ${rounded} bg-gradient-to-br from-teal-500 via-primary to-indigo-600 font-display font-bold text-white shadow-xs`}>{letter}</span>;
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`glass-card p-6 ${className}`}>{children}</section>;
}

