import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Icon } from '@/components/chrome';
import { useStore } from '@/lib/store';
import { getMedicalTitle } from '@/lib/model';
import type { Contrast, FontSize, UserSession } from '@/lib/types';

function getUserSessions(userId: string): UserSession[] {
  const SESSIONS_KEY = `medquiz-v2-sessions-${userId}`;
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let browser = 'Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  let os = 'macOS';
  let deviceName = 'Apple Mac';
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';

  if (/iPhone/i.test(ua)) {
    deviceType = 'mobile';
    deviceName = 'Apple iPhone';
    os = 'iOS 18.1';
  } else if (/Android/i.test(ua)) {
    deviceType = 'mobile';
    deviceName = 'Samsung Galaxy S24';
    os = 'Android 14';
  } else if (/Windows/i.test(ua)) {
    deviceType = 'desktop';
    deviceName = 'Windows PC';
    os = 'Windows 11';
  }

  const defaultSessions: UserSession[] = [
    {
      id: 'sess-curr',
      userId,
      deviceName,
      browser,
      os,
      ip: '103.27.159.104',
      location: 'Toshkent, O‘zbekiston',
      isCurrent: true,
      deviceType,
      createdAt: Date.now() - 3600000 * 2,
      lastActive: Date.now(),
    },
    {
      id: 'sess-mobile-prev',
      userId,
      deviceName: 'Apple iPhone 15 Pro',
      browser: 'Mobile Safari',
      os: 'iOS 18',
      ip: '178.218.201.89',
      location: 'Samarqand, O‘zbekiston',
      isCurrent: false,
      deviceType: 'mobile',
      createdAt: Date.now() - 86400000 * 2,
      lastActive: Date.now() - 3600000 * 12,
    },
  ];
  return defaultSessions;
}

export type SettingsSection = 'account' | 'notifications' | 'appearance' | 'security' | 'help' | 'about' | null;

interface SettingsViewProps {
  onBack?: () => void;
  onOpenEditProfile?: () => void;
  initialSection?: SettingsSection;
}

