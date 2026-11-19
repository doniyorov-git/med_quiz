import { useEffect, useState, useRef, useMemo, type ButtonHTMLAttributes, type ReactNode } from 'react';
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
  HiOutlineSupport,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineX,
  HiUser,
} from 'react-icons/hi';
import { HiOutlineBell } from 'react-icons/hi';
import { useBanks, useInvites, useOnline, useStatsMap, useStore } from '@/lib/store';
import { getMedicalTitle, joinRoom, respondInvite, getBankSchedule, parseDateSafe } from '@/lib/model';
import { ThemeSwitch } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n, type TranslationKey } from '@/lib/i18n';

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

const sideNav: { href: string; labelKey: TranslationKey; defaultLabel: string; icon: any }[] = [
  { href: '/dashboard', labelKey: 'nav_dashboard', defaultLabel: 'Boshqaruv', icon: HiOutlineHome },
  { href: '/friends', labelKey: 'nav_friends', defaultLabel: 'Do‘stlar', icon: HiOutlineUserGroup },
  { href: '/banks', labelKey: 'nav_banks', defaultLabel: 'To‘plamlar', icon: HiOutlineCollection },
  { href: '/mistakes', labelKey: 'nav_mistakes', defaultLabel: 'Xatolarim', icon: HiOutlineExclamationCircle },
  { href: '/battle', labelKey: 'nav_battle', defaultLabel: 'Battle', icon: HiOutlineLightningBolt },
  { href: '/leaderboard', labelKey: 'nav_leaderboard', defaultLabel: 'Reyting', icon: HiOutlineChartSquareBar },
  { href: '/achievements', labelKey: 'nav_achievements', defaultLabel: 'Yutuqlar', icon: HiOutlineStar },
  { href: '/support', labelKey: 'nav_support' as TranslationKey, defaultLabel: 'Qo‘llab-quvvatlash', icon: HiOutlineSupport },
  { href: '/admin', labelKey: 'nav_admin' as any, defaultLabel: 'Admin Panel', icon: HiOutlineShieldCheck },
  { href: '/profile', labelKey: 'nav_profile' as TranslationKey, defaultLabel: 'Profil', icon: HiOutlineUser },
];

