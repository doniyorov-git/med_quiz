import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Btn, Icon } from '@/components/chrome';
import {
  acceptFriendRequest,
  declineFriendRequest,
  fetchFriendships,
  fetchPublicUsers,
  getFriendStatus,
  getFriendships,
  getMedicalTitle,
  getPublicUsers,
  removeFriend,
  sendFriendRequest,
} from '@/lib/model';
import type { Me, PublicUser } from '@/lib/types';

interface FriendsViewProps {
  me: Me | null;
  onSelectUserForBattle?: (user: PublicUser) => void;
}

type TabMode = 'all' | 'online' | 'friends' | 'pending';

export function FriendsView({ me, onSelectUserForBattle }: FriendsViewProps) {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<PublicUser[]>(() => getPublicUsers());
  const [friendships, setFriendships] = useState(() => getFriendships());
  const [tab, setTab] = useState<TabMode>('all');
  const [query, setQuery] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Sync users and friendships from server periodically
  useEffect(() => {
    async function sync() {
      const freshUsers = await fetchPublicUsers();
      if (freshUsers.length) setUsers(freshUsers);
      const freshFr = await fetchFriendships();
      if (freshFr.length) setFriendships(freshFr);
    }
    sync();
    const interval = window.setInterval(sync, 2500);
    return () => window.clearInterval(interval);
  }, []);

  if (!me) return null;

  // Filter users based on query and tab
  const filteredUsers = users.filter((u) => {
    // Exclude myself if looking at friends/requests, but show in all/search if query matches
    const isMe = u.id === me.id;

    // Search query matching by @username or name
    const q = query.trim().toLowerCase().replace(/^@/, '');
    if (q) {
      const matchName = u.name.toLowerCase().includes(q);
      const matchUsername = (u.username || '').toLowerCase().includes(q);
      if (!matchName && !matchUsername) return false;
    }

    const status = getFriendStatus(me.id, u.id, friendships);
    const isOnline = u.seen ? Date.now() - u.seen < 1000 * 90 : false;

    if (tab === 'online') {
      return isOnline && !isMe;
    }
    if (tab === 'friends') {
      return status === 'friends';
    }
    if (tab === 'pending') {
      return status === 'pending_received' || status === 'pending_sent';
    }
    return !isMe;
  });

  const pendingReceivedCount = friendships.filter(
    (f) => f.toId === me.id && f.status === 'pending'
  ).length;

  const onlineUsersCount = users.filter(
    (u) => u.id !== me.id && u.seen && Date.now() - u.seen < 1000 * 90
  ).length;

  const myFriendsCount = users.filter(
    (u) => u.id !== me.id && getFriendStatus(me.id, u.id, friendships) === 'friends'
  ).length;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Icon
          name="ri-search-line"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="@username yoki ism bo‘yicha qidirish..."
          className="w-full rounded-[10px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
          >
            <Icon name="ri-close-line" />
          </button>
        )}
      </div>

      {/* Filter Segmented Control (Mobile-friendly Grid, No Overflow) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-[10px] bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`flex items-center justify-center gap-1.5 h-9 px-2 rounded-[8px] text-xs font-bold transition-all ${
            tab === 'all'
              ? 'bg-white dark:bg-[#1f2937] text-primary shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Icon name="ri-team-line" className="text-sm" />
          <span>Barchasi</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-white/10 text-[10px] font-bold">
            {users.filter((u) => u.id !== me.id).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('online')}
          className={`flex items-center justify-center gap-1.5 h-9 px-2 rounded-[8px] text-xs font-bold transition-all ${
            tab === 'online'
              ? 'bg-white dark:bg-[#1f2937] text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          <span>Onlayn</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
            {onlineUsersCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('friends')}
          className={`flex items-center justify-center gap-1.5 h-9 px-2 rounded-[8px] text-xs font-bold transition-all ${
            tab === 'friends'
              ? 'bg-white dark:bg-[#1f2937] text-primary shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Icon name="ri-user-heart-line" className="text-sm" />
          <span>Do‘stlar</span>
          <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
            {myFriendsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`relative flex items-center justify-center gap-1.5 h-9 px-2 rounded-[8px] text-xs font-bold transition-all ${
            tab === 'pending'
              ? 'bg-white dark:bg-[#1f2937] text-primary shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Icon name="ri-notification-3-line" className="text-sm" />
          <span>So‘rovlar</span>
          {pendingReceivedCount > 0 ? (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {pendingReceivedCount}
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-white/10 text-[10px] font-bold">
              0
            </span>
          )}
        </button>
      </div>

      {/* Users List */}
      <div className="space-y-2.5">
        {!filteredUsers.length && (
          <div className="rounded-[10px] border border-dashed border-slate-300 dark:border-white/15 p-8 text-center bg-slate-50/50 dark:bg-white/[0.02]">
            <Icon name="ri-user-search-line" className="text-3xl text-slate-400 mx-auto" />
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Hech qanday foydalanuvchi topilmadi
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Qidiruv so‘zini o‘zgartiring yoki boshqa tabni tanlang.
            </p>
          </div>
        )}

        {filteredUsers.map((u) => {
          const status = getFriendStatus(me.id, u.id, friendships);
          const title = getMedicalTitle(u.xp);
          const isOnline = u.seen ? Date.now() - u.seen < 1000 * 90 : false;
          const isExpanded = expandedUserId === u.id;

          return (
            <div
              key={u.id}
              className={`rounded-[10px] border transition-all ${
                isExpanded
                  ? 'border-primary/50 bg-white dark:bg-[#111827] shadow-sm ring-1 ring-primary/20'
                  : 'border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0e1422] hover:border-primary/40 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5 p-3">
                {/* Left: Avatar with Medical Gradient Background & Info */}
                <div
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                  onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                  title="Ma‘lumotlarni ko‘rish"
                >
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-[10px] overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 shadow-xs">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        u.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-[4px] border-2 border-white dark:border-[#0e1422] bg-green-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px]">
                        {u.name}
                      </span>
                      <span className="text-[11px] font-mono text-primary font-semibold truncate">
                        @{u.username}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-[10px] font-semibold border ${title.color}`}>
                        <Icon name={title.icon} className="text-[10px]" />
                        <span className="truncate max-w-[90px]">{title.badge}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {(u.xp ?? 0).toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Mobile Touch-Friendly Actions */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {status === 'none' && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-[8px] bg-primary text-white hover:bg-primary/90 text-xs font-semibold shadow-xs active:scale-95 transition-all"
                      onClick={() => {
                        sendFriendRequest(me, u.id);
                        setFriendships(getFriendships());
                      }}
                      title="Do‘stlik taklif qilish"
                    >
                      <Icon name="ri-user-add-line" />
                      <span className="hidden sm:inline">Do‘stlik</span>
                    </button>
                  )}

                  {status === 'pending_sent' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[11px] border border-amber-500/20">
                      <Icon name="ri-time-line" />
                      <span>Kutilmoqda</span>
                    </span>
                  )}

                  {status === 'pending_received' && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                        onClick={() => {
                          acceptFriendRequest(u.id, me.id);
                          setFriendships(getFriendships());
                        }}
                        title="Qabul qilish"
                      >
                        <Icon name="ri-check-line" />
                        <span className="hidden sm:inline">Qabul</span>
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center p-1.5 rounded-[8px] border border-slate-200 dark:border-white/10 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold active:scale-95 transition-all"
                        onClick={() => {
                          declineFriendRequest(u.id, me.id);
                          setFriendships(getFriendships());
                        }}
                        title="Rad etish"
                      >
                        <Icon name="ri-close-line" />
                      </button>
                    </div>
                  )}

                  {status === 'friends' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-[8px] bg-primary text-white hover:bg-primary/90 text-xs font-bold shadow-xs active:scale-95 transition-all"
                        onClick={() => {
                          if (onSelectUserForBattle) onSelectUserForBattle(u);
                          else setLocation(`/battle`);
                        }}
                        title="Battlega chorlash"
                      >
                        <Icon name="ri-sword-line" />
                        <span>Battle</span>
                      </button>
                    </div>
                  )}

                  {/* Toggle expand button */}
                  <button
                    type="button"
                    onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                    className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    aria-label="Tafsilotlar"
                  >
                    <Icon name={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} className="text-base" />
                  </button>
                </div>
              </div>

              {/* Expanded details panel: Streak & Results Card */}
              {isExpanded && (
                <div className="border-t border-slate-200/80 dark:border-white/5 p-3.5 bg-slate-50/70 dark:bg-white/[0.02] text-xs space-y-3 animate-in fade-in duration-150">
                  {/* Streak & Performance Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Streak */}
                    <div className="p-2.5 rounded-[10px] border border-amber-500/25 bg-amber-500/10 text-center shadow-xs">
                      <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                        <Icon name="ri-fire-fill" className="text-sm" />
                        <span>Streak</span>
                      </div>
                      <p className="mt-1 text-base sm:text-lg font-extrabold text-amber-700 dark:text-amber-300">
                        {u.streak} kun
                      </p>
                    </div>

                    {/* Testlar */}
                    <div className="p-2.5 rounded-[10px] border border-emerald-500/25 bg-emerald-500/10 text-center shadow-xs">
                      <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <Icon name="ri-file-list-3-line" className="text-sm" />
                        <span>Testlar</span>
                      </div>
                      <p className="mt-1 text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                        {u.quizzes} ta
                      </p>
                    </div>

                    {/* Battle g'alabalari */}
                    <div className="p-2.5 rounded-[10px] border border-sky-500/25 bg-sky-500/10 text-center shadow-xs">
                      <div className="flex items-center justify-center gap-1 text-sky-600 dark:text-sky-400 font-bold text-xs">
                        <Icon name="ri-trophy-line" className="text-sm" />
                        <span>G‘alabalar</span>
                      </div>
                      <p className="mt-1 text-base sm:text-lg font-extrabold text-sky-700 dark:text-sky-300">
                        {u.battleWins} ta
                      </p>
                    </div>

                    {/* Ball (XP) */}
                    <div className="p-2.5 rounded-[10px] border border-indigo-500/25 bg-indigo-500/10 text-center shadow-xs">
                      <div className="flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        <Icon name="ri-flashlight-fill" className="text-sm text-indigo-500" />
                        <span>Ball (XP)</span>
                      </div>
                      <p className="mt-1 text-base sm:text-lg font-extrabold text-indigo-700 dark:text-indigo-300">
                        {(u.xp ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Footer status & Actions */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-[6px] font-bold border text-[11px] ${title.color}`}>
                        {title.title}
                      </span>
                      {isOnline ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Hozir onlayn
                        </span>
                      ) : (
                        <span className="text-slate-400">Oflayn</span>
                      )}
                    </div>

                    {status === 'friends' && (
                      <button
                        type="button"
                        onClick={() => {
                          removeFriend(me.id, u.id);
                          setFriendships(getFriendships());
                        }}
                        className="text-rose-500 hover:text-rose-600 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Icon name="ri-user-unfollow-line" /> Do‘stlikdan chiqarish
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