export function SettingsView({ onBack, onOpenEditProfile, initialSection = null }: SettingsViewProps) {
  const [, setLocation] = useLocation();
  const { me, updateMe, leave } = useStore();
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [searchQuery, setSearchQuery] = useState('');

  // Preference states
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('mq_sound_effects') !== 'off');
  const [battleNotify, setBattleNotify] = useState(() => localStorage.getItem('mq_notify_battle') !== 'off');
  const [friendNotify, setFriendNotify] = useState(() => localStorage.getItem('mq_notify_friends') !== 'off');
  const [streakNotify, setStreakNotify] = useState(() => localStorage.getItem('mq_notify_streak') !== 'off');

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('mq_font_size') as FontSize) || 'normal';
  });

  const [contrast, setContrastState] = useState<Contrast>(() => {
    return (localStorage.getItem('mq_contrast') as Contrast) || 'standard';
  });

  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const [sessions, setSessions] = useState(() => getUserSessions(me?.id || 'guest'));
  const [cacheCleared, setCacheCleared] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const handleTerminateOtherSessions = () => {
    const filtered = sessions.filter((s) => s.isCurrent);
    setSessions(filtered);
    if (me?.id) {
      try {
        localStorage.setItem(`medquiz-v2-sessions-${me.id}`, JSON.stringify(filtered));
      } catch {}
    }
  };

  const handleRemoveSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    if (me?.id) {
      try {
        localStorage.setItem(`medquiz-v2-sessions-${me.id}`, JSON.stringify(updated));
      } catch {}
    }
  };

  // Toggle Handlers
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('mq_sound_effects', next ? 'on' : 'off');
  };

  const toggleBattleNotify = () => {
    const next = !battleNotify;
    setBattleNotify(next);
    localStorage.setItem('mq_notify_battle', next ? 'on' : 'off');
  };

  const toggleFriendNotify = () => {
    const next = !friendNotify;
    setFriendNotify(next);
    localStorage.setItem('mq_notify_friends', next ? 'on' : 'off');
  };

  const toggleStreakNotify = () => {
    const next = !streakNotify;
    setStreakNotify(next);
    localStorage.setItem('mq_notify_streak', next ? 'on' : 'off');
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('mq_font_size', size);
    document.documentElement.classList.remove('font-size-normal', 'font-size-large', 'font-size-huge');
    document.documentElement.classList.add(`font-size-${size}`);
  };

  const setContrast = (c: Contrast) => {
    setContrastState(c);
    localStorage.setItem('mq_contrast', c);
    if (c === 'high') {
      document.documentElement.classList.add('contrast-high');
    } else {
      document.documentElement.classList.remove('contrast-high');
    }
  };

  const setThemeMode = (dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mq_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mq_theme', 'light');
    }
  };

  const handleClearCache = () => {
    setCacheCleared(true);
    try {
      sessionStorage.clear();
      // keep essential auth
    } catch {}
    setTimeout(() => setCacheCleared(false), 2500);
  };

  // Search items definition
  const searchIndex = useMemo(() => {
    return [
      { id: 'account', title: 'Account / Hisob va Profil', category: 'account', tags: ['ism', 'profil', 'username', 'otm', 'tahrirlash', 'chiqish', 'logout'] },
      { id: 'sound', title: 'Ovozli effektlar (Sound effects)', category: 'notifications', tags: ['ovoz', 'sound', 'musiqa', 'tovush', 'effekt'] },
      { id: 'battle_notify', title: 'Battle chaqiruvlari bildirishnomalari', category: 'notifications', tags: ['battle', 'taklif', 'bildirishnoma', 'xabar', 'invitation'] },
      { id: 'theme', title: 'Dizayn rejimi (Kunduzgi / Tungi)', category: 'appearance', tags: ['mavzu', 'theme', 'dark', 'light', 'tungi', 'kunduzgi', 'qora', 'oq'] },
      { id: 'font', title: 'Shrift o‘lchami (Standart, Katta, Juda katta)', category: 'appearance', tags: ['shrift', 'font', 'harf', 'o‘lcham', 'size', 'kattalashtirish'] },
      { id: 'contrast', title: 'Kontrast rejimi (Standart / Yuqori)', category: 'appearance', tags: ['kontrast', 'contrast', 'aniqlik', 'chegara'] },
      { id: 'sessions', title: 'Faol seanslar va xavfsizlik', category: 'security', tags: ['seans', 'session', 'qurilma', 'xavfsizlik', 'login', 'ip'] },
      { id: 'cache', title: 'Keshni tozalash', category: 'security', tags: ['kesh', 'cache', 'tozalash', 'xotira', 'ma’lumot'] },
      { id: 'faq', title: 'Tez-tez beriladigan savollar (FAQ)', category: 'help', tags: ['yordam', 'faq', 'savol', 'javob', 'help', 'admin'] },
      { id: 'telegram', title: 'Telegram administrator bilan aloqa', category: 'help', tags: ['telegram', 'admin', 'qo‘llab-quvvatlash', 'aloqa', 'support'] },
      { id: 'about', title: 'MedQuiz ilovasi haqida (v2.4.0)', category: 'about', tags: ['haqida', 'about', 'versiya', 'muallif', 'tibbiyot'] },
    ];
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return searchIndex.filter(
      (item) => item.title.toLowerCase().includes(q) || item.tags.some((t) => t.includes(q))
    );
  }, [searchQuery, searchIndex]);

  // Section items matching reference screenshot
  const menuItems: { id: SettingsSection; label: string; icon: string; desc: string }[] = [
    { id: 'account', label: 'Account', icon: 'ri-user-3-line', desc: 'Shaxsiy ma‘lumotlar va profil' },
    { id: 'notifications', label: 'Notifications', icon: 'ri-notification-3-line', desc: 'Ovozlar va battle bildirishnomalari' },
    { id: 'appearance', label: 'Appearance', icon: 'ri-eye-line', desc: 'Mavzu, shrift o‘lchami va kontrast' },
    { id: 'security', label: 'Privacy & Security', icon: 'ri-lock-2-line', desc: 'Faol seanslar va xavfsizlik' },
    { id: 'help', label: 'Help and Support', icon: 'ri-headphone-line', desc: 'FAQ, yo‘riqnoma va administrator' },
    { id: 'about', label: 'About', icon: 'ri-information-line', desc: 'Versiya, ma‘lumotlar va litsenziya' },
  ];

  const currentTitle = me ? getMedicalTitle(me.xp || 0) : null;

  return (
    <div className="mx-auto max-w-xl w-full">
      {/* Target iOS-style Mockup Container */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[22px] border border-slate-200/90 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-200">
        
        {/* Top Header */}
        <div className="relative flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-10">
          <button
            type="button"
            onClick={() => {
              if (activeSection) {
                setActiveSection(null);
              } else if (onBack) {
                onBack();
              } else {
                setLocation('/profile');
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
            aria-label="Orqaga"
          >
            <Icon name="ri-arrow-left-line" className="text-xl" />
          </button>

          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {activeSection === 'account'
              ? 'Account'
              : activeSection === 'notifications'
              ? 'Notifications'
              : activeSection === 'appearance'
              ? 'Appearance'
              : activeSection === 'security'
              ? 'Privacy & Security'
              : activeSection === 'help'
              ? 'Help and Support'
              : activeSection === 'about'
              ? 'About'
              : 'Settings'}
          </h1>

          <div className="w-9" />
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Main Menu View */}
          {activeSection === null && (
            <>
              {/* Search input with icon */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Icon name="ri-search-line" className="text-base" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a setting..."
                  className="w-full h-11 pl-10 pr-9 rounded-[14px] bg-slate-100/90 dark:bg-white/5 border border-transparent dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <Icon name="ri-close-circle-fill" className="text-base" />
                  </button>
                )}
              </div>

              {/* Dynamic Search Results */}
              {searchQuery.trim() !== '' ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Qidiruv natijalari</p>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                      “{searchQuery}” bo‘yicha hech narsa topilmadi.
                    </div>
                  ) : (
                    <div className="rounded-[16px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-white/5 overflow-hidden shadow-xs">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveSection(item.category as SettingsSection);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                            <p className="text-[11px] text-slate-400 capitalize">{item.category}</p>
                          </div>
                          <Icon name="ri-arrow-right-s-line" className="text-slate-400 text-xl" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* The 6 Standard Settings Rows (Matching User Image) */
                <div className="rounded-[18px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-white/5 overflow-hidden shadow-xs">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className="w-full flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-all text-left cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-white/5">
                          <Icon name={item.icon} className="text-lg" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{item.label}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <Icon name="ri-arrow-right-s-line" className="text-slate-400 dark:text-slate-500 text-2xl shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Subview 1: Account */}
          {activeSection === 'account' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              {/* Profile Card */}
              {me && (
                <div className="p-4 rounded-[16px] border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-center gap-3.5">
                  <div className="h-14 w-14 rounded-[12px] overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shrink-0 border border-slate-200 dark:border-white/10">
                    {me.avatar ? (
                      <img src={me.avatar} alt={me.name} className="h-full w-full object-cover" />
                    ) : (
                      (me.name || 'MQ').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-slate-900 dark:text-white text-base truncate">{me.name}</p>
                    <p className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">@{me.username}</p>
                    {currentTitle && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        <Icon name={currentTitle.icon} className="text-xs text-primary" />
                        {currentTitle.title}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Profile Details List */}
              <div className="rounded-[16px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-white/5 overflow-hidden text-xs sm:text-sm">
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">To‘liq ism</span>
                  <span className="font-bold text-slate-900 dark:text-white">{me?.name || 'Kiritilmagan'}</span>
                </div>
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Foydalanuvchi nomi</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">@{me?.username}</span>
                </div>
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">OTM / Institut</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right max-w-[200px] truncate">{me?.university || 'Kiritilmagan'}</span>
                </div>
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Kurs va Yo‘nalish</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {me?.course ? `${me.course}-kurs` : ''} {me?.faculty ? `· ${me.faculty}` : ''}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenEditProfile) {
                      onOpenEditProfile();
                    } else {
                      setLocation('/profile');
                    }
                  }}
                  className="w-full h-11 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Icon name="ri-edit-line" />
                  <span>Profilni tahrirlash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLogoutConfirm(true)}
                  className="w-full h-11 rounded-[12px] border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Icon name="ri-logout-box-line" />
                  <span>Hisobdan chiqish</span>
                </button>
              </div>

              {/* Logout Confirmation */}
              {logoutConfirm && (
                <div className="p-4 rounded-[14px] border border-rose-500/30 bg-rose-500/5 text-center space-y-3">
                  <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
                    Haqiqatan ham hisobingizdan chiqmoqchimisiz?
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLogoutConfirm(false)}
                      className="h-8 px-4 rounded-[8px] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      onClick={() => { leave(); setLocation('/'); }}
                      className="h-8 px-4 rounded-[8px] bg-rose-600 text-white text-xs font-bold"
                    >
                      Ha, chiqish
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subview 2: Notifications & Sound */}
          {activeSection === 'notifications' && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="rounded-[18px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
                {/* Sound effects */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Icon name="ri-volume-up-line" className="text-lg" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Ovozli effektlar</p>
                      <p className="text-[11px] text-slate-500">Test yechish, to‘g‘ri/xato va chimes tovushlari</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSound}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      soundEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        soundEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Battle Invitations */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      <Icon name="ri-sword-line" className="text-lg" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Battle chaqiruvlari</p>
                      <p className="text-[11px] text-slate-500">Boshqalar bellashuvga chaqirganda popup xabarnomasi</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleBattleNotify}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      battleNotify ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        battleNotify ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Friend Requests */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      <Icon name="ri-user-add-line" className="text-lg" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Do‘stlik xabarlari</p>
                      <p className="text-[11px] text-slate-500">Yangi do‘stlik so‘rovlari va qabul bildirishnomalari</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleFriendNotify}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      friendNotify ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        friendNotify ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Daily Streak Reminders */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Icon name="ri-fire-line" className="text-lg" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Kunlik test eslatmasi</p>
                      <p className="text-[11px] text-slate-500">Ketma-ketlik (streak) uzilmasligi uchun eslatma</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleStreakNotify}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      streakNotify ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        streakNotify ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subview 3: Appearance */}
          {activeSection === 'appearance' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              {/* Theme Mode Card */}
              <div className="p-4 rounded-[16px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] space-y-3">
                <div className="flex items-center gap-2">
                  <Icon name="ri-sun-moon-line" className="text-primary text-base" />
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Dizayn rejimi (Mavzu)</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setThemeMode(false)}
                    className={`h-11 px-3 rounded-[12px] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                      !isDark
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon name="ri-sun-line" />
                    <span>Kunduzgi rejim</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode(true)}
                    className={`h-11 px-3 rounded-[12px] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                      isDark
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon name="ri-moon-line" />
                    <span>Tungi rejim</span>
                  </button>
                </div>
              </div>

              {/* Font Size Card */}
              <div className="p-4 rounded-[16px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] space-y-3">
                <div className="flex items-center gap-2">
                  <Icon name="ri-font-size" className="text-primary text-base" />
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Shrift o‘lchami</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal' as FontSize, label: 'Standart (15px)' },
                    { id: 'large' as FontSize, label: 'Katta (17px)' },
                    { id: 'huge' as FontSize, label: 'Juda katta (19px)' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFontSize(s.id)}
                      className={`h-10 px-2 rounded-[10px] text-xs font-bold transition-all border cursor-pointer ${
                        fontSize === s.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contrast Mode */}
              <div className="p-4 rounded-[16px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] space-y-3">
                <div className="flex items-center gap-2">
                  <Icon name="ri-contrast-line" className="text-primary text-base" />
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Kontrast rejimi</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContrast('standard')}
                    className={`h-10 px-3 rounded-[10px] text-xs font-bold transition-all border cursor-pointer ${
                      contrast === 'standard'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Standart kontrast
                  </button>
                  <button
                    type="button"
                    onClick={() => setContrast('high')}
                    className={`h-10 px-3 rounded-[10px] text-xs font-bold transition-all border cursor-pointer ${
                      contrast === 'high'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Yuqori kontrast
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <div className="p-4 rounded-[16px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] space-y-3">
                <div className="flex items-center gap-2">
                  <Icon name="ri-translate-2" className="text-primary text-base" />
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Ilova tili (Language)</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'uz', label: 'O‘zbekcha' },
                    { code: 'uz_cyrl', label: 'Ўзбекча' },
                    { code: 'ru', label: 'Русский' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        localStorage.setItem('mq_lang', lang.code);
                        window.location.reload();
                      }}
                      className="h-10 px-2 rounded-[10px] text-xs font-bold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer"
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subview 4: Privacy & Security */}
          {activeSection === 'security' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              {/* Active Sessions */}
              <div className="p-4 rounded-[16px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="ri-shield-keyhole-line" className="text-emerald-500 text-base" />
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Faol seanslar ({sessions.length})</p>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleTerminateOtherSessions}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Boshqa barcha seanslardan chiqish
                    </button>
                  )}
                </div>

                <div className="space-y-2 mt-2">
                  {sessions.map((s, idx) => {
                    const isCurrent = s.id === localStorage.getItem('mq_session_id') || idx === 0;
                    return (
                      <div
                        key={s.id || idx}
                        className={`p-3 rounded-[12px] border flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-slate-200/70 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            name={s.deviceName?.toLowerCase().includes('iphone') || s.deviceName?.toLowerCase().includes('android') || s.deviceType === 'mobile' ? 'ri-smartphone-line' : 'ri-computer-line'}
                            className={`text-xl ${isCurrent ? 'text-emerald-600' : 'text-slate-400'}`}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.deviceName || 'Noma‘lum qurilma'}</p>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                  Hozirgi seans
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {s.browser} · {s.ip || '127.0.0.1'} · {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'Bugun'}
                            </p>
                          </div>
                        </div>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSession(s.id)}
                            className="text-xs font-bold text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-[8px] cursor-pointer"
                            title="Seansni yakunlash"
                          >
                            <Icon name="ri-logout-circle-r-line" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cache Management */}
              <div className="p-4 rounded-[16px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] space-y-2">
                <div className="flex items-center gap-2">
                  <Icon name="ri-delete-bin-5-line" className="text-amber-500 text-base" />
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Kesh va xotirani tozalash</p>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ilovadagi vaqtinchalik javoblar keshini tozalaydi. Boshqa muhim ma‘lumotlar saqlanadi.
                </p>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="mt-1 h-9 px-4 rounded-[10px] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer flex items-center gap-1.5"
                >
                  <Icon name={cacheCleared ? "ri-check-line" : "ri-refresh-line"} className={cacheCleared ? "text-emerald-500" : ""} />
                  <span>{cacheCleared ? 'Kesh tozalandi!' : 'Keshni tozalash'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Subview 5: Help & Support */}
          {activeSection === 'help' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              {/* Telegram Support Link */}
              <div className="p-4 rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-[10px] bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xl shadow-xs">
                    <Icon name="ri-telegram-fill" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Admin bilan aloqa</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Savollar yoki takliflar bormi?</p>
                  </div>
                </div>
                <a
                  href="https://t.me/medquiz_support"
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 px-3.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <span>Bog‘lanish</span>
                  <Icon name="ri-external-link-line" />
                </a>
              </div>

              {/* FAQ Accordion */}
              <div className="p-4 rounded-[16px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                  <Icon name="ri-questionnaire-line" className="text-primary text-base" />
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Tez-tez beriladigan savollar (FAQ)</p>
                </div>
                <div className="space-y-2 text-xs">
                  <details className="group rounded-[10px] border border-slate-200/70 dark:border-white/5 p-2.5">
                    <summary className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer list-none flex items-center justify-between">
                      <span>Testlarni qanday formatda yuklash mumkin?</span>
                      <Icon name="ri-arrow-down-s-line" className="transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Siz testlarni .TXT, .DOCX (Word) va .PDF formatlarida to‘g‘ridan-to‘g‘ri “To‘plamlar” bo‘limida yuklashingiz mumkin. Tizim avtomatik savol va javoblarni taniy oladi.
                    </p>
                  </details>

                  <details className="group rounded-[10px] border border-slate-200/70 dark:border-white/5 p-2.5">
                    <summary className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer list-none flex items-center justify-between">
                      <span>Battle rejimi qanday ishlaydi?</span>
                      <Icon name="ri-arrow-down-s-line" className="transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Xona kodi orqali do‘stlaringizni taklif qilasiz yoki AI tibbiyot botlariga qarshi darsliklar bo‘yicha bellashasiz. Birinchi to‘g‘ri javob bergan 25 ball oladi!
                    </p>
                  </details>

                  <details className="group rounded-[10px] border border-slate-200/70 dark:border-white/5 p-2.5">
                    <summary className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer list-none flex items-center justify-between">
                      <span>Xatolarim qayerda saqlanadi?</span>
                      <Icon name="ri-arrow-down-s-line" className="transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Noto‘g‘ri belgilangan har bir savol avtomatik ravishda “Xatolarim” bo‘limiga tushadi va ularni qayta mashq qilish imkoniyati beriladi.
                    </p>
                  </details>
                </div>
              </div>
            </div>
          )}

          {/* Subview 6: About */}
          {activeSection === 'about' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200 text-center">
              <div className="p-6 rounded-[18px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-display text-2xl font-black shadow-md">
                  M
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">MedQuiz Platformasi</h2>
                  <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">Versiya 2.4.0</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Tibbiyot oliygohlari talabalari, rezidentlar va shifokorlar uchun test sinovlari, interaktiv battle bellashuvlari va bilimni mustahkamlash tizimi.
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400">
                  © 2026 MedQuiz · Barcha huquqlar himoyalangan
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
