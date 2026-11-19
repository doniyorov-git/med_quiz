import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Icon } from '@/components/chrome';
import { useStore } from '@/lib/store';
import { formatDurationUz, formatDurationShortUz } from '@/lib/time-tracker';
import {
  isAdminAuthenticated,
  verifyAdminPin,
  setAdminAuthenticated,
  fetchAdminUsers,
  blockUser,
  adjustUserCoins,
  fetchBanners,
  saveBanner,
  deleteBanner,
  fetchAdminConversations,
  fetchAdminChat,
  sendAdminChatMessage,
  sendBroadcastNotification,
  fetchNotifications,
} from '@/lib/admin-api';
import type { AppBanner, AppBannerTheme, AdminChatMessage, BroadcastNotification, PublicUser } from '@/lib/types';

type AdminTab = 'analytics' | 'users' | 'chat' | 'banners' | 'broadcast';

// Mock chart data for weekly activity
const WEEKLY_ACTIVITY = [
  { day: 'Dush', hours: 42, users: 18, battles: 12 },
  { day: 'Sesh', hours: 58, users: 24, battles: 19 },
  { day: 'Chor', hours: 71, users: 31, battles: 28 },
  { day: 'Pay', hours: 85, users: 39, battles: 35 },
  { day: 'Jum', hours: 94, users: 44, battles: 41 },
  { day: 'Shan', hours: 128, users: 56, battles: 58 },
  { day: 'Yak', hours: 145, users: 62, battles: 64 },
];