const mobileNav: { href: string; labelKey: TranslationKey; defaultLabel: string; icon: string; active: string }[] = [
  { href: '/dashboard', labelKey: 'nav_home', defaultLabel: 'Asosiy', icon: 'ri-home-5-line', active: 'ri-home-5-fill' },
  { href: '/banks', labelKey: 'nav_banks', defaultLabel: 'To‘plamlar', icon: 'ri-book-2-line', active: 'ri-book-2-fill' },
  { href: '/battle', labelKey: 'nav_battle', defaultLabel: 'Battle', icon: 'ri-sword-line', active: 'ri-sword-fill' },
  { href: '/leaderboard', labelKey: 'nav_leaderboard', defaultLabel: 'Reyting', icon: 'ri-trophy-line', active: 'ri-trophy-fill' },
  { href: '/profile', labelKey: 'nav_profile', defaultLabel: 'Profil', icon: 'ri-user-3-line', active: 'ri-user-3-fill' },
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
  if (href === '/friends') return location.startsWith('/friends');
  if (href === '/banks') return location.startsWith('/banks') || location.startsWith('/play');
  if (href === '/mistakes') return location.startsWith('/mistakes');
  if (href === '/battle') return location.startsWith('/battle');
  return location === href || location.startsWith(`${href}/`);
}

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { me, leave } = useStore();
  const stats = useStatsMap()[me?.id ?? ''];
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => setOpen(false), [location]);

  const itemClass = (href: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-[10px] font-medium transition-all duration-200 ${
      isActive(location, href)
        ? 'bg-med-500/15 text-med-700 dark:text-med-400 font-semibold shadow-xs'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
    }`;

  const isBattleRoom = location.startsWith('/battle/') && location !== '/battle';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-[#090d16] text-slate-900 dark:text-white">
      {/* 1. SINGLE FULL-WIDTH TOP HEADER - Unbroken line runs 100% from left to right */}
      {!isBattleRoom && (
        <header className="sticky top-0 z-40 h-16 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-xl shadow-xs transition-colors shrink-0">
          <div className="flex h-full w-full items-center justify-between px-2 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Mobile hamburger menu button */}
              <button
                type="button"
                className="flex lg:hidden items-center justify-center h-10 w-10 rounded-[10px] border border-slate-200/80 bg-slate-100/80 hover:bg-slate-200/60 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 cursor-pointer shrink-0"
                aria-label="Menyu"
                onClick={() => setOpen(true)}
              >
                <HiOutlineMenu className="h-5 w-5" />
              </button>

              {/* The ONLY Logo in the entire app: always at top left */}
              <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 select-none shrink-0" data-testid="link-logo">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-gradient-to-br from-med-500 to-med-600 flex items-center justify-center shadow-md shadow-med-500/30 shrink-0">
                  <span className="text-lg sm:text-xl font-display font-bold text-white">M</span>
                </div>
                <div className="flex flex-col">
                  <h1 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">MedQuiz</h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-0.5 hidden sm:block">Tibbiy ta’lim</p>
                </div>
              </Link>
            </div>

            {/* Right: Search, Language, Invites, Profile Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Search button on mobile (< sm) */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex sm:hidden items-center justify-center h-10 w-10 rounded-[10px] border border-slate-200/80 bg-slate-100/80 hover:bg-slate-200/60 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                title="Qidirish"
                aria-label="Qidirish"
              >
                <HiOutlineSearch className="h-5 w-5" />
              </button>

              {/* Search input on tablet/desktop (sm+) */}
              <div className="hidden sm:flex group items-center h-10 rounded-[10px] border border-slate-200/80 bg-slate-100/80 px-2.5 sm:px-3 hover:bg-slate-200/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
                <HiOutlineSearch className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white shrink-0 mr-1.5 sm:mr-2" />
                <input
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Qidirish..."
                  className="w-20 sm:w-28 md:w-44 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  data-testid="input-search"
                />
                <kbd className="hidden rounded-[6px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1f2937] px-1.5 py-0.5 text-[10px] text-slate-500 md:inline ml-1.5">⌘K</kbd>
              </div>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* InviteBell */}
              <InviteBell />

              {/* Profile Pill: Compact avatar on mobile, expanded with name on sm+ */}
              <Link
                href="/profile"
                className="flex items-center gap-2 h-10 p-1 sm:pl-1.5 sm:pr-3 rounded-[10px] border border-slate-200/80 bg-slate-100/80 hover:bg-slate-200/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                data-testid="link-header-profile"
                title="Profil"
              >
                {me?.avatar ? (
                  <img
                    src={me.avatar}
                    alt={me.name}
                    className="h-8 w-8 sm:h-7 sm:w-7 rounded-[7px] object-cover shrink-0 shadow-xs"
                  />
                ) : (
                  <span className="flex h-8 w-8 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-display text-xs font-bold shadow-xs">
                    {(me?.name || 'M').trim()[0]?.toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:inline text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                  {me?.name || 'Talaba'}
                </span>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* 2. BODY CONTENT: Sidebar on Left + Main Content on Right */}
      <div className="flex flex-1 min-h-0">
        {!isBattleRoom && (
          <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#111827] shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
            <nav className="flex min-h-0 flex-1 flex-col px-3 py-4 overflow-y-auto scrollbar-hide" aria-label="Asosiy">
              <div className="space-y-1">
                {sideNav.map((item) => {
                  const label = t(item.labelKey) || item.defaultLabel;
                  return (
                    <Link key={item.href} href={item.href} className={itemClass(item.href)} data-testid={`link-nav-${item.defaultLabel}`}>
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-auto pt-4">
                <SideDock xp={stats?.xp ?? 0} streak={stats?.streak ?? 0} quizzes={stats?.quizzes ?? 0} />
              </div>
            </nav>
            <div className="p-3 border-t border-slate-200/80 dark:border-white/10 space-y-2">
              <ThemeSwitch />
              <button
                type="button"
                onClick={leave}
                className="flex w-full items-center justify-center gap-2 rounded-[8px] px-3 py-2 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 font-semibold text-xs border border-rose-500/20 transition-colors"
                data-testid="button-leave-side"
              >
                <HiOutlineLogout className="h-4 w-4" />
                <span>{t('nav_logout')}</span>
              </button>
            </div>
          </aside>
        )}

        {/* Mobile Slide-out Drawer */}
        {open && !isBattleRoom && (
          <button type="button" className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden" aria-label="Menyuni yopish" onClick={() => setOpen(false)} />
        )}
        {open && !isBattleRoom && (
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
                  {sideNav.map((item) => {
                    const label = t(item.labelKey) || item.defaultLabel;
                    return (
                      <Link key={item.href} href={item.href} className={itemClass(item.href)}>
                        <item.icon className="h-5 w-5" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-auto pt-4">
                  <SideDock xp={stats?.xp ?? 0} streak={stats?.streak ?? 0} quizzes={stats?.quizzes ?? 0} />
                </div>
              </nav>
              <div className="border-t border-slate-200/80 dark:border-white/10 p-4 space-y-3">
                <ThemeSwitch />
                <button type="button" onClick={leave} className="flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 font-semibold text-xs border border-rose-500/20">
                  <HiOutlineLogout className="h-5 w-5" /> {t('nav_logout')}
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className={isBattleRoom ? 'flex-1 w-full p-0 flex flex-col' : 'flex-1 min-w-0 p-4 lg:p-6 pb-24 lg:pb-8 overflow-x-hidden'}>
          {children}
        </main>
      </div>

      {!isBattleRoom && searchOpen && <SearchSheet query={query} setQuery={setQuery} onClose={() => setSearchOpen(false)} />}
      <GlobalInvitePopup />

      {!isBattleRoom && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden" aria-label="Pastki menyu">
          <div className="absolute inset-0 border-t border-slate-200/80 bg-white/95 shadow-[0_-6px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#090d16]/95" />
          <div className="relative flex h-16 items-center px-1 pb-safe">
            {mobileNav.map((item) => {
              const active = isActive(location, item.href);
              const iconName = active ? item.active : item.icon;
              const label = t(item.labelKey) || item.defaultLabel;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-center px-0.5 text-center"
                >
                  {active && <span className="absolute -top-0.5 h-1 w-8 rounded-[10px] bg-med-500" />}
                  <Icon
                    name={iconName}
                    className={`text-xl transition-transform ${active ? 'scale-105 text-med-600 dark:text-med-400' : 'text-slate-500 dark:text-slate-400'}`}
                  />
                  <span
                    className={`mt-1 max-w-full truncate text-[11px] font-medium leading-none ${
                      active ? 'font-semibold text-med-600 dark:text-med-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[160] w-[calc(100%-1.5rem)] max-w-lg px-2 pointer-events-auto animate-in slide-in-from-top-6 duration-300">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Battle taklifi"
        className="relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-white/95 dark:bg-[#111827]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl ring-4 ring-primary/10 text-slate-900 dark:text-white"
      >
        <div className="flex items-start gap-3.5">
          {/* Pulsing icon */}
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-md shadow-primary/20">
            <Icon name="ri-sword-fill" className="text-2xl animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
                <Icon name="ri-broadcast-fill" className="text-xs" /> Jonli Battle Chaqiruvi
              </span>
              <button
                type="button"
                onClick={() => respondInvite(activeInvite.id, 'rejected')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
                title="Yopish"
              >
                <Icon name="ri-close-line" className="text-lg" />
              </button>
            </div>

            <p className="mt-1 text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {activeInvite.fromName} sizni bellashuvga chaqirdi!
            </p>

            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="font-semibold text-primary">«{activeInvite.bankName}»</span>
              <span>•</span>
              <span className="font-mono text-[11px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                Kodi: {activeInvite.roomCode}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons: Qabul qilish & Rad etish */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-end gap-2.5">
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
            onClick={() => respondInvite(activeInvite.id, 'rejected')}
          >
            <Icon name="ri-close-line" className="text-base" />
            <span>Rad etish</span>
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-1.5 py-2 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95"
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
  const banks = useBanks();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const incoming = invites.filter((invite) => invite.toId === me?.id && invite.status === 'pending');

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const upcomingExams = useMemo(() => {
    const list: { bankName: string; bankId: string; daysLeft: number }[] = [];
    for (const b of banks) {
      const sch = getBankSchedule(b.id);
      if (sch?.examDate) {
        const target = parseDateSafe(sch.examDate).getTime();
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffDays = Math.max(0, Math.ceil((target - now.getTime()) / (1000 * 60 * 60 * 24)));
        if (diffDays <= 7) {
          list.push({ bankName: b.name, bankId: b.id, daysLeft: diffDays });
        }
      }
    }
    return list;
  }, [banks]);

  const totalBadges = incoming.length + upcomingExams.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="relative flex items-center justify-center h-10 w-10 rounded-[10px] border border-slate-200/80 bg-slate-100/80 hover:bg-slate-200/60 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
        aria-label="Bildirishnomalar"
        data-testid="button-invites"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="ri-notification-3-line" className="text-lg" />
        {totalBadges > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {totalBadges}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/95 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon name="ri-notification-3-fill" className="text-sm" />
              </span>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                Bildirishnomalar
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
              {totalBadges} ta
            </span>
          </div>

          <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {/* Battle Chaqiruvlari */}
            {incoming.map((invite) => (
              <div key={invite.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-xs">
                    <Icon name="ri-sword-fill" className="text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">
                        Battle Taklifi
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {invite.roomCode}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {invite.fromName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      «{invite.bankName}» bo‘yicha bellashuvga chaqirdi
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                        onClick={() => {
                          respondInvite(invite.id, 'accepted');
                          if (me) joinRoom(me, invite.roomCode);
                          setOpen(false);
                          setLocation(`/battle/${invite.roomCode}`);
                        }}
                      >
                        <Icon name="ri-check-line" />
                        <span>Qabul qilish</span>
                      </button>
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 font-bold text-xs active:scale-95 transition-all cursor-pointer"
                        onClick={() => respondInvite(invite.id, 'rejected')}
                      >
                        <Icon name="ri-close-line" />
                        <span>Rad etish</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Imtihon Eslatmalari */}
            {upcomingExams.map((exam) => (
              <div key={exam.bankId} className="p-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Icon name="ri-calendar-check-fill" className="text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Imtihon Eslatmasi
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {exam.bankName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Imtihongacha <strong className="text-amber-600 dark:text-amber-400">{exam.daysLeft === 0 ? "Bugun!" : `${exam.daysLeft} kun qoldi`}</strong>
                    </p>
                    <Link
                      href={`/play/${exam.bankId}`}
                      onClick={() => setOpen(false)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                    >
                      <span>Mashqni boshlash</span>
                      <Icon name="ri-arrow-right-line" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty state */}
            {totalBadges === 0 && (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 mb-2">
                  <Icon name="ri-notification-off-line" className="text-2xl" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Yangi bildirishnomalar yo‘q
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Battle takliflari va imtihon eslatmalari shu yerda ko‘rinadi
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-white/5 p-2.5 bg-slate-50/50 dark:bg-white/[0.02]">
            <Link
              href="/support"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-primary hover:underline"
            >
              <Icon name="ri-customer-service-2-line" />
              <span>Yordam va qo‘llab-quvvatlash chati</span>
            </Link>
          </div>
        </div>
      )}
    </div>
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

export function Avatar({
  name,
  image,
  size,
  large = false,
  rounded = 'rounded-[10px]',
}: {
  name?: string | null;
  image?: string | null;
  size?: string;
  large?: boolean;
  rounded?: string;
}) {
  const actualSize = size || (large ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm');
  if (image) return <img src={image} alt="" className={`${actualSize} ${rounded} object-cover shadow-xs shrink-0`} />;
  const letter = (name || 'M').trim()[0]?.toUpperCase() || 'M';
  return (
    <span className={`${actualSize} shrink-0 inline-flex items-center justify-center ${rounded} bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-display font-bold shadow-xs`}>
      {letter}
    </span>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`glass-card p-6 ${className}`}>{children}</section>;
}

