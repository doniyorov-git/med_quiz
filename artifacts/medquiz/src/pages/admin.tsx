import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
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

type AdminTab = 'analytics' | 'users' | 'banners' | 'chat' | 'broadcast';

export function AdminPage() {
  const { me, theme, setTheme } = useStore();
  const [, setLocation] = useLocation();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isAdminAuthenticated());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

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

  // Chat State
  const [conversations, setConversations] = useState<
    { userId: string; userName: string; userAvatar?: string | null; lastMessage: string; lastTime: number; unreadCount: number }[]
  >([]);
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<AdminChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'success' | 'warning' | 'alert'>('info');
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastNotification[]>([]);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Toast / Status banner
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load Data when Authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    loadUsers();
    loadBanners();
    loadConversations();
    loadBroadcasts();
  }, [isAuthenticated]);

  const loadUsers = async () => {
    setUsersLoading(true);
    const data = await fetchAdminUsers();
    setUsers(data);
    setUsersLoading(false);
  };

  const loadBanners = async () => {
    const data = await fetchBanners();
    setBanners(data);
  };

  const loadConversations = async () => {
    const convs = await fetchAdminConversations();
    setConversations(convs);
    if (!selectedChatUserId && convs.length > 0) {
      setSelectedChatUserId(convs[0].userId);
    }
  };

  const loadBroadcasts = async () => {
    const data = await fetchNotifications();
    setBroadcastHistory(data);
  };

  // Chat Poll for active conversation
  useEffect(() => {
    if (!isAuthenticated || !selectedChatUserId) return;

    let isMounted = true;
    const fetchCurrentChat = async () => {
      const msgs = await fetchAdminChat(selectedChatUserId);
      if (isMounted) {
        setChatMessages(msgs);
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    fetchCurrentChat();
    const interval = window.setInterval(fetchCurrentChat, 4000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [isAuthenticated, selectedChatUserId]);

  // Handle PIN verification
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
      showToast(targetState ? 'Foydalanuvchi muvaffaqiyatli bloklandi' : 'Foydalanuvchi blokdan chiqarildi');
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
      showToast(`${selectedUserForAction.name} ga +${coinsAmountInput} MedCoins taqdim etildi!`);
    }
    setShowCoinsModal(false);
    setSelectedUserForAction(null);
  };

  // Banner Actions
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) {
      alert('Iltimos, banner sarlavhasini kiriting');
      return;
    }

    const bannerObj: AppBanner = {
      id: editingBannerId || `banner-${Date.now()}`,
      title: bannerForm.title.trim(),
      description: bannerForm.description.trim(),
      badge: bannerForm.badge?.trim() || undefined,
      theme: bannerForm.theme,
      icon: bannerForm.icon || 'ri-fire-fill',
      actionText: bannerForm.actionText?.trim() || 'Ko‘rish',
      actionUrl: bannerForm.actionUrl?.trim() || '/dashboard',
      active: bannerForm.active,
      createdAt: Date.now(),
    };

    const success = await saveBanner(bannerObj);
    if (success) {
      await loadBanners();
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
      showToast('Banner muvaffaqiyatli saqlandi va faollashtirildi!');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Ushbu bannerni o‘chirishni xohlaysizmi?')) return;
    await deleteBanner(id);
    await loadBanners();
    showToast('Banner o‘chirildi');
  };

  const handleToggleBannerActive = async (banner: AppBanner) => {
    const updated = { ...banner, active: !banner.active };
    await saveBanner(updated);
    await loadBanners();
    showToast(updated.active ? 'Banner faollashtirildi' : 'Banner nofaol qilindi');
  };

  // Chat Actions
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
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    setChatLoading(false);
  };

  // Broadcast Actions
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      alert('Sarlavha va xabar matnini to‘ldiring');
      return;
    }

    const success = await sendBroadcastNotification({
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      type: broadcastType,
    });

    if (success) {
      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      await loadBroadcasts();
      showToast('Ommaviy xabarnoma barcha talabalarga yuborildi!');
      setTimeout(() => setBroadcastSuccess(false), 3000);
    }
  };

  // Computed Users List & Stats
  const now = Date.now();
  const onlineThreshold = 5 * 60 * 1000; // 5 daqiqa

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

  // ----------------------------------------------------------------------
  // 1. PIN LOCK SCREEN: Agar admin autentifikatsiyadan o'tmagan bo'lsa
  // ----------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <Icon name="ri-admin-fill" className="text-2xl" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              MedQuiz Admin Panel
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ma‘muriyat boshqaruv markaziga kirish uchun xavfsizlik PIN kodini kiriting
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-3">
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
                placeholder="PIN kodni kiriting (Masalan: 7777)"
                className="w-full h-11 text-center tracking-widest text-base font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-rose-500 font-semibold mt-1.5 animate-shake">
                  Kiritilgan PIN kod noto‘g‘ri!
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <Icon name="ri-lock-unlock-line" className="text-base" />
              <span>Admin Panelga kirish</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            Standart PIN kod: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">7777</span>
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 2. MAIN ADMIN DASHBOARD
  // ----------------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 text-xs sm:text-sm font-bold animate-in slide-in-from-top-4 duration-200">
          <Icon name="ri-checkbox-circle-fill" className="text-lg" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ADMIN HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
            <Icon name="ri-shield-user-fill" className="text-2xl" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                MedQuiz Boshqaruv Markazi
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Foydalanuvchilar, sarflangan vaqt, bannerlar, bloklash va chat boshqaruvi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Mavzuni almashtirish"
          >
            <Icon name={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'} className="text-base" />
          </button>

          <button
            type="button"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Icon name="ri-arrow-go-back-line" className="text-base" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={handleLogoutAdmin}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
            title="Admin rejimini yopish"
          >
            <Icon name="ri-lock-line" className="text-base" />
            <span>Chiqish</span>
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide p-1.5 rounded-xl bg-slate-200/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-white dark:bg-[#111827] text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Icon name="ri-pie-chart-2-line" className="text-base" />
          <span>Analitika & Vaqt</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-white dark:bg-[#111827] text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Icon name="ri-user-settings-line" className="text-base" />
          <span>Foydalanuvchilar ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'banners'
              ? 'bg-white dark:bg-[#111827] text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Icon name="ri-layout-masonry-line" className="text-base" />
          <span>Banner Konstruktor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-[#111827] text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Icon name="ri-chat-3-line" className="text-base" />
          <span>Chat va Yozishmalar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'broadcast'
              ? 'bg-white dark:bg-[#111827] text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Icon name="ri-broadcast-line" className="text-base" />
          <span>Ommaviy Xabarnoma</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: ANALITIKA VA STATISTIKA */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top 6 Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Jami Talabalar</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Icon name="ri-team-line" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stats.totalUsers}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">+100% faol baza</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Hozir Onlayn</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-600">{stats.onlineUsers}</p>
              <p className="text-[10px] text-slate-400">Oxirgi 5 daqiqada</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2 col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Jami Sarflangan Vaqt</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                  <Icon name="ri-time-line" />
                </span>
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {formatDurationShortUz(stats.totalSecondsSpent)}
              </p>
              <p className="text-[10px] text-indigo-500 font-semibold">1 soniya = +1 sanog‘i</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Bloklanganlar</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                  <Icon name="ri-forbid-line" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-rose-500">{stats.blockedUsers}</p>
              <p className="text-[10px] text-slate-400">Cheklangan hisoblar</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">MedCoins Baza</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Icon name="ri-coin-line" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-500">{stats.totalCoins}</p>
              <p className="text-[10px] text-slate-400">Do‘kon va mukofotlar</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Battle G‘alabalari</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                  <Icon name="ri-sword-line" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-purple-500">{stats.totalBattles}</p>
              <p className="text-[10px] text-slate-400">Jonli bellashuvlar</p>
            </div>
          </div>

          {/* Time Tracking Explanation & Top Students */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Mexanizm haqida tushuntirish */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                  <Icon name="ri-cpu-line" className="text-lg" />
                </span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Vaqtni hisoblash mexanizmi (.txt log tizimi)
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Talaba platformada o‘qiyotgan har bir soniyada brauzerda <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono text-emerald-600">+1 soniya</code> hisoblanadi. Har 60 soniyaga (1 daqiqa) yetganda:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pl-4 list-disc">
                <li>Serverda <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono text-[11px]">.user-time-logs/&lt;userId&gt;.txt</code> fayliga qayd qilinadi.</li>
                <li>Asosiy ma‘lumotlar bazasida talabaning <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono text-[11px]">totalTimeSpent</code> ustuni yangilanadi.</li>
                <li>Admin panelda bu ko‘rsatkich avtomatik <span className="font-bold text-slate-900 dark:text-white">«X kun, Y soat, Z daqiqa»</span> formatida aks etadi.</li>
              </ul>
            </div>

            {/* Eng ko'p vaqt o'tkazgan talabalar */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between">
                <span>Eng faol talabalar (Ilovada sarflangan vaqt)</span>
                <Icon name="ri-trophy-line" className="text-amber-500 text-lg" />
              </h3>

              <div className="space-y-2">
                {[...users]
                  .sort((a, b) => (b.totalTimeSpent || 0) - (a.totalTimeSpent || 0))
                  .slice(0, 4)
                  .map((u, idx) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-black text-xs">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs shrink-0">
                        {formatDurationUz(u.totalTimeSpent || 0)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: FOYDALANUVCHILAR BOSHQARUVI */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Qidiruv va Filtr paneli */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="relative flex-1">
              <Icon name="ri-search-line" className="absolute left-3.5 top-3 text-slate-400 text-base" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Ism, username, telefon yoki institut bo‘yicha qidirish..."
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

          {/* Foydalanuvchilar jadvali */}
          <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Talaba</th>
                    <th className="py-3 px-4">Aloqa / Telefon</th>
                    <th className="py-3 px-4">Ilovada ishlagan vaqti</th>
                    <th className="py-3 px-4">MedCoins / XP</th>
                    <th className="py-3 px-4">Holati</th>
                    <th className="py-3 px-4 text-right">Boshqaruv</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Foydalanuvchi topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isOnline = now - (u.seen || 0) < onlineThreshold;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                          {/* Talaba info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                {u.avatar ? (
                                  <img src={u.avatar} alt="" className="h-9 w-9 rounded-[12px] object-cover" />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs">
                                    {(u.name || 'M').slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                {isOnline && (
                                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111827]" />
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
                          <td className="py-3 px-4">
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {u.phone || 'Biriktirilmagan'}
                            </span>
                          </td>

                          {/* Ilovada ishlagan vaqti */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <Icon name="ri-time-line" className="text-emerald-500 text-sm" />
                              <span className="font-bold text-slate-900 dark:text-white">
                                {formatDurationUz(u.totalTimeSpent || 0)}
                              </span>
                            </div>
                          </td>

                          {/* MedCoins & XP */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                                <Icon name="ri-coin-fill" />
                                <span>{u.coins || 0} MedCoins</span>
                              </span>
                              <p className="text-[10px] text-slate-400">{u.xp || 0} XP</p>
                            </div>
                          </td>

                          {/* Holati (Status) */}
                          <td className="py-3 px-4">
                            {u.isBlocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 border border-rose-500/20">
                                <Icon name="ri-forbid-line" />
                                <span>Bloklangan</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                                <Icon name="ri-checkbox-circle-line" />
                                <span>Faol</span>
                              </span>
                            )}
                          </td>

                          {/* Amallar */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Chat ochish */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChatUserId(u.id);
                                  setActiveTab('chat');
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                title="Foydalanuvchiga xabar yozish"
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
                                className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-colors cursor-pointer"
                                title="MedCoins taqdim etish"
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
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
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

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: BANNER KONSTRUKTOR */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Konstruktor Formasi */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                  <Icon name="ri-paint-brush-line" className="text-lg" />
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingBannerId ? 'Bannerni tahrirlash' : 'Yangi Banner Konstruktori'}
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
                    placeholder="Masalan: Yozgi Anatomiya Marofoni!"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500"
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
                    placeholder="Masalan: Barcha talabalar o‘rtasida test musobaqasi va qimmatbaho mukofotlar..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500 resize-none"
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
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Rang mavzusi (Theme)
                    </label>
                    <select
                      value={bannerForm.theme}
                      onChange={(e) => setBannerForm({ ...bannerForm, theme: e.target.value as AppBannerTheme })}
                      className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500"
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
                      Tugma matni (Action)
                    </label>
                    <input
                      type="text"
                      value={bannerForm.actionText}
                      onChange={(e) => setBannerForm({ ...bannerForm, actionText: e.target.value })}
                      placeholder="Masalan: Kirish"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Havola / Sahifa (URL)
                    </label>
                    <input
                      type="text"
                      value={bannerForm.actionUrl}
                      onChange={(e) => setBannerForm({ ...bannerForm, actionUrl: e.target.value })}
                      placeholder="Masalan: /battle yoki /banks"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="bannerActiveCheckbox"
                    checked={bannerForm.active}
                    onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="bannerActiveCheckbox" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Bannerni darhol platformada faollashtirish
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

            {/* 2. Jonli Prevyu Kartasi */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="ri-eye-line" className="text-emerald-500" />
                <span>Jonli Prevyu (Talabalar ekranida qanday ko‘rinadi):</span>
              </h3>

              <div
                className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg transition-all ${
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
                  <div className="space-y-1.5 min-w-0">
                    {bannerForm.badge && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs text-white">
                        {bannerForm.badge}
                      </span>
                    )}
                    <h4 className="text-lg sm:text-xl font-bold leading-snug">
                      {bannerForm.title || 'Banner Sarlavhasi'}
                    </h4>
                    <p className="text-xs text-white/90 leading-relaxed max-w-md">
                      {bannerForm.description || 'Bu yerda banner haqida qisqa va qiziqarli tavsif matni joylashadi.'}
                    </p>
                  </div>

                  <span className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md shadow-black/10">
                    <span>{bannerForm.actionText || 'Kirish'}</span>
                    <Icon name="ri-arrow-right-line" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mavjud Bannerlar Ro'yxati */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between">
              <span>Faol va Qoralama Bannerlar ({banners.length})</span>
              <Icon name="ri-archive-line" className="text-slate-400" />
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
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
                            icon: b.icon || 'ri-fire-fill',
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
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                      {b.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {b.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-white/5 text-[11px]">
                    <span className="text-slate-400 font-mono">{b.actionUrl}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleBannerActive(b)}
                      className="font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      {b.active ? 'O‘chirish' : 'Yoqish'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 4: CHAT VA YOZISHMALAR */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 md:grid-cols-3 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden min-h-[580px]">
          {/* Chap: Suhbatlar ro'yxati */}
          <div className="border-r border-slate-200/80 dark:border-white/10 flex flex-col">
            <div className="p-3.5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Talabalar xabarlari
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
              {users.map((u) => {
                const isSelected = selectedChatUserId === u.id;
                const isOnline = now - (u.seen || 0) < onlineThreshold;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedChatUserId(u.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="h-9 w-9 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs">
                          {(u.name || 'M').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      {isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111827]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{u.name}</p>
                        <span className="text-[10px] text-slate-400">{formatDurationShortUz(u.totalTimeSpent)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* O'ng: Jonli xabarlashuv maydoni */}
          <div className="col-span-2 flex flex-col h-[580px]">
            {selectedChatUserId ? (
              <>
                {/* Chat Top Bar */}
                <div className="p-3.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-50/40 dark:bg-white/5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {users.find((u) => u.id === selectedChatUserId)?.name || 'Talaba'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        @{users.find((u) => u.id === selectedChatUserId)?.username} · Sarflangan vaqt:{' '}
                        {formatDurationUz(users.find((u) => u.id === selectedChatUserId)?.totalTimeSpent)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const target = users.find((u) => u.id === selectedChatUserId);
                      if (target) {
                        setSelectedUserForAction(target);
                        setShowBlockModal(true);
                      }
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-bold border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors cursor-pointer"
                  >
                    Bloklash
                  </button>
                </div>

                {/* Xabarlar ro'yxati */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                      <Icon name="ri-chat-smile-2-line" className="text-4xl text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        Ushbu talaba bilan suhbat hali boshlanmagan
                      </p>
                      <p className="text-slate-400 text-[11px] mt-1 max-w-xs">
                        Quyidagi tezkor javob tugmalaridan birini tanlang yoki savol yozing.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((m) => {
                      const isAdminMsg = m.sender === 'admin';
                      return (
                        <div key={m.id} className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed space-y-1 shadow-xs ${
                              isAdminMsg
                                ? 'bg-emerald-600 text-white rounded-tr-xs'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white rounded-tl-xs'
                            }`}
                          >
                            <span className="block text-[10px] font-bold opacity-75">
                              {isAdminMsg ? 'Admin' : m.userName || 'Talaba'}
                            </span>
                            <p className="whitespace-pre-wrap">{m.text}</p>
                            <span className="block text-[9px] opacity-60 text-right">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Tezkor javob shablonlari */}
                <div className="px-3 py-2 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-hide bg-slate-50/40 dark:bg-white/5">
                  {[
                    '✅ Faylingiz tekshirildi va bazaga qo‘shildi.',
                    '🔓 Akkauntingiz tekshirildi va blokdan chiqarildi.',
                    '🎁 Faolligingiz uchun +50 MedCoins taqdim etildi!',
                    '🩺 Qaysi fan testlarida xatolik topdingiz?',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendAdminMessage(undefined, preset)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-300 font-medium hover:border-emerald-500 whitespace-nowrap cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Xabar yuborish inputi */}
                <form
                  onSubmit={(e) => handleSendAdminMessage(e)}
                  className="p-3 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2 bg-white dark:bg-[#111827]"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Talabaga javob yozing..."
                    className="flex-1 h-10 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs sm:text-sm outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Yuborish
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Chap tarafdan talabani tanlang
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 5: OMMAVIY XABARNOMA (BROADCAST) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <Icon name="ri-megaphone-line" className="text-lg" />
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Barcha talabalarga ommaviy xabarnoma yuborish
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
                  placeholder="Masalan: Tizimda yangi Fiziologiya testlari qo‘shildi!"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500"
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
                  placeholder="Masalan: Barcha talabalar uchun yangi 500 ta klinik testlar to‘plami faollashtirildi. Imtihongacha bilimlaringizni sinab ko‘ring!"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Xabar Turi (Muhimlik darajasi)
                </label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-emerald-500"
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

          {/* Tarix */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between">
              <span>Yuborilgan xabarnomalar tarixi</span>
              <Icon name="ri-history-line" className="text-slate-400" />
            </h3>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto">
              {broadcastHistory.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-xs">Hali ommaviy xabarnomalar yuborilmagan</p>
              ) : (
                broadcastHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white">{item.title}</h4>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 1: BLOKLASH MODALI */}
      {/* ------------------------------------------------------------------ */}
      {showBlockModal && selectedUserForAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  selectedUserForAction.isBlocked ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                }`}
              >
                <Icon name={selectedUserForAction.isBlocked ? 'ri-lock-unlock-line' : 'ri-forbid-line'} className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {selectedUserForAction.isBlocked ? 'Akkauntni blokdan chiqarish' : 'Akkauntni bloklash'}
                </h3>
                <p className="text-xs text-slate-500">{selectedUserForAction.name} (@{selectedUserForAction.username})</p>
              </div>
            </div>

            {!selectedUserForAction.isBlocked && (
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300">Bloklash sababi:</label>
                <textarea
                  rows={2}
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-rose-500 resize-none"
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleToggleBlock}
                className={`flex-1 h-10 rounded-xl font-bold text-xs text-white transition-all cursor-pointer shadow-sm active:scale-95 ${
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
                className="px-4 h-10 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 2: MEDCOINS BERISH MODALI */}
      {/* ------------------------------------------------------------------ */}
      {showCoinsModal && selectedUserForAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Icon name="ri-copper-coin-line" className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  MedCoins taqdim etish
                </h3>
                <p className="text-xs text-slate-500">{selectedUserForAction.name}</p>
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
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:border-amber-500 font-bold"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[20, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCoinsAmountInput(amt)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 font-bold text-xs hover:bg-amber-500/25 cursor-pointer"
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
                className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-xs text-slate-950 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                MedCoins berish
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCoinsModal(false);
                  setSelectedUserForAction(null);
                }}
                className="px-4 h-10 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
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