export function AdminPage() {
  const { me, theme, setTheme } = useStore();
  const [, setLocation] = useLocation();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isAdminAuthenticated());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Users State
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'online' | 'blocked'>('all');
  const [selectedUserForAction, setSelectedUserForAction] = useState<PublicUser | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('Qoidabuzarlik yoki ma‘muriyat qarori bilan cheklandi');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [coinsAmountInput, setCoinsAmountInput] = useState(50);
  const [showCoinsModal, setShowCoinsModal] = useState(false);

  // Banners State
  const [banners, setBanners] = useState<AppBanner[]>([]);
  const [bannerForm, setBannerForm] = useState<Omit<AppBanner, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    badge: 'Yangi',
    theme: 'emerald',
    icon: 'ri-fire-fill',
    actionText: 'Ishtirok etish',
    actionUrl: '/battle',
    active: true,
  });
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Chat State (Telegram / Intercom Messenger Style)
  const [conversations, setConversations] = useState<
    { userId: string; userName: string; userAvatar?: string | null; lastMessage: string; lastTime: number; unreadCount: number }[]
  >([]);
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [chatMessages, setChatMessages] = useState<AdminChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'success' | 'warning' | 'alert'>('info');
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastNotification[]>([]);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load Data
  useEffect(() => {
    if (!isAuthenticated) return;
    loadAllData();
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setUsersLoading(true);
    const [userData, bannerData, convs, notifs] = await Promise.all([
      fetchAdminUsers(),
      fetchBanners(),
      fetchAdminConversations(),
      fetchNotifications(),
    ]);
    setUsers(userData);
    setBanners(bannerData);
    setConversations(convs);
    setBroadcastHistory(notifs);

    if (userData.length > 0 && !selectedChatUserId) {
      setSelectedChatUserId(userData[0].id);
    }
    setUsersLoading(false);
  };

  // Chat Polling
  useEffect(() => {
    if (!isAuthenticated || !selectedChatUserId) return;

    let isMounted = true;
    const fetchCurrentChat = async () => {
      const msgs = await fetchAdminChat(selectedChatUserId);
      if (isMounted) {
        setChatMessages(msgs);
      }
    };

    fetchCurrentChat();
    const interval = window.setInterval(fetchCurrentChat, 3000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [isAuthenticated, selectedChatUserId]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // PIN Handler
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(pinInput)) {
      setIsAuthenticated(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  const handleLogoutAdmin = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
    setLocation('/dashboard');
  };

  // User Actions
  const handleToggleBlock = async () => {
    if (!selectedUserForAction) return;
    const targetState = !selectedUserForAction.isBlocked;
    const success = await blockUser(selectedUserForAction.id, targetState, blockReasonInput);

    if (success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUserForAction.id
            ? { ...u, isBlocked: targetState, blockedReason: targetState ? blockReasonInput : undefined }
            : u
        )
      );
      showToast(targetState ? 'Foydalanuvchi akkaunti bloklandi' : 'Foydalanuvchi blokdan chiqarildi');
    }
    setShowBlockModal(false);
    setSelectedUserForAction(null);
  };

  const handleGiveCoins = async () => {
    if (!selectedUserForAction) return;
    const success = await adjustUserCoins(selectedUserForAction.id, coinsAmountInput);
    if (success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUserForAction.id
            ? { ...u, coins: (u.coins || 0) + coinsAmountInput }
            : u
        )
      );
      showToast(`${selectedUserForAction.name} ga +${coinsAmountInput} MedCoins qo‘shildi!`);
    }
    setShowCoinsModal(false);
    setSelectedUserForAction(null);
  };

  // Banner Actions
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) return;

    const bannerObj: AppBanner = {
      id: editingBannerId || `banner-${Date.now()}`,
      title: bannerForm.title.trim(),
      description: bannerForm.description.trim(),
      badge: bannerForm.badge?.trim() || undefined,
      theme: bannerForm.theme,
      icon: 'ri-fire-fill',
      actionText: bannerForm.actionText?.trim() || 'Ko‘rish',
      actionUrl: bannerForm.actionUrl?.trim() || '/dashboard',
      active: bannerForm.active,
      createdAt: Date.now(),
    };

    const success = await saveBanner(bannerObj);
    if (success) {
      const data = await fetchBanners();
      setBanners(data);
      setEditingBannerId(null);
      setBannerForm({
        title: '',
        description: '',
        badge: 'Yangi',
        theme: 'emerald',
        icon: 'ri-fire-fill',
        actionText: 'Ishtirok etish',
        actionUrl: '/battle',
        active: true,
      });
      showToast('Banner saqlandi va talabalarga ko‘rsatilmoqda!');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Haqiqatdan ham ushbu bannerni o‘chirmoqchimisiz?')) return;
    await deleteBanner(id);
    const data = await fetchBanners();
    setBanners(data);
    showToast('Banner o‘chirildi');
  };

  const handleToggleBannerActive = async (banner: AppBanner) => {
    const updated = { ...banner, active: !banner.active };
    await saveBanner(updated);
    const data = await fetchBanners();
    setBanners(data);
    showToast(updated.active ? 'Banner faollashtirildi' : 'Banner nofaol qilindi');
  };

  // Chat Actions (Messenger)
  const handleSendAdminMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (overrideText || chatInput).trim();
    if (!textToSend || !selectedChatUserId) return;

    const userObj = users.find((u) => u.id === selectedChatUserId);
    const userName = userObj?.name || 'Talaba';

    setChatLoading(true);
    const sent = await sendAdminChatMessage(selectedChatUserId, textToSend, userName, 'admin');
    if (sent) {
      setChatMessages((prev) => [...prev, sent]);
      setChatInput('');
    }
    setChatLoading(false);
  };

  // Broadcast Actions
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    const success = await sendBroadcastNotification({
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      type: broadcastType,
    });

    if (success) {
      setBroadcastTitle('');
      setBroadcastMessage('');
      const data = await fetchNotifications();
      setBroadcastHistory(data);
      showToast('Ommaviy xabarnoma barcha talabalarga yuborildi!');
    }
  };

  // Filtered lists
  const now = Date.now();
  const onlineThreshold = 5 * 60 * 1000;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        u.university.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (userFilter === 'blocked') return u.isBlocked;
      if (userFilter === 'online') return now - (u.seen || 0) < onlineThreshold;
      if (userFilter === 'active') return !u.isBlocked;
      return true;
    });
  }, [users, userSearch, userFilter, now]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const onlineUsers = users.filter((u) => now - (u.seen || 0) < onlineThreshold).length;
    const blockedUsers = users.filter((u) => u.isBlocked).length;
    const totalSecondsSpent = users.reduce((acc, u) => acc + (u.totalTimeSpent || 0), 0);
    const totalCoins = users.reduce((acc, u) => acc + (u.coins || 0), 0);
    const totalBattles = users.reduce((acc, u) => acc + (u.battleWins || 0), 0);

    return {
      totalUsers,
      onlineUsers,
      blockedUsers,
      totalSecondsSpent,
      totalCoins,
      totalBattles,
    };
  }, [users, now]);

  const selectedChatUser = useMemo(() => {
    return users.find((u) => u.id === selectedChatUserId) || null;
  }, [users, selectedChatUserId]);

  // ----------------------------------------------------------------------
  // 1. PIN LOCK SCREEN
  // ----------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white relative overflow-hidden">
        {/* Orqa fon nur effekti */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-emerald-500/25 p-8 shadow-2xl backdrop-blur-xl space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <Icon name="ri-shield-keyhole-fill" className="text-3xl" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              MedQuiz Administrator
            </h2>
            <p className="text-xs text-slate-400">
              Boshqaruv markaziga kirish uchun xavfsizlik PIN kodini kiriting
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={10}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="••••"
                className="w-full h-14 text-center tracking-[0.5em] text-2xl font-mono font-bold rounded-2xl border border-slate-700 bg-slate-800/80 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-slate-500"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-rose-400 font-semibold mt-2 animate-shake flex items-center justify-center gap-1">
                  <Icon name="ri-error-warning-line" />
                  <span>Kiritilgan PIN kod noto‘g‘ri!</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Icon name="ri-lock-unlock-fill" className="text-lg" />
              <span>Boshqaruv Paneliga Kirish</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setLocation('/dashboard')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              ← Ilovaga qaytish
            </button>
            <span>Standart PIN: <strong className="text-slate-300 font-mono">7777</strong></span>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 2. STANDALONE DEDICATED ADMIN PORTAL
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-600/40 text-xs sm:text-sm font-bold animate-in slide-in-from-top-4 duration-200">
          <Icon name="ri-checkbox-circle-fill" className="text-xl" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2.1 ADMIN STANDALONE SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1424] transition-all duration-200 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
              <Icon name="ri-hospital-fill" className="text-xl" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h2 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                  MedQuiz Admin
                </h2>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Tizim Faol</span>
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title={sidebarCollapsed ? 'Kengaytirish' : 'Kichraytirish'}
          >
            <Icon name={sidebarCollapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'} className="text-base" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {[
            {
              id: 'analytics' as const,
              label: 'Statistika & Analitika',
              icon: 'ri-dashboard-3-line',
              activeIcon: 'ri-dashboard-3-fill',
              badge: undefined,
            },
            {
              id: 'users' as const,
              label: 'Foydalanuvchilar',
              icon: 'ri-team-line',
              activeIcon: 'ri-team-fill',
              badge: users.length.toString(),
            },
            {
              id: 'chat' as const,
              label: 'Jonli Chat Inbox',
              icon: 'ri-chat-3-line',
              activeIcon: 'ri-chat-3-fill',
              badge: 'Jonli',
              badgeColor: 'bg-emerald-500 text-white',
            },
            {
              id: 'banners' as const,
              label: 'Banner Konstruktor',
              icon: 'ri-layout-masonry-line',
              activeIcon: 'ri-layout-masonry-fill',
              badge: banners.filter((b) => b.active).length.toString(),
            },
            {
              id: 'broadcast' as const,
              label: 'Ommaviy Xabarnoma',
              icon: 'ri-megaphone-line',
              activeIcon: 'ri-megaphone-fill',
              badge: undefined,
            },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon name={isActive ? item.activeIcon : item.icon} className="text-lg shrink-0" />
                {!sidebarCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200/80 dark:border-white/10 space-y-2">
          <button
            type="button"
            onClick={() => setLocation('/dashboard')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-600 transition-colors cursor-pointer"
            title="Talaba ilovasiga o‘tish"
          >
            <Icon name="ri-arrow-go-back-line" className="text-base text-emerald-500 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Talaba rejimiga o‘tish</span>}
          </button>

          <button
            type="button"
            onClick={handleLogoutAdmin}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Chiqish"
          >
            <Icon name="ri-lock-line" className="text-base shrink-0" />
            {!sidebarCollapsed && <span>Adminni yopish</span>}
          </button>
        </div>
      </aside>

      {/* 2.2 MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0e1424]/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {activeTab === 'analytics' && 'Boshqaruv & Statistika'}
              {activeTab === 'users' && 'Talabalar Ro‘yxati'}
              {activeTab === 'chat' && 'Jonli Murojaatlar & Chat'}
              {activeTab === 'banners' && 'Banner Konstruktori'}
              {activeTab === 'broadcast' && 'Ommaviy Xabarnoma'}
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              Production
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Time Counter info */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs font-bold">
              <Icon name="ri-time-line" className="text-emerald-500" />
              <span>Jami faollik: {formatDurationShortUz(stats.totalSecondsSpent)}</span>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Mavzuni almashtirish"
            >
              <Icon name={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'} className="text-lg" />
            </button>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2 pl-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xs shadow-xs">
                {(me?.name || 'A').slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* ============================================================== */}
          {/* TAB 1: ANALITIKA & VAQT STATISTIKASI                           */}
          {/* ============================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* KPI Cards (6 ta ustun) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Jami A’zolar</span>
                    <Icon name="ri-user-star-line" className="text-emerald-500 text-base" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {stats.totalUsers}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <Icon name="ri-arrow-up-line" />
                    <span>100% real baza</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Hozir Onlayn</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <p className="text-2xl font-black text-emerald-600 tracking-tight">
                    {stats.onlineUsers}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Oxirgi 5 daqiqada</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5 col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Sarflangan Vaqt</span>
                    <Icon name="ri-timer-flash-line" className="text-indigo-500 text-base" />
                  </div>
                  <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                    {formatDurationShortUz(stats.totalSecondsSpent)}
                  </p>
                  <p className="text-[10px] text-indigo-500 font-bold">Har 60s DB ga yoziladi</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Bloklangan</span>
                    <Icon name="ri-shield-cross-line" className="text-rose-500 text-base" />
                  </div>
                  <p className="text-2xl font-black text-rose-500 tracking-tight">
                    {stats.blockedUsers}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Cheklangan hisob</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">MedCoins</span>
                    <Icon name="ri-copper-coin-fill" className="text-amber-500 text-base" />
                  </div>
                  <p className="text-2xl font-black text-amber-500 tracking-tight">
                    {stats.totalCoins}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Aylanma mukofot</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Battlelar</span>
                    <Icon name="ri-sword-fill" className="text-purple-500 text-base" />
                  </div>
                  <p className="text-2xl font-black text-purple-500 tracking-tight">
                    {stats.totalBattles}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Bellashuv yutug‘i</p>
                </div>
              </div>

              {/* Grafiklar va Analitika qatori */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Vaqt va Faollik Dinamikasi Grafigi (2 ustun) */}
                <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        Haftalik Ta’lim Vaqti Dinamikasi
                      </h3>
                      <p className="text-xs text-slate-400">
                        Talabalarning kunlik sarflagan soatlari va faolligi
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                      Haftalik Hisobot
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={WEEKLY_ACTIVITY}>
                        <defs>
                          <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="hours"
                          name="O‘qish vaqti (soat)"
                          stroke="#10b981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#emeraldGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Tibbiyot Institutlari taqsimoti */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Tibbiyot Institutlari
                  </h3>
                  <p className="text-xs text-slate-400">Talabalarning OTMlar bo‘yicha taqsimoti</p>

                  <div className="space-y-3 pt-1">
                    {[
                      { name: 'Toshkent Tibbiyot Akademiyasi (TTA)', count: 42, color: 'bg-emerald-500' },
                      { name: 'Samarqand Davlat Tibbiyot Univ.', count: 28, color: 'bg-teal-500' },
                      { name: 'Toshkent Pediatriya Instituti', count: 19, color: 'bg-cyan-500' },
                      { name: 'Andijon Davlat Tibbiyot Instituti', count: 15, color: 'bg-indigo-500' },
                      { name: 'Buxoro Davlat Tibbiyot Instituti', count: 9, color: 'bg-purple-500' },
                    ].map((inst) => (
                      <div key={inst.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                            {inst.name}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{inst.count}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${inst.color}`}
                            style={{ width: `${inst.count}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Eng Ko'p Vaqt O'qigan Talabalar (Leaderboard by Time) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Eng Faol Talabalar (Ilovada sarflangan vaqt reytingi)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Har bir talabaning 1 soniyalik log yozuvi bo‘yicha hisoblangan jami vaqti
                    </p>
                  </div>
                  <Icon name="ri-medal-fill" className="text-amber-500 text-2xl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  {[...users]
                    .sort((a, b) => (b.totalTimeSpent || 0) - (a.totalTimeSpent || 0))
                    .slice(0, 4)
                    .map((u, idx) => (
                      <div
                        key={u.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 space-y-2.5 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 font-black text-xs">
                            #{idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                            <Icon name="ri-copper-coin-fill" />
                            <span>{u.coins || 0}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="h-10 w-10 rounded-xl object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs">
                              {(u.name || 'M').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            Sarflangan vaqt
                          </p>
                          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                            {formatDurationUz(u.totalTimeSpent || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: FOYDALANUVCHILAR BOSHQARUVI                             */}
          {/* ============================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Qidiruv va Filtr */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs">
                <div className="relative flex-1">
                  <Icon name="ri-search-line" className="absolute left-3.5 top-3 text-slate-400 text-base" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Ism, username, telefon yoki OTM bo‘yicha qidirish..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs sm:text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                  {(
                    [
                      { id: 'all', label: 'Barchasi' },
                      { id: 'online', label: '🟢 Onlayn' },
                      { id: 'active', label: 'Faollar' },
                      { id: 'blocked', label: '🚫 Bloklangan' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUserFilter(f.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                        userFilter === f.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Foydalanuvchilar Jadvali */}
              <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-5">Talaba</th>
                        <th className="py-3.5 px-4">Telefon</th>
                        <th className="py-3.5 px-4">Ilovada ishlagan vaqti</th>
                        <th className="py-3.5 px-4">MedCoins / XP</th>
                        <th className="py-3.5 px-4">Holati</th>
                        <th className="py-3.5 px-5 text-right">Boshqaruv</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            Foydalanuvchi topilmadi
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isOnline = now - (u.seen || 0) < onlineThreshold;
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                              {/* Talaba */}
                              <td className="py-3.5 px-5">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {u.avatar ? (
                                      <img src={u.avatar} alt="" className="h-10 w-10 rounded-xl object-cover" />
                                    ) : (
                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs">
                                        {(u.name || 'M').slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    {isOnline && (
                                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0e1424]" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                                    <p className="text-[11px] text-slate-400 truncate">
                                      @{u.username} · {u.university || 'Tibbiyot OTM'}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Telefon */}
                              <td className="py-3.5 px-4">
                                <span className="font-mono text-slate-700 dark:text-slate-300">
                                  {u.phone || 'Kiritilmagan'}
                                </span>
                              </td>

                              {/* Ilovada ishlagan vaqti */}
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                                  <Icon name="ri-time-line" className="text-emerald-500" />
                                  <span>{formatDurationUz(u.totalTimeSpent || 0)}</span>
                                </span>
                              </td>

                              {/* MedCoins & XP */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                                    <Icon name="ri-coin-fill" />
                                    <span>{u.coins || 0} MedCoins</span>
                                  </span>
                                  <p className="text-[10px] text-slate-400">{u.xp || 0} XP</p>
                                </div>
                              </td>

                              {/* Holati */}
                              <td className="py-3.5 px-4">
                                {u.isBlocked ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 border border-rose-500/20">
                                    <Icon name="ri-forbid-line" />
                                    <span>Bloklangan</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                                    <Icon name="ri-checkbox-circle-line" />
                                    <span>Faol</span>
                                  </span>
                                )}
                              </td>

                              {/* Boshqaruv tugmalari */}
                              <td className="py-3.5 px-5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Chat ochish */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedChatUserId(u.id);
                                      setActiveTab('chat');
                                    }}
                                    className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                    title="Chatga o‘tish"
                                  >
                                    <Icon name="ri-chat-3-line" className="text-sm" />
                                  </button>

                                  {/* MedCoins berish */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUserForAction(u);
                                      setShowCoinsModal(true);
                                    }}
                                    className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-colors cursor-pointer"
                                    title="MedCoins mukofotlash"
                                  >
                                    <Icon name="ri-copper-coin-line" className="text-sm" />
                                  </button>

                                  {/* Bloklash / Ochish */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUserForAction(u);
                                      setShowBlockModal(true);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                                      u.isBlocked
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                        : 'border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600'
                                    }`}
                                  >
                                    {u.isBlocked ? 'Ochish' : 'Bloklash'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: TELEGRAM / INTERCOM USLUBIDAGI CHAT                      */}
          {/* ============================================================== */}
          {activeTab === 'chat' && (
            <div className="h-[680px] rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xl overflow-hidden flex animate-in fade-in duration-150">
              {/* 3.1 Chap Panel: Suhbatlar ro'yxati */}
              <div className="w-80 border-r border-slate-200/80 dark:border-white/10 flex flex-col bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="p-3.5 border-b border-slate-200/80 dark:border-white/10">
                  <div className="relative">
                    <Icon name="ri-search-line" className="absolute left-3 top-2.5 text-slate-400 text-sm" />
                    <input
                      type="text"
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      placeholder="Murojaatlardan qidirish..."
                      className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                  {users
                    .filter((u) => !chatSearch || u.name.toLowerCase().includes(chatSearch.toLowerCase()))
                    .map((u) => {
                      const isSelected = selectedChatUserId === u.id;
                      const isOnline = now - (u.seen || 0) < onlineThreshold;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedChatUserId(u.id)}
                          className={`w-full flex items-center gap-3 p-3.5 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/25 border-l-4 border-emerald-600'
                              : 'hover:bg-slate-100/70 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="relative shrink-0">
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="h-10 w-10 rounded-2xl object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xs">
                                {(u.name || 'M').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            {isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0e1424]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{u.name}</p>
                              <span className="text-[10px] text-slate-400">
                                {formatDurationShortUz(u.totalTimeSpent)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">@{u.username}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* 3.2 O'ng Panel: Jonli Messenger */}
              <div className="flex-1 flex flex-col bg-white dark:bg-[#0e1424]">
                {selectedChatUser ? (
                  <>
                    {/* Chat Header */}
                    <div className="h-16 px-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-50/40 dark:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {selectedChatUser.avatar ? (
                            <img src={selectedChatUser.avatar} alt="" className="h-10 w-10 rounded-xl object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs">
                              {(selectedChatUser.name || 'M').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {now - (selectedChatUser.seen || 0) < onlineThreshold && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0e1424]" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {selectedChatUser.name}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            @{selectedChatUser.username} · Ilovada: {formatDurationUz(selectedChatUser.totalTimeSpent)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForAction(selectedChatUser);
                            setShowCoinsModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-xs font-bold transition-colors cursor-pointer"
                        >
                          +MedCoins
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForAction(selectedChatUser);
                            setShowBlockModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {selectedChatUser.isBlocked ? 'Ochish' : 'Bloklash'}
                        </button>
                      </div>
                    </div>

                    {/* Chat Messages Stream */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/20 dark:bg-transparent">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                          <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-3xl text-emerald-500 mb-3 shadow-inner">
                            <Icon name="ri-chat-voice-line" />
                          </div>
                          <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                            {selectedChatUser.name} bilan suhbat
                          </p>
                          <p className="text-slate-400 text-xs mt-1 max-w-sm">
                            Ushbu talabaga bevosita administrator nomidan javob yoki yo‘riqnoma yozing.
                          </p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isAdmin = msg.sender === 'admin';
                          return (
                            <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[78%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed space-y-1 shadow-xs ${
                                  isAdmin
                                    ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-xs'
                                    : 'bg-white dark:bg-white/10 text-slate-900 dark:text-white rounded-tl-xs border border-slate-200/80 dark:border-white/5'
                                }`}
                              >
                                <span className="block text-[10px] font-bold opacity-80">
                                  {isAdmin ? '👨‍💼 MedQuiz Administrator' : msg.userName || 'Talaba'}
                                </span>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                <div className="flex items-center justify-end gap-1 text-[9px] opacity-70 pt-0.5">
                                  <span>
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  {isAdmin && <Icon name="ri-check-double-line" className="text-xs" />}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatMessagesEndRef} />
                    </div>

                    {/* Tezkor Javob Shablonlari */}
                    <div className="px-4 py-2 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-hide bg-slate-50/60 dark:bg-white/[0.02]">
                      {[
                        '✅ Faylingiz tekshirildi va bazaga qo‘shildi.',
                        '🔓 Akkauntingiz tekshiruvdan o‘tdi va blokdan chiqarildi.',
                        '🎁 Faolligingiz uchun +50 MedCoins taqdim etildi!',
                        '🩺 Qaysi fan testlarida xatolik topdingiz?',
                        '⚡ Testlar yangilandi, keshni tozalab qayta kiring.',
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendAdminMessage(undefined, preset)}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-300 font-medium hover:border-emerald-500 hover:text-emerald-600 whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {/* Input maydoni */}
                    <form
                      onSubmit={(e) => handleSendAdminMessage(e)}
                      className="p-3.5 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2 bg-white dark:bg-[#0e1424]"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Talabaga xabar yoki ko‘rsatma yozing..."
                        className="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs sm:text-sm outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-white/10 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading || !chatInput.trim()}
                        className="h-11 px-5 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
                      >
                        <span>Yuborish</span>
                        <Icon name="ri-send-plane-fill" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    Chap paneldan suhbatlashmoqchi bo‘lgan talabani tanlang
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: BANNER KONSTRUKTOR                                      */}
          {/* ============================================================== */}
          {activeTab === 'banners' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Konstruktor Formasi */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                      <Icon name="ri-paint-brush-line" className="text-lg" />
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {editingBannerId ? 'Bannerni tahrirlash' : 'Yangi Promo Banner Yaratish'}
                    </h3>
                  </div>

                  <form onSubmit={handleSaveBanner} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Banner Sarlavhasi *
                      </label>
                      <input
                        type="text"
                        required
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                        placeholder="Masalan: Yozgi Anatomiya Onlayn Battle Haftaligi!"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Qisqa Tavsif / Matn
                      </label>
                      <textarea
                        rows={2}
                        value={bannerForm.description}
                        onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                        placeholder="Masalan: Barcha talabalar o‘rtasida real vaqtda bellashing va 2 barobar ko‘p MedCoins yutib oling."
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Badj matni (Badge)
                        </label>
                        <input
                          type="text"
                          value={bannerForm.badge}
                          onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                          placeholder="Masalan: Yangi, Aksiya"
                          className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Rang mavzusi (Theme)
                        </label>
                        <select
                          value={bannerForm.theme}
                          onChange={(e) => setBannerForm({ ...bannerForm, theme: e.target.value as AppBannerTheme })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500 font-semibold"
                        >
                          <option value="emerald">Yashil Tibbiyot (Emerald)</option>
                          <option value="cyan">Moviy Dengiz (Cyan)</option>
                          <option value="purple">Binafsharang Premium (Purple)</option>
                          <option value="amber">Oltin Yulduz (Amber)</option>
                          <option value="rose">Qizil Shoshilinch (Rose)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Tugma matni
                        </label>
                        <input
                          type="text"
                          value={bannerForm.actionText}
                          onChange={(e) => setBannerForm({ ...bannerForm, actionText: e.target.value })}
                          placeholder="Masalan: Ishtirok etish"
                          className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Havola (URL)
                        </label>
                        <input
                          type="text"
                          value={bannerForm.actionUrl}
                          onChange={(e) => setBannerForm({ ...bannerForm, actionUrl: e.target.value })}
                          placeholder="Masalan: /battle yoki /banks"
                          className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="activeBannerToggle"
                        checked={bannerForm.active}
                        onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="activeBannerToggle" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Bannerni darhol talabalar bosh sahifasida faollashtirish
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
                      >
                        <Icon name="ri-check-line" className="text-base" />
                        <span>{editingBannerId ? 'O‘zgarishlarni saqlash' : 'Bannerni e‘lon qilish'}</span>
                      </button>

                      {editingBannerId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBannerId(null);
                            setBannerForm({
                              title: '',
                              description: '',
                              badge: 'Yangi',
                              theme: 'emerald',
                              icon: 'ri-fire-fill',
                              actionText: 'Ishtirok etish',
                              actionUrl: '/battle',
                              active: true,
                            });
                          }}
                          className="px-4 h-11 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Bekor qilish
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* 2. Jonli Prevyu */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Icon name="ri-eye-line" className="text-emerald-500" />
                    <span>Jonli Prevyu (Talabalar Dashboardida qanday ko‘rinadi):</span>
                  </h3>

                  <div
                    className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-xl transition-all ${
                      bannerForm.theme === 'emerald'
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
                        : bannerForm.theme === 'cyan'
                        ? 'bg-gradient-to-r from-sky-600 via-teal-600 to-cyan-600'
                        : bannerForm.theme === 'purple'
                        ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700'
                        : bannerForm.theme === 'amber'
                        ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600'
                        : 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 min-w-0">
                        {bannerForm.badge && (
                          <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs text-white">
                            {bannerForm.badge}
                          </span>
                        )}
                        <h4 className="text-xl sm:text-2xl font-black leading-snug">
                          {bannerForm.title || 'Banner Sarlavhasi'}
                        </h4>
                        <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-md">
                          {bannerForm.description || 'Bu yerda banner haqida qisqa va qiziqarli tavsif matni joylashadi.'}
                        </p>
                      </div>

                      <span className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-slate-950 font-bold text-xs sm:text-sm shadow-md">
                        <span>{bannerForm.actionText || 'Ishtirok etish'}</span>
                        <Icon name="ri-arrow-right-line" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mavjud Bannerlar */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Mavjud Bannerlar ({banners.length})</span>
                  <Icon name="ri-archive-line" className="text-slate-400" />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {banners.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            b.active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-200 dark:bg-white/10 text-slate-400'
                          }`}
                        >
                          {b.active ? 'Faol' : 'Nofaol'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBannerId(b.id);
                              setBannerForm({
                                title: b.title,
                                description: b.description,
                                badge: b.badge || '',
                                theme: b.theme,
                                icon: 'ri-fire-fill',
                                actionText: b.actionText || 'Ko‘rish',
                                actionUrl: b.actionUrl || '/dashboard',
                                active: b.active,
                              });
                            }}
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 cursor-pointer"
                            title="Tahrirlash"
                          >
                            <Icon name="ri-edit-line" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                            title="O‘chirish"
                          >
                            <Icon name="ri-delete-bin-line" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {b.title}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                          {b.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-white/5 text-xs">
                        <span className="text-slate-400 font-mono text-[11px]">{b.actionUrl}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleBannerActive(b)}
                          className="font-bold text-emerald-600 hover:underline cursor-pointer"
                        >
                          {b.active ? 'Nofaol qilish' : 'Faollashtirish'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: OMMAVIY XABARNOMA (BROADCAST)                           */}
          {/* ============================================================== */}
          {activeTab === 'broadcast' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                    <Icon name="ri-megaphone-line" className="text-lg" />
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Barcha Talabalarga Ommaviy Xabarnoma
                  </h3>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bildirishnoma Sarlavhasi *
                    </label>
                    <input
                      type="text"
                      required
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="Masalan: Fiziologiya fanidan yangi 500 ta klinik testlar qo‘shildi!"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Xabar Matni *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Masalan: Hurmatli talabalar, davlat imtihonlariga tayyorgarlik uchun yangi testlar to‘plami faollashtirildi. Xatolar banki va SRS orqali mashq qilishni unutmang!"
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Xabar Turi (Darajasi)
                    </label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="info">🔵 Oddiy Yangilik (Ma‘lumot)</option>
                      <option value="success">🟢 Yutuq / Mukofot (Muvaffaqiyat)</option>
                      <option value="warning">🟡 Muhim Ogohlantirish (Aksiya / Taqvim)</option>
                      <option value="alert">🔴 Shoshilinch Xabar</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Icon name="ri-send-plane-fill" className="text-base" />
                    <span>Barcha talabalarga yuborish</span>
                  </button>
                </form>
              </div>

              {/* Yuborilgan Tarix */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Yuborilgan Xabarnomalar ({broadcastHistory.length})</span>
                  <Icon name="ri-history-line" className="text-slate-400" />
                </h3>

                <div className="space-y-3 max-h-[460px] overflow-y-auto">
                  {broadcastHistory.length === 0 ? (
                    <p className="text-center py-12 text-slate-400 text-xs">Hali ommaviy xabarnomalar yuborilmagan</p>
                  ) : (
                    broadcastHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MODALLAR: BLOKLASH VA MEDCOINS BERISH                          */}
      {/* ============================================================== */}
      {showBlockModal && selectedUserForAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  selectedUserForAction.isBlocked ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'
                }`}
              >
                <Icon name={selectedUserForAction.isBlocked ? 'ri-lock-unlock-line' : 'ri-forbid-line'} className="text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {selectedUserForAction.isBlocked ? 'Akkauntni blokdan chiqarish' : 'Akkauntni bloklash'}
                </h3>
                <p className="text-xs text-slate-400">{selectedUserForAction.name} (@{selectedUserForAction.username})</p>
              </div>
            </div>

            {!selectedUserForAction.isBlocked && (
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300">Bloklash sababi:</label>
                <textarea
                  rows={3}
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-rose-500 resize-none"
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleToggleBlock}
                className={`flex-1 h-11 rounded-xl font-bold text-xs text-white transition-all cursor-pointer shadow-sm active:scale-95 ${
                  selectedUserForAction.isBlocked ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {selectedUserForAction.isBlocked ? 'Blokdan chiqarish' : 'Akkauntni bloklash'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBlockModal(false);
                  setSelectedUserForAction(null);
                }}
                className="px-5 h-11 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {showCoinsModal && selectedUserForAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
                <Icon name="ri-copper-coin-line" className="text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  MedCoins Taqdim Etish
                </h3>
                <p className="text-xs text-slate-400">{selectedUserForAction.name}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">MedCoins miqdori:</label>
              <input
                type="number"
                min={1}
                max={10000}
                value={coinsAmountInput}
                onChange={(e) => setCoinsAmountInput(Number(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-amber-500 font-black text-base"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[20, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCoinsAmountInput(amt)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 font-bold text-xs hover:bg-amber-500/25 cursor-pointer"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleGiveCoins}
                className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-xs text-slate-950 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                MedCoins berish
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCoinsModal(false);
                  setSelectedUserForAction(null);
                }}
                className="px-5 h-11 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
