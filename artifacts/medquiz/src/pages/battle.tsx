import { useEffect, useState } from 'react';
import { HiOutlineX } from 'react-icons/hi';
import { Link, useLocation, useParams } from 'wouter';
import { BattleChat } from '@/components/battle-chat';
import { BattleReactions } from '@/components/battle-reactions';
import { BattleVoiceChat } from '@/components/battle-voice-chat';
import { Btn, Icon, Panel, fieldClass } from '@/components/chrome';
import { Choices, Ring } from '@/components/choices';
import { Dropdown } from '@/components/dropdown';
import {
  answerRoom,
  beginLive,
  claimBattle,
  createRoom,
  fetchFriendships,
  fetchPublicUsers,
  fetchRoomFromServer,
  forceNext,
  getFriendships,
  getFriendsList,
  getMedicalTitle,
  getPublicUsers,
  joinRoom,
  leaveRoom,
  playerScore,
  putRoom,
  recordMistake,
  roomLink,
  sendInvite,
  setPlayerReady,
  tryAdvance,
} from '@/lib/model';
import { cleanQuestion, isCorrectPick } from '@/lib/parser';
import { useBanks, useInvites, useOnline, useRooms, useStatsMap, useStore } from '@/lib/store';
import type { FriendRequest, OrderMode, PublicUser, Room } from '@/lib/types';

function formatLastSeen(seen?: number) {
  if (!seen) return 'Oflayn · Faol emas';
  const diff = Date.now() - seen;
  if (diff < 60_000) return 'Hozir onlayn';
  if (diff < 3600_000) return `Oflayn · ${Math.floor(diff / 60_000)} daqiqa oldin`;
  if (diff < 86400_000) return `Oflayn · ${Math.floor(diff / 3600_000)} soat oldin`;
  const days = Math.floor(diff / 86400_000);
  return `Oflayn · ${days} kun oldin`;
}

