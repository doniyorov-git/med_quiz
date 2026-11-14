import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Icon } from '@/components/chrome';
import {
  acceptFriendRequest,
  declineFriendRequest,
  fetchFriendships,
  fetchPublicUsers,
  getFriendStatus,
  getFriendships,
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

  // Sync users and friendships from server periodically
  useEffect(() => {
    async function sync() {
      const freshUsers = await fetchPublicUsers();
      if (freshUsers.length) setUsers(freshUsers);
      const freshFr = await fetchFriendships();
      if (freshFr.length) setFriendships(freshFr);
    }
    sync();
    const interval = window.setInterval(sync, 3000);
    return () => window.clearInterval(interval);
  }, []);

  if (!me) return null;

  // Filter users based on query and tab
  const filteredUsers = users.filter((u) => {
    const isMe = u.id === me.id;
    if (isMe) return false;

    // Search query matching by @username or name
    const q = query.trim().toLowerCase().replace(/^@/, '');
    if (q) {
      const matchName = u.name.toLowerCase().includes(q);
      const matchUsername = (u.username || '').toLowerCase().includes(q);
      if (!matchName && !matchUsername) return false;
    }

    const status = getFriendStatus(me.id, u.id, friendships);
    const isOnline = u.seen ? Date.now() - u.seen < 1000 * 90 : false;

    if (tab === 'online') return isOnline;
    if (tab === 'friends') return status === 'friends';
    if (tab === 'pending') return status === 'pending_received' || status === 'pending_sent';
    return true;
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
    <div className="rounded-[16px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
      {/* Top Search & Filter Toolbar in a single unified header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02] space-y-3">
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
            className="w-full h-10 rounded-[10px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1422] pl-10 pr-9 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
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

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tab === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            <span>Barchasi</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>
              {users.filter((u) => u.id !== me.id).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('online')}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tab === 'online'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Onlayn</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab === 'online' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>
              {onlineUsersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('friends')}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tab === 'friends'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            <Icon name="ri-user-heart-line" className="text-sm" />
            <span>Do‘stlar</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab === 'friends' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>
              {myFriendsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tab === 'pending'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            <Icon name="ri-notification-3-line" className="text-sm" />
            <span>So‘rovlar</span>
            {pendingReceivedCount > 0 ? (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {pendingReceivedCount}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] font-bold text-slate-500">
                0
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Users List: Single Flat List with Dividers (NO div inside div) */}
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {!filteredUsers.length && (
          <div className="p-10 text-center text-slate-400">
            <Icon name="ri-user-search-line" className="text-3xl mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Foydalanuvchi topilmadi</p>
            <p className="text-xs text-slate-500 mt-0.5">Qidiruv so‘zini o‘zgartiring yoki boshqa toifani tanlang.</p>
          </div>
        )}

        {filteredUsers.map((u) => {
          const status = getFriendStatus(me.id, u.id, friendships);
          const isOnline = u.seen ? Date.now() - u.seen < 1000 * 90 : false;

          return (
            <div
              key={u.id}
              className="flex items-center justify-between px-4 sm:px-6 py-3.5 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
            >
              {/* Left: Avatar + Name + Username */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200/80 dark:border-white/10 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                    ) : (
                      u.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111827]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {u.name}
                    </p>
                    <span className="text-xs font-mono text-slate-400 truncate">
                      @{u.username}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {u.quizzes ? `${u.quizzes} ta test` : 'Yangi foydalanuvchi'} · {(u.xp ?? 0).toLocaleString()} XP
                  </p>
                </div>
              </div>

              {/* Right: Direct Action Buttons (Flat, No Dropdown, Clean) */}
              <div className="shrink-0 flex items-center gap-2 ml-3">
                {status === 'none' && (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                    onClick={() => {
                      sendFriendRequest(me, u.id);
                      setFriendships(getFriendships());
                    }}
                  >
                    <Icon name="ri-user-add-line" className="text-sm" />
                    <span>Do‘stlik</span>
                  </button>
                )}

                {status === 'pending_sent' && (
                  <span className="flex items-center gap-1 h-8 px-3 rounded-[8px] bg-slate-100 dark:bg-white/5 text-slate-500 text-xs font-semibold">
                    <Icon name="ri-time-line" />
                    <span>Yuborilgan</span>
                  </span>
                )}

                {status === 'pending_received' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="flex items-center gap-1 h-8 px-3 rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                      onClick={() => {
                        acceptFriendRequest(u.id, me.id);
                        setFriendships(getFriendships());
                      }}
                    >
                      <Icon name="ri-check-line" />
                      <span>Qabul</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center h-8 w-8 rounded-[8px] bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-white/5 text-slate-500 text-xs font-bold cursor-pointer"
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
                      className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                      onClick={() => {
                        if (onSelectUserForBattle) onSelectUserForBattle(u);
                        else setLocation(`/battle`);
                      }}
                    >
                      <Icon name="ri-sword-line" />
                      <span>Battle</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center h-8 w-8 rounded-[8px] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 text-slate-400 text-xs cursor-pointer transition-colors"
                      onClick={() => {
                        removeFriend(me.id, u.id);
                        setFriendships(getFriendships());
                      }}
                      title="Do‘stlikdan chiqarish"
                    >
                      <Icon name="ri-user-unfollow-line" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