export function BattleLobby() {
  const { me } = useStore();
  const [, setLocation] = useLocation();
  const banks = useBanks();
  const rooms = useRooms();
  const online = useOnline();
  const invites = useInvites();
  const [bankId, setBankId] = useState('');
  const [count, setCount] = useState(10);
  const [order, setOrder] = useState<OrderMode>('mixed');
  const [seconds, setSeconds] = useState(30);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [sheet, setSheet] = useState<'create' | 'join' | null>(null);
  const [risen, setRisen] = useState(false);
  const [copied, setCopied] = useState('');

  const selectedBank = banks.find((item) => item.id === bankId);
  const readyCount = (selectedBank?.questions ?? []).filter((question) => cleanQuestion(question)).length;
  const countMax = selectedBank ? Math.max(readyCount, 1) : 30;

  const [publicUsers, setPublicUsers] = useState<PublicUser[]>(() => getPublicUsers());
  const [friendships, setFriendships] = useState<FriendRequest[]>(() => getFriendships());
  const [friendFilter, setFriendFilter] = useState<'all' | 'online' | 'offline'>('all');

  useEffect(() => {
    async function sync() {
      const freshUsers = await fetchPublicUsers();
      if (freshUsers.length) setPublicUsers(freshUsers);
      const freshFr = await fetchFriendships();
      if (freshFr.length) setFriendships(freshFr);
    }
    sync();
    const interval = window.setInterval(sync, 2500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!bankId && banks.length > 0) {
      setBankId(banks[0].id);
    }
  }, [bankId, banks.length]);

  const isUserOnline = (userId: string, seen?: number) => {
    if (online.some((u) => u.id === userId)) return true;
    if (seen && Date.now() - seen < 60000) return true;
    return false;
  };

  const mine = rooms.filter((room) => room && room.status !== 'done' && (room.players ?? []).some((player) => player?.id === me?.id));
  const active = mine[0];

  const friends = me ? getFriendsList(me.id, publicUsers, friendships) : [];
  friends.sort((a, b) => {
    const aOn = isUserOnline(a.id, a.seen) ? 1 : 0;
    const bOn = isUserOnline(b.id, b.seen) ? 1 : 0;
    if (aOn !== bOn) return bOn - aOn;
    return (b.seen || 0) - (a.seen || 0);
  });

  const onlineFriends = friends.filter((f) => isUserOnline(f.id, f.seen));
  const offlineFriends = friends.filter((f) => !isUserOnline(f.id, f.seen));
  type DisplayUser = {
    id: string;
    name: string;
    avatar?: string | null;
    seen?: number;
    xp?: number;
    university?: string;
  };

  let displayedList: DisplayUser[] = [];
  if (friendFilter === 'all') {
    displayedList = friends;
  } else if (friendFilter === 'online') {
    displayedList = onlineFriends;
  } else if (friendFilter === 'offline') {
    displayedList = offlineFriends;
  }

  useEffect(() => {
    if (!sheet) {
      setRisen(false);
      return;
    }
    const frame = requestAnimationFrame(() => setRisen(true));
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSheet(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheet]);

  const share = async (room: Room) => {
    const url = roomLink(room.code);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'MedQuiz battle', text: `${room.bankName} xonasi`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(room.code);
    } catch {
      setCopied(room.code);
    }
  };

  const handleJoinWithCode = async () => {
    if (!me) return;
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Xona kodini kiriting.');
      return;
    }

    setIsJoining(true);
    setJoinError('');

    try {
      // 1. Try local room first
      let result = joinRoom(me, cleanCode);

      // 2. If not found locally, fetch from server!
      if (result.error && !result.room) {
        const serverRoom = await fetchRoomFromServer(cleanCode);
        if (serverRoom) {
          putRoom(serverRoom);
          result = joinRoom(me, cleanCode);
        }
      }

      if (result.error && !result.room) {
        setJoinError(result.error);
        return;
      }

      setJoinError('');
      setSheet(null);
      setLocation(`/battle/${cleanCode}`);
    } catch {
      setJoinError('Xonaga ulanishda xatolik yuz berdi.');
    } finally {
      setIsJoining(false);
    }
  };

  const bankOptions = banks.map((b) => ({
    value: b.id,
    label: `${b.name} (${(b.questions ?? []).filter((q) => cleanQuestion(q)).length} ta savol)`,
  }));

  const countOptions = Array.from(
    new Set([5, 10, 15, 20, 25, 30, countMax].filter((n) => n <= countMax && n > 0))
  )
    .sort((a, b) => a - b)
    .map((num) => ({
      value: num,
      label: num === countMax ? `${num} ta (barchasi)` : `${num} ta savol`,
    }));

  const orderOptions = [
    { value: 'mixed', label: 'Aralash savollar (tavsiya)' },
    { value: 'sequential', label: 'Ketma-ket tartibda' },
  ];

  const timeOptions = [
    { value: 15, label: '15 soniya (tezkor)' },
    { value: 30, label: '30 soniya (standart)' },
    { value: 60, label: '60 soniya (batafsil)' },
    { value: 0, label: 'Vaqtsiz (cheksiz)' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="glass-card p-4 text-left hover:border-primary/50 transition-colors"
          data-testid="button-open-create-room"
          onClick={() => {
            setError('');
            setSheet('create');
          }}
        >
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Icon name="ri-sword-line" className="text-primary text-base" /> Xona yaratish
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">To‘plam, soni va vaqt</p>
        </button>
        <button
          type="button"
          className="glass-card p-4 text-left hover:border-primary/50 transition-colors"
          data-testid="button-open-join-room"
          onClick={() => {
            setJoinError('');
            setSheet('join');
          }}
        >
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Icon name="ri-key-line" className="text-primary text-base" /> Kod bilan qo‘shilish
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {active ? `Ochiq xona · ${active.code}` : 'Xona kodi va havola'}
          </p>
        </button>
      </div>

      <Panel className="mt-4 p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Icon name="ri-user-heart-line" className="text-emerald-500" />
              Kursdoshlar va Do‘stlar
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Do‘stlaringizni test musobaqasiga taklif qiling. Oflayn do‘stlaringiz ham ro‘yxatda aks etadi.
            </p>
          </div>
          <Link
            href="/friends"
            className="text-xs font-semibold px-2.5 py-1.5 rounded-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Icon name="ri-user-add-line" />
            <span>Do‘st qo‘shish</span>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto scrollbar-hide text-xs pb-1">
          <button
            type="button"
            onClick={() => setFriendFilter('all')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
              friendFilter === 'all'
                ? 'bg-primary text-white font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            Barchasi ({friends.length})
          </button>
          <button
            type="button"
            onClick={() => setFriendFilter('online')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
              friendFilter === 'online'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Onlayn ({onlineFriends.length})
          </button>
          <button
            type="button"
            onClick={() => setFriendFilter('offline')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
              friendFilter === 'offline'
                ? 'bg-slate-700 text-white font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            Oflayn ({offlineFriends.length})
          </button>
        </div>

        {/* Empty state when no friends */}
        {displayedList.length === 0 && (
          <div className="py-6 text-center">
            {friends.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30 max-w-md mx-auto">
                <Icon name="ri-user-search-line" className="text-3xl text-slate-400 mb-2 block mx-auto" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Sizda hali do‘stlar yo‘q
                </p>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  Do‘stlaringizni @username orqali qidiring va birgalikda bellashing.
                </p>
                <Link
                  href="/friends"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  <Icon name="ri-user-add-line" />
                  Do‘stlar bo‘limiga o‘tish
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ushbu filtr bo‘yicha hech qanday do‘st topilmadi.
              </p>
            )}
          </div>
        )}

        {/* Friends & Online List */}
        {displayedList.length > 0 && (
          <div className="mt-3.5 space-y-2">
            {displayedList.map((user) => {
              const isOnlineNow = isUserOnline(user.id, user.seen);
              const sent = invites.find(
                (invite) => invite.toId === user.id && invite.fromId === me?.id && active && invite.roomCode === active.code
              );
              const title = getMedicalTitle(user.xp ?? 0);
              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                    isOnlineNow
                      ? 'border-emerald-500/25 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.04]'
                      : 'border-slate-200/70 dark:border-white/5 bg-slate-50/40 dark:bg-slate-800/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold shadow-xs">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (user.name || 'MQ').slice(0, 2).toUpperCase()
                        )}
                      </div>
                      {/* Status indicator dot */}
                      {isOnlineNow ? (
                        <span
                          className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111827] shadow-xs"
                          title="Onlayn"
                        />
                      ) : (
                        <span
                          className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-slate-400 ring-2 ring-white dark:ring-[#111827]"
                          title="Oflayn"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {user.name || 'Talaba'}
                        </p>
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${title.color}`}>
                          <Icon name={title.icon} className="text-[10px]" />
                          <span>{title.badge}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        {isOnlineNow ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Hozir onlayn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            {formatLastSeen(user.seen)}
                          </span>
                        )}

                        {user.university && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                              {user.university}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isOnlineNow ? (
                      sent ? (
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            sent.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : sent.status === 'accepted'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {sent.status === 'pending'
                            ? 'Taklif yuborildi'
                            : sent.status === 'accepted'
                            ? 'Qabul qildi'
                            : 'Rad etdi'}
                        </span>
                      ) : (
                        <Btn
                          kind="primary"
                          className="text-xs px-3 py-1.5 h-auto rounded-[8px]"
                          testId={`button-invite-${user.id}`}
                          onClick={() => {
                            if (!active) {
                              setSheet('create');
                              return;
                            }
                            if (me && active.status === 'lobby') {
                              sendInvite(me, { id: user.id, name: user.name, avatar: user.avatar ?? null, seen: user.seen || Date.now() }, active);
                            }
                          }}
                        >
                          {active ? 'Taklif qilish' : 'Xonaga taklif'}
                        </Btn>
                      )
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-[8px] bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 font-medium cursor-not-allowed select-none border border-slate-200/50 dark:border-white/5"
                        title="Foydalanuvchi hozir oflayn"
                      >
                        <Icon name="ri-time-line" className="text-xs" />
                        <span>Oflayn</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </Panel>

      {/* Bottom Sheet Modal: Xona yaratish */}
      {sheet === 'create' && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            aria-label="Yopish"
            onClick={() => setSheet(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-room-title"
            className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-[10px] border border-slate-200/90 dark:border-white/10 border-b-0 bg-white dark:bg-[#111827] pb-safe shadow-2xl backdrop-blur-xl"
            style={{ transform: risen ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 280ms ease-out' }}
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-[10px] bg-slate-300 dark:bg-white/20" />

            <div className="mx-auto w-full px-4 pb-6 pt-2 sm:px-6">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-3">
                <div>
                  <h2 id="create-room-title" className="font-display font-semibold text-slate-900 dark:text-white text-lg">
                    Xona yaratish
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    To‘plam, savollar soni, tartib va vaqtni tanlang.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSheet(null)}
                  className="shrink-0 rounded-[10px] p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
                  aria-label="Yopish"
                  data-testid="button-close-create-room"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <Dropdown
                  label="Test to‘plami"
                  value={bankId}
                  options={bankOptions.length ? bankOptions : [{ value: '', label: 'To‘plam topilmadi' }]}
                  onChange={(val) => setBankId(String(val))}
                  placeholder="To‘plamni tanlang"
                />

                <Dropdown
                  label="Savollar soni"
                  value={count}
                  options={countOptions.length ? countOptions : [{ value: count, label: `${count} ta savol` }]}
                  onChange={(val) => setCount(Number(val))}
                  placeholder="Soni tanlang"
                />

                <Dropdown
                  label="Savollar tartibi"
                  value={order}
                  options={orderOptions}
                  onChange={(val) => setOrder(val as OrderMode)}
                />

                <Dropdown
                  label="Har bir savol uchun vaqt"
                  value={seconds}
                  options={timeOptions}
                  onChange={(val) => setSeconds(Number(val))}
                />
              </div>

              <Btn
                className="mt-6 w-full shadow-lg shadow-med-500/25 flex items-center justify-center gap-2"
                testId="button-create-room"
                onClick={() => {
                  if (!me) return;
                  const bank = banks.find((item) => item.id === bankId);
                  const ready = (bank?.questions ?? []).filter((question) => cleanQuestion(question)).length;
                  if (!bank || !ready) {
                    setError('Avval savolli to‘plamni tanlang.');
                    return;
                  }
                  setError('');
                  const room = createRoom(me, bank, count, order, seconds);
                  setSheet(null);
                  setLocation(`/battle/${room.code}`);
                }}
              >
                <Icon name="ri-play-fill" /> Xona yaratish
              </Btn>
              {error && <p className="mt-3 text-sm text-rose-500" role="alert">{error}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet Modal: Kod bilan qo‘shilish */}
      {sheet === 'join' && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            aria-label="Yopish"
            onClick={() => setSheet(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-room-title"
            className="relative z-10 max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-[10px] border border-slate-200/90 dark:border-white/10 border-b-0 bg-white dark:bg-[#111827] pb-safe shadow-2xl backdrop-blur-xl"
            style={{ transform: risen ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 280ms ease-out' }}
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-[10px] bg-slate-300 dark:bg-white/20" />

            <div className="mx-auto w-full px-4 pb-6 pt-2 sm:px-6">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-3">
                <h2 id="join-room-title" className="font-display font-semibold text-slate-900 dark:text-white text-lg">
                  Kod bilan qo‘shilish
                </h2>
                <button
                  type="button"
                  onClick={() => setSheet(null)}
                  className="shrink-0 rounded-[10px] p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
                  aria-label="Yopish"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>
              <input
                className={`${fieldClass} mt-4 uppercase !rounded-[10px] text-center tracking-widest text-lg font-mono`}
                value={code}
                placeholder="6 TA BELGI"
                data-testid="input-room-code"
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleJoinWithCode();
                }}
              />
              <Btn
                className="mt-4 w-full shadow-lg shadow-med-500/25 flex items-center justify-center gap-2"
                testId="button-join-code"
                disabled={isJoining}
                onClick={() => void handleJoinWithCode()}
              >
                {isJoining ? (
                  <>
                    <Icon name="ri-loader-4-line" className="animate-spin" /> Ulanmoqda...
                  </>
                ) : (
                  <>
                    <Icon name="ri-login-box-line" /> Qo‘shilish
                  </>
                )}
              </Btn>
              {joinError && <p className="mt-3 text-sm text-rose-500" role="alert">{joinError}</p>}
              {active && (
                <div className="mt-5 rounded-[10px] border border-slate-200/80 bg-slate-50/80 dark:border-white/10 dark:bg-[#1f2937]/50 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ochiq xonangiz</p>
                  <p className="mt-1 font-semibold tracking-[0.2em] text-slate-900 dark:text-white font-mono text-lg">
                    {active.code}
                  </p>
                  <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">{roomLink(active.code)}</p>
                  <div className="mt-3 flex gap-2">
                    <Btn testId="button-share" onClick={() => void share(active)}>
                      <Icon name="ri-share-forward-line" /> Ulashish
                    </Btn>
                    <Link
                      className="btn-secondary !rounded-[10px] text-xs sm:text-sm"
                      href={`/battle/${active.code}`}
                      onClick={() => setSheet(null)}
                    >
                      Xonaga kirish
                    </Link>
                  </div>
                  {copied === active.code && (
                    <p className="mt-2 text-xs text-med-600 dark:text-med-300 font-semibold">Havola nusxalandi.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BattleRoom() {
  const params = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { me } = useStore();
  const rooms = useRooms();
  const statsMap = useStatsMap();
  const cleanCode = (params.code ?? '').toLowerCase();
  const room = rooms.find((item) => item?.code && item.code.toLowerCase() === cleanCode);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(!room);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // 1. Initial room fetch from server if not found in local storage
  useEffect(() => {
    let active = true;
    async function init() {
      if (!cleanCode) return;
      if (!room) {
        setLoading(true);
        const serverRoom = await fetchRoomFromServer(cleanCode);
        if (serverRoom && active) {
          putRoom(serverRoom);
        }
      }
      setLoading(false);
    }
    init();
    return () => {
      active = false;
    };
  }, [cleanCode, room]);

  // 2. Real-time server sync interval (every 1000ms)
  useEffect(() => {
    if (!cleanCode) return;
    const interval = window.setInterval(async () => {
      await fetchRoomFromServer(cleanCode);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [cleanCode]);

  // 3. Auto join player
  useEffect(() => {
    if (!me || !room || joined) return;
    const result = joinRoom(me, room.code);
    setJoined(true);
    if (result.error && !result.room) setError(result.error);
  }, [joined, me, room]);

  useEffect(() => {
    if (!room || room.status !== 'countdown') return;
    const timer = window.setInterval(() => beginLive(room.code), 200);
    return () => window.clearInterval(timer);
  }, [room]);

  useEffect(() => {
    if (!room || room.status !== 'live') return;
    const interval = window.setInterval(() => {
      tryAdvance(room.code);
    }, 350);
    return () => window.clearInterval(interval);
  }, [room?.code, room?.status, room?.index]);

  // Auto answer for seed bots during live battle
  useEffect(() => {
    if (!room || room.status !== 'live') return;
    const currentQ = (room.questions ?? [])[room.index];
    if (!currentQ) return;
    const key = String(room.index);
    const answers = room.answers ?? {};
    const botPlayers = (room.players ?? []).filter(
      (p) => p.id.startsWith('user-seed-') && !answers[p.id]?.[key]
    );
    if (!botPlayers.length) return;

    const timer = window.setTimeout(() => {
      for (const bot of botPlayers) {
        const correctIdx = (currentQ.options ?? []).findIndex((o) => o.correct);
        const isCorrect = Math.random() < 0.75;
        const pick =
          isCorrect && correctIdx !== -1
            ? correctIdx
            : Math.floor(Math.random() * (currentQ.options ?? []).length);
        answerRoom(bot.id, room.code, [pick]);
      }
    }, 2000 + Math.random() * 2000);

    return () => window.clearTimeout(timer);
  }, [room?.code, room?.status, room?.index]);

  useEffect(() => {
    if (me && room?.status === 'done') claimBattle(me, room);
  }, [me, room]);

  if (loading && !room) {
    return (
      <Panel className="p-12 text-center flex flex-col items-center justify-center">
        <Icon name="ri-loader-4-line" className="text-4xl text-primary animate-spin" />
        <p className="mt-4 text-base font-bold text-slate-900 dark:text-white">Xona qidirilmoqda...</p>
        <p className="mt-1 text-xs text-slate-500">Kod: {params.code}</p>
      </Panel>
    );
  }

  if (!room || !me) {
    return (
      <Panel className="p-8 text-center">
        <Icon name="ri-error-warning-line" className="text-4xl text-rose-500 mx-auto" />
        <p className="mt-3 text-base font-bold text-slate-900 dark:text-white">{error || 'Xona topilmadi yoki yopilgan.'}</p>
        <p className="mt-1 text-xs text-slate-500">Kodni qayta tekshiring yoki yangi xona oching.</p>
        <Link className="mt-4 inline-flex items-center gap-1.5 btn-primary !rounded-[10px] text-xs font-semibold px-4 py-2" href="/battle">
          <Icon name="ri-arrow-left-line" /> Battle Lobby
        </Link>
      </Panel>
    );
  }

  const playing = (room.players ?? []).some((player) => player?.id === me.id);
  if (!playing) {
    return (
      <Panel className="p-8 text-center">
        <Icon name="ri-loader-4-line" className="text-4xl text-primary animate-spin mx-auto" />
        <p className="mt-3 text-base font-bold text-slate-900 dark:text-white">{error || 'Xonaga qo‘shilish kutilmoqda...'}</p>
        <Link className="mt-4 inline-flex items-center gap-1.5 btn-secondary !rounded-[10px] text-xs font-semibold px-4 py-2" href="/battle">
          <Icon name="ri-arrow-left-line" /> Lobby
        </Link>
      </Panel>
    );
  }

  const ranked = [...(room.players ?? [])].sort((a, b) => playerScore(room, b?.id || '') - playerScore(room, a?.id || ''));
  const host = room.hostId === me.id;

  const share = async () => {
    const url = roomLink(room.code);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'MedQuiz battle', url });
        return;
      } catch {
        /* fallback to clipboard */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <div className="relative pb-24 sm:pb-0">
      {/* 1. Fullscreen Countdown Timer (Butun ekranda chiqadigan timer) */}
      {room.status === 'countdown' && room.countdownAt && (
        <FullscreenCountdown started={room.countdownAt} room={room} />
      )}

      {/* 2. Side Floating Expandable Reactions (Yon tomonda joylashgan va bosilsa yoyiladigan reaksiyalar) */}
      <BattleReactions roomCode={room.code} me={me} />

      {/* 2. Floating Group Voice Chat Widget (on the side) */}
      <BattleVoiceChat roomCode={room.code} me={me} />

      {/* 3. Floating Group Chat Trigger Button (on the side) */}
      <div className="fixed left-1/2 z-40 -ml-[5.5rem] bottom-[calc(5.2rem+env(safe-area-inset-bottom))] sm:left-auto sm:right-6 sm:ml-0 sm:bottom-38">
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="relative flex h-12 w-12 items-center justify-center rounded-[10px] shadow-2xl transition-all duration-200 active:scale-95 border bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-white/15 hover:scale-110 shadow-slate-900/20 backdrop-blur-md cursor-pointer"
          title="Guruh suhbati"
          aria-label="Guruh suhbati"
        >
          <Icon name="ri-chat-3-fill" className="text-2xl text-primary drop-shadow" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md ring-2 ring-white dark:ring-slate-900 animate-bounce">
              {unreadChatCount}
            </span>
          )}
        </button>
      </div>

      {/* 4. Group Battle Chat Modal / Drawer */}
      <BattleChat
        roomCode={room.code}
        me={me}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onUnreadChange={setUnreadChatCount}
      />

      <div className={`grid gap-6 ${room.status === 'live' ? 'max-w-3xl mx-auto' : 'lg:grid-cols-[1fr_320px]'}`}>
        {/* Main Quiz Area */}
        <div className="w-full">
          <div className="mb-2 sm:mb-4">
            <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>
                {room.status === 'lobby'
                  ? 'Kutilmoqda'
                  : room.status === 'countdown'
                  ? 'Tayyormisiz?'
                  : room.status === 'live'
                  ? 'Jonli jang'
                  : 'Yakunlandi'}
              </span>
              <span>·</span>
              <span className="font-mono font-bold tracking-wider">{room.code}</span>
            </p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <h1 className="min-w-0 text-base sm:text-xl font-bold leading-tight truncate">{room.bankName}</h1>

              {room.status === 'live' && room.seconds > 0 && room.questionStartedAt && (
                <div className="shrink-0 ml-1">
                  <LiveRing started={room.questionStartedAt} total={room.seconds} />
                </div>
              )}
            </div>
          </div>

          {error && <p className="mb-3 text-sm text-red-600" role="alert">{error}</p>}

          {(room.status === 'lobby' || room.status === 'countdown') && (
            <Panel className="p-6">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon name="ri-information-line" />
                {room.questions.length} ta savol · {room.order === 'mixed' ? 'aralash tartibda' : 'ketma-ket'} ·{' '}
                {room.seconds ? `${room.seconds}s har savolga` : 'vaqtsiz'}
              </p>
              <div className="mt-5 flex items-center gap-2">
                <Btn className="shrink-0 flex items-center gap-1.5" testId="button-share-room" onClick={() => void share()}>
                  <Icon name="ri-share-forward-line" /> Do‘stga ulashish
                </Btn>
                <p className="min-w-0 flex-1 break-all rounded-[10px] bg-slate-100 dark:bg-white/5 px-3 py-2.5 text-xs font-mono text-slate-700 dark:text-slate-300">
                  {roomLink(room.code)}
                </p>
              </div>
              {copied && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Havola nusxalandi!</p>}
              <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Icon name="ri-headphone-fill" className="text-primary text-base shrink-0" />
                <span>Guruh bilan jonli ovozli gaplashish yoki yozishish uchun yuqoridagi <strong>«Ovozli aloqa»</strong> va <strong>«Suhbat»</strong> tugmalaridan foydalanishingiz mumkin.</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Btn
                  kind="line"
                  onClick={() => {
                    leaveRoom(me.id, room.code);
                    setLocation('/battle');
                  }}
                >
                  <Icon name="ri-logout-box-r-line" /> Tark etish
                </Btn>
              </div>
            </Panel>
          )}

          {room.status === 'live' && room.questions[room.index] && (
            <LiveQuestion room={room} meId={me.id} host={host} />
          )}

          {room.status === 'done' && (
            <Panel className="p-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Icon name="ri-trophy-line" className="text-amber-500" /> Natijalar
              </h2>
              <div className="mt-4 space-y-2">
                {ranked.map((player, index) => {
                  const playerXp = statsMap[player?.id || '']?.xp ?? 0;
                  const playerTitle = getMedicalTitle(playerXp);
                  return (
                    <div
                      key={player?.id || index}
                      className="flex items-center justify-between rounded-[10px] border border-border px-3.5 py-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 text-center font-mono text-sm font-bold text-slate-400 flex items-center justify-center">
                          {index === 0 ? (
                            <Icon name="ri-trophy-fill" className="text-amber-400 text-base" />
                          ) : index === 1 ? (
                            <Icon name="ri-medal-fill" className="text-slate-400 text-base" />
                          ) : index === 2 ? (
                            <Icon name="ri-medal-fill" className="text-amber-600 text-base" />
                          ) : (
                            `${index + 1}.`
                          )}
                        </span>
                        <span className="text-sm font-medium">
                          {player?.name || 'Talaba'}
                          {player?.id === me.id ? ' (Siz)' : ''}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-semibold border ${playerTitle.color}`}>
                          <Icon name={playerTitle.icon} className="text-xs" />
                          {playerTitle.badge}
                        </span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{playerScore(room, player?.id || '')} ball</span>
                    </div>
                  );
                })}
              </div>
              <Link href="/battle" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                <Icon name="ri-refresh-line" /> Yangi battle boshlash
              </Link>
            </Panel>
          )}
        </div>

        {/* Redesigned Participants List - faqat lobby, countdown va natijalar holatida ko'rinadi, jonli test vaqtida chalg'itmaslik uchun yashiriladi */}
        {room.status !== 'live' && (
          <Panel className="relative overflow-hidden p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/10 pb-3 mb-3">
                <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Icon name="ri-group-line" className="text-primary text-base" />
                  Ishtirokchilar
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-[8px] bg-primary/10 text-primary font-bold">
                  {(room.players ?? []).length} kishi
                </span>
              </div>

              <div className="space-y-2.5">
                {(room.players ?? []).map((player) => {
                  const playerXp = statsMap[player?.id || '']?.xp ?? 0;
                  const playerTitle = getMedicalTitle(playerXp);
                  const isMe = player?.id === me.id;
                  const answeredCount = Object.keys((room.answers ?? {})[player?.id || ''] ?? {}).length;
                  const progress = (room.questions ?? []).length ? Math.round((answeredCount / room.questions.length) * 100) : 0;

                  return (
                    <div
                      key={player?.id}
                      className={`p-3 rounded-[10px] border transition-all ${
                        isMe
                          ? 'border-primary/40 bg-primary/5 dark:bg-primary/10 shadow-xs'
                          : 'border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-9 w-9 rounded-[8px] overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-300 dark:border-white/15">
                            {player?.avatar ? (
                              <img src={player.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              (player?.name || 'MQ').slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                              {player?.name || 'Talaba'} {isMe && <span className="text-xs text-primary font-normal">(Siz)</span>}
                            </p>
                            <div className={`mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded-[6px] text-[10px] font-semibold border ${playerTitle.color}`}>
                              <Icon name={playerTitle.icon} className="text-[11px]" />
                              <span>{playerTitle.badge}</span>
                            </div>
                          </div>
                        </div>

                        {/* Ready status or score */}
                        <div className="shrink-0 text-right">
                          {room.status === 'done' ? (
                            <span className="font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums">
                              {playerScore(room, player?.id || '')} <span className="text-[11px] text-slate-400 font-normal">ball</span>
                            </span>
                          ) : player?.ready ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/30">
                              <Icon name="ri-check-line" /> Tayyor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-slate-100 dark:bg-white/10 text-slate-400 font-medium text-xs">
                              <Icon name="ri-time-line" /> Kutmoqda
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {(room.status === 'lobby' || room.status === 'countdown') && (
              <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/10">
                <Btn
                  className={`w-full py-3 font-bold text-sm shadow-md flex items-center justify-center gap-2 ${
                    (room.players ?? []).find((player) => player?.id === me.id)?.ready
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : ''
                  }`}
                  testId="button-ready"
                  onClick={() => setPlayerReady(me.id, room.code)}
                >
                  {(room.players ?? []).find((player) => player?.id === me.id)?.ready ? (
                    <>
                      <Icon name="ri-check-line" className="text-lg" /> Tayyorsiz (Bekor qilish)
                    </>
                  ) : (
                    <>
                      <Icon name="ri-play-fill" className="text-lg" /> Men Tayyorman
                    </>
                  )}
                </Btn>
              </div>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

{/* Fullscreen Countdown Timer Component (Butun ekranda chiqadigan timer) */}
function FullscreenCountdown({ started, room }: { started: number; room: Room }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = Math.max(0, (now - started) / 1000);
  const left = Math.max(0, Math.ceil(5 - elapsed));
  const progress = Math.min(100, (elapsed / 5) * 100);

  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-6 select-none animate-in fade-in duration-300">
      {/* Background radial glow */}
      <div className="absolute h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none animate-pulse" />

      {/* Top Banner */}
      <div className="relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-[10px] bg-primary/15 text-primary border border-primary/30 text-xs sm:text-sm font-bold uppercase tracking-wider mb-6 shadow-sm">
        <Icon name="ri-sword-fill" className="text-base" />
        <span>Battle boshlanmoqda</span>
      </div>

      {/* Circular Countdown Ring (Ixcham, zamonaviy) */}
      <div className="relative z-10 flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            className="text-white/10"
            strokeWidth="5"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            className="text-primary transition-all duration-150"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={276}
            strokeDashoffset={276 - (progress / 100) * 276}
          />
        </svg>

        {/* Center Number with scale animation */}
        <div key={left} className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
          <span className="font-display text-5xl sm:text-6xl font-black text-white tabular-nums drop-shadow-xl">
            {left > 0 ? left : 'GO!'}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
            {left > 0 ? 'Soniya' : 'Boshlandi'}
          </span>
        </div>
      </div>

      {/* Bank & Question Info */}
      <div className="relative z-10 mt-8 text-center max-w-md">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Tayyormisiz?
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {room.bankName} · {room.questions.length} ta savol
        </p>
      </div>

      {/* Ready Participants Pills */}
      <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-2 max-w-lg">
        {(room.players ?? []).map((p) => (
          <div
            key={p?.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-white/10 border border-white/15 text-white text-xs font-semibold backdrop-blur-xs"
          >
            <div className="h-6 w-6 rounded-[6px] overflow-hidden bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              {p?.avatar ? (
                <img src={p.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                (p?.name || 'MQ').slice(0, 2).toUpperCase()
              )}
            </div>
            <span>{p?.name || 'Talaba'}</span>
            <Icon name="ri-check-line" className="text-emerald-400 text-sm font-bold" />
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveQuestion({ room, meId, host }: { room: Room; meId: string; host: boolean }) {
  const question = (room.questions ?? [])[room.index];
  const mine = (room.answers ?? {})[meId]?.[String(room.index)];
  const multi = !!question && (question.options ?? []).filter((option) => option?.correct).length > 1;
  const [picks, setPicks] = useState<number[]>([]);

  useEffect(() => setPicks([]), [room.index]);

  if (!question) return null;
  const shown = mine?.picks ?? picks;

  return (
    <Panel className="p-3 sm:p-5">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
        <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1 font-medium">
          <Icon name="ri-questionnaire-line" className="text-primary" />
          Savol {room.index + 1} / {room.questions.length}
        </p>
        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-[6px] bg-primary/10 text-primary font-semibold">
          {multi ? 'Ko‘p javobli' : 'Bitta to‘g‘ri javob'}
        </span>
      </div>
      {question.image && (
        <img src={question.image} alt="" className="my-2 max-h-36 sm:max-h-56 w-full rounded-[10px] object-contain" />
      )}
      <h2 className="mt-2.5 sm:mt-3 text-sm sm:text-base font-semibold leading-snug sm:leading-relaxed text-slate-900 dark:text-white">
        {question.prompt}
      </h2>
      <Choices
        question={question}
        picks={shown}
        locked={!!mine}
        onPick={(index) => {
          if (mine) return;
          if (!multi) {
            const userPicks = [index];
            answerRoom(meId, room.code, userPicks);
            if (!isCorrectPick(question, userPicks)) {
              recordMistake(room.bankId ?? room.bankName, room.bankName, question, userPicks);
            }
            return;
          }
          setPicks((current) =>
            current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
          );
        }}
      />
      <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200/70 dark:border-white/5">
        <p className="text-[11px] sm:text-xs text-muted-foreground">
          {mine ? `+${mine.points} ball${mine.points >= 25 ? ' · birinchi' : ''}` : 'Birinchi to‘g‘ri javob ko‘proq ball'}
        </p>
        <div className="flex gap-2">
          {multi && !mine && (
            <Btn
              className="py-1.5 px-3 text-xs sm:text-sm"
              disabled={!picks.length}
              onClick={() => {
                answerRoom(meId, room.code, picks);
                if (!isCorrectPick(question, picks)) {
                  recordMistake(room.bankId ?? room.bankName, room.bankName, question, picks);
                }
              }}
            >
              Javobni yuborish
            </Btn>
          )}
          {host && (
            <Btn kind="line" className="py-1.5 px-3 text-xs sm:text-sm" onClick={() => forceNext(meId, room.code)}>
              Keyingisini ochish
            </Btn>
          )}
        </div>
      </div>
    </Panel>
  );
}

function LiveRing({ started, total }: { started: number; total: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);
  const left = Math.max(0, total - Math.floor((now - started) / 1000));
  return <Ring seconds={left} total={total} />;
}
