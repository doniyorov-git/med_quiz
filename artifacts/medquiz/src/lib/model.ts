import { clearSession, readFresh, readSession, updateKey, writeKey, writeSession } from '@/lib/db';
import { cleanQuestion, isCorrectPick, shuffle, uid } from '@/lib/parser';
import type {
  Bank,
  BankExamSchedule,
  BattleChatMessage,
  BattleReaction,
  DailyWorkout,
  DayStat,
  FriendRequest,
  Invite,
  Me,
  MedicalTitle,
  MistakeItem,
  OrderMode,
  PresenceUser,
  PublicUser,
  Question,
  Room,
  RoomPlayer,
  SoloResult,
  Stats,
  VoicePeer,
  WebRTCSignal,
} from '@/lib/types';

const BANKS = 'medquiz-v2-banks';
const ROOMS = 'medquiz-v2-rooms';
const INVITES = 'medquiz-v2-invites';
const STATS = 'medquiz-v2-stats';
const MISTAKES = 'medquiz-v2-mistakes';
const LAST = 'medquiz-v2-last';
const ME = 'medquiz-v2-me';
const PRESENCE_PREFIX = 'medquiz-v2-p-';

export const API_BASE = (import.meta.env.BASE_URL?.replace(/\/$/, '') || '') + '/api';

const emptyStats = (me: Me): Stats => ({
  userId: me.id,
  name: me.name,
  avatar: me.avatar,
  quizzes: 0,
  correct: 0,
  answered: 0,
  xp: 0,
  streak: 0,
  lastDay: '',
  perfects: 0,
  fastCorrect: 0,
  battleWins: 0,
  battlePlayed: 0,
  claimedRooms: [],
});

export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

function rememberDay(history: Stats['history'], correct: number, answered: number, xp: number): Record<string, DayStat> {
  const today = dayKey();
  const next: Record<string, DayStat> = { ...(history ?? {}) };
  const prev = next[today] ?? { correct: 0, answered: 0, xp: 0 };
  next[today] = { correct: prev.correct + correct, answered: prev.answered + answered, xp: prev.xp + xp };
  const keep = new Set<string>();
  const cursor = new Date();
  for (let offset = 0; offset < 21; offset += 1) {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() - offset);
    keep.add(dayKey(day));
  }
  for (const key of Object.keys(next)) {
    if (!keep.has(key)) delete next[key];
  }
  return next;
}

export function recentAccuracy(history: Stats['history'], days = 7): { day: string; accuracy: number }[] {
  const cursor = new Date();
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() - (days - 1 - index));
    const bucket = history?.[dayKey(day)];
    const accuracy = bucket && bucket.answered > 0 ? Math.round((bucket.correct / bucket.answered) * 100) : 0;
    return { day: WEEKDAYS[day.getDay()] ?? '', accuracy };
  });
}

function yesterdayKey(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return dayKey(date);
}

export function levelFromXp(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

export const MEDICAL_TITLES: MedicalTitle[] = [
  {
    id: 'talaba',
    title: 'Talaba',
    stage: 'Boshlang‘ich bosqich',
    minXp: 0,
    nextXp: 500,
    badge: 'Talaba',
    icon: 'ri-graduation-cap-fill',
    color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'magistr',
    title: 'Magistr',
    stage: 'Klinik ordinator / Magistr',
    minXp: 500,
    nextXp: 1500,
    badge: 'Magistr',
    icon: 'ri-stethoscope-fill',
    color: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',
  },
  {
    id: 'oqituvchi',
    title: 'O‘qituvchi',
    stage: 'Assistent / O‘qituvchi',
    minXp: 1500,
    nextXp: 3000,
    badge: 'O‘qituvchi',
    icon: 'ri-book-read-fill',
    color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'doktorant',
    title: 'Doktorant',
    stage: 'PhD ilmiy izlanuvchi',
    minXp: 3000,
    nextXp: 6000,
    badge: 'Doktorant',
    icon: 'ri-microscope-fill',
    color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
  },
  {
    id: 'fan-doktori',
    title: 'Fan doktori',
    stage: 'DSc / Yetakchi mutaxassis',
    minXp: 6000,
    nextXp: 10000,
    badge: 'Fan doktori',
    icon: 'ri-medicine-bottle-fill',
    color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  {
    id: 'professor',
    title: 'Professor',
    stage: 'Kafedra professori',
    minXp: 10000,
    nextXp: 15000,
    badge: 'Professor',
    icon: 'ri-building-4-fill',
    color: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
  },
  {
    id: 'akademik',
    title: 'Akademik',
    stage: 'Fanlar akademiyasi a‘zosi — eng oliy unvon',
    minXp: 15000,
    nextXp: 50000,
    badge: 'Akademik',
    icon: 'ri-vip-crown-fill',
    color: 'bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
  },
];

export function getMedicalTitle(xp: number): MedicalTitle {
  for (let i = MEDICAL_TITLES.length - 1; i >= 0; i--) {
    if (xp >= MEDICAL_TITLES[i].minXp) {
      return MEDICAL_TITLES[i];
    }
  }
  return MEDICAL_TITLES[0];
}

export function getLeaderboardXp(stats: Stats, period: 'week' | 'month' | 'all'): number {
  if (period === 'all') return stats.xp ?? 0;
  if (!stats.history) return stats.xp ?? 0;

  const now = new Date();
  const daysLimit = period === 'week' ? 7 : 30;
  let total = 0;

  for (let i = 0; i < daysLimit; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    if (stats.history[key]) {
      total += stats.history[key].xp || 0;
    }
  }

  return total > 0 ? total : (period === 'week' ? Math.min(stats.xp ?? 0, 350) : Math.min(stats.xp ?? 0, 1200));
}


export function defaultUsername(name?: string, id?: string): string {
  const safeName = (name || 'talaba').toString();
  const safeId = (id || '0000').toString();
  const slug = safeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'talaba';
  return `${slug}_${safeId.slice(-4)}`;
}

export function loadMe(): Me | null {
  try {
    const me = readSession<Me>(ME);
    if (!me || typeof me !== 'object') return null;
    if (!me.id) return null;
    if (!me.name) me.name = 'Talaba';
    if (!me.username) {
      me.username = defaultUsername(me.name, me.id);
      writeSession(ME, me);
    }
    return me;
  } catch {
    return null;
  }
}

export function loadLast(): Me | null {
  try {
    const last = readFresh<Me | null>(LAST, null);
    if (!last || typeof last !== 'object') return null;
    if (!last.id) return null;
    if (!last.name) last.name = 'Talaba';
    if (!last.username) {
      last.username = defaultUsername(last.name, last.id);
    }
    return last;
  } catch {
    return null;
  }
}

export function syncMeToServer(me: Me, stats?: Stats | null) {
  if (typeof window === 'undefined') return;
  const currentStats = stats || myStats(me);
  const publicUser: PublicUser = {
    id: me.id,
    username: me.username || defaultUsername(me.name, me.id),
    name: me.name,
    phone: me.phone || '',
    email: me.email || '',
    avatar: me.avatar,
    university: me.university || '',
    course: me.course || '',
    faculty: me.faculty || '',
    bio: me.bio || '',
    xp: currentStats?.xp ?? 0,
    quizzes: currentStats?.quizzes ?? 0,
    battleWins: currentStats?.battleWins ?? 0,
    streak: currentStats?.streak ?? 0,
    seen: Date.now(),
  };
  fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(publicUser),
  }).catch(() => {});
}

export function saveMe(me: Me) {
  const withUsername = {
    ...me,
    username: me.username ? me.username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() : defaultUsername(me.name, me.id),
  };
  writeSession(ME, withUsername);
  writeKey(LAST, withUsername);
  beat(withUsername);
  updateKey<Record<string, Stats>>(STATS, {}, (map) => {
    const current = map[withUsername.id] ?? emptyStats(withUsername);
    return { ...map, [withUsername.id]: { ...current, name: withUsername.name, avatar: withUsername.avatar } };
  });
  syncMeToServer(withUsername, myStats(withUsername));
}

export function clearMe(id?: string) {
  if (id) window.localStorage.removeItem(`${PRESENCE_PREFIX}${id}`);
  clearSession(ME);
}

let lastBeatServer = 0;

export function beat(me: Me) {
  const payload: PresenceUser = { id: me.id, name: me.name, avatar: me.avatar, seen: Date.now() };
  window.localStorage.setItem(`${PRESENCE_PREFIX}${me.id}`, JSON.stringify(payload));
  window.dispatchEvent(new Event('medquiz-presence'));

  // Sync heartbeat to server throttled every 4 seconds
  const now = Date.now();
  if (now - lastBeatServer > 4000) {
    lastBeatServer = now;
    syncMeToServer(me);
  }
}

let cachedOnlineUsers: PresenceUser[] = [];
let lastOnlineSig = '';

export function onlineUsers(): PresenceUser[] {
  if (typeof window === 'undefined') return [];
  const now = Date.now();
  const map = new Map<string, PresenceUser>();

  // 1. Read from local storage presence
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(PRESENCE_PREFIX)) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const user = JSON.parse(raw) as PresenceUser;
          if (user && user.id && (now - (user.seen || 0)) < 60000) {
            map.set(user.id, user);
          }
        }
      } catch {}
    }
  }

  // 2. Read from server-synced public users (cross-device presence)
  const publicUsers = getPublicUsers();
  for (const pu of publicUsers) {
    if (pu && pu.id && (now - (pu.seen || 0)) < 60000) {
      const existing = map.get(pu.id);
      if (!existing || (pu.seen || 0) > (existing.seen || 0)) {
        map.set(pu.id, {
          id: pu.id,
          name: pu.name || 'Talaba',
          avatar: pu.avatar || null,
          seen: pu.seen || now,
        });
      }
    }
  }

  const users = Array.from(map.values());
  users.sort((a, b) => (b.seen || 0) - (a.seen || 0));

  // Signature based on IDs and bucketing seen to 5s
  const sig = users.map((u) => `${u.id}:${Math.floor((u.seen || 0) / 5000)}:${u.name}`).join('|');
  if (sig === lastOnlineSig && cachedOnlineUsers.length === users.length) {
    return cachedOnlineUsers;
  }
  lastOnlineSig = sig;
  cachedOnlineUsers = users;
  return users;
}

export function subscribePresence(listener: () => void) {
  const onCustom = () => listener();
  window.addEventListener('medquiz-presence', onCustom);
  window.addEventListener('storage', onCustom);
  return () => {
    window.removeEventListener('medquiz-presence', onCustom);
    window.removeEventListener('storage', onCustom);
  };
}

let banksSnap: { raw: string | null; value: Bank[] } | null = null;

const DEFAULT_SAMPLE_BANK: Bank = {
  id: 'bank-fiziologiya-demo',
  name: 'Normal Fiziologiya (Namuna)',
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  questions: [
    {
      id: 'fz-1',
      image: null,
      prompt: 'Tinchlik holatida hujayra membranasi qaysi ionga nisbatan eng yuqori o‘tkazuvchanlikka ega?',
      options: [
        { id: 'fz-1-1', text: 'K+ (Kaliy) ionlariga', correct: true },
        { id: 'fz-1-2', text: 'Na+ (Natriy) ionlariga', correct: false },
        { id: 'fz-1-3', text: 'Ca2+ (Kalsiy) ionlariga', correct: false },
        { id: 'fz-1-4', text: 'Cl- (Xlor) ionlariga', correct: false },
        { id: 'fz-1-5', text: 'Mg2+ (Magniy) ionlariga', correct: false },
      ],
    },
    {
      id: 'fz-2',
      image: null,
      prompt: 'Harakat potensialining tez depolarizatsiya fazasi qaysi ionlarning hujayra ichiga oqib kirishi hisobiga yuzaga keladi?',
      options: [
        { id: 'fz-2-1', text: 'Potensialga bog‘liq Na+ (Natriy) ionlarining', correct: true },
        { id: 'fz-2-2', text: 'Potensialga bog‘liq K+ (Kaliy) ionlarining', correct: false },
        { id: 'fz-2-3', text: 'Cl- (Xlor) ionlarining', correct: false },
        { id: 'fz-2-4', text: 'H+ (Vodorod) ionlarining', correct: false },
      ],
    },
    {
      id: 'fz-3',
      image: null,
      prompt: 'Yurakning birinchi tartibli avtomatizm markazi (asosiy ritm haydovchisi - peysmeyker) qaysi tuzilma hisoblanadi?',
      options: [
        { id: 'fz-3-1', text: 'Sinoatrial (SA, Kis-Flak) tugun', correct: true },
        { id: 'fz-3-2', text: 'Atrioventrikulyar (AV, Ashoff-Tavara) tugun', correct: false },
        { id: 'fz-3-3', text: 'Gis tutami oyoqchalari', correct: false },
        { id: 'fz-3-4', text: 'Purkinye tolalari', correct: false },
      ],
    },
    {
      id: 'fz-4',
      image: null,
      prompt: 'Eritrotsitlar cho‘kish tezligi (ECHT) qaysi oqsil miqdori oshganda sezilarli darajada tezlashadi?',
      options: [
        { id: 'fz-4-1', text: 'Fibrinogen va gamma-globulinlar', correct: true },
        { id: 'fz-4-2', text: 'Albomunlar', correct: false },
        { id: 'fz-4-3', text: 'Gemoglobin', correct: false },
        { id: 'fz-4-4', text: 'Transferrin', correct: false },
      ],
    },
    {
      id: 'fz-5',
      image: null,
      prompt: 'Qonning normal pH ko‘rsatkichi qaysi oraliqda bo‘ladi?',
      options: [
        { id: 'fz-5-1', text: '7.35 — 7.45', correct: true },
        { id: 'fz-5-2', text: '7.00 — 7.15', correct: false },
        { id: 'fz-5-3', text: '7.50 — 7.65', correct: false },
        { id: 'fz-5-4', text: '6.80 — 7.20', correct: false },
      ],
    },
    {
      id: 'fz-6',
      image: null,
      prompt: 'O‘pkaning tiriklik sig‘imi (O‘TS) nimalar yig‘indisidan iborat?',
      options: [
        { id: 'fz-6-1', text: 'Nafas hajmi + qo‘shimcha nafas hajmi + zaxira nafas chiqarish hajmi', correct: true },
        { id: 'fz-6-2', text: 'Nafas hajmi + qoldiq hajm', correct: false },
        { id: 'fz-6-3', text: 'O‘pkaning umumiy sig‘imi + qoldiq hajm', correct: false },
        { id: 'fz-6-4', text: 'Faqat nafas olish va nafas chiqarish hajmlari', correct: false },
      ],
    },
    {
      id: 'fz-7',
      image: null,
      prompt: 'Neyronlar orasidagi kimyoviy sinapslarda qo‘zg‘alishni o‘tkazuvchi asosiy qo‘zg‘atuvchi mediator qaysi?',
      options: [
        { id: 'fz-7-1', text: 'Glutamat va Atsetilxolin', correct: true },
        { id: 'fz-7-2', text: 'GAYK (GABA)', correct: false },
        { id: 'fz-7-3', text: 'Glitsin', correct: false },
        { id: 'fz-7-4', text: 'Endorfin', correct: false },
      ],
    },
    {
      id: 'fz-8',
      image: null,
      prompt: 'Oshqozon shirasida xlorid kislota (HCl) sintezini kuchaytiruvchi gormon qaysi?',
      options: [
        { id: 'fz-8-1', text: 'Gastrin', correct: true },
        { id: 'fz-8-2', text: 'Sekretin', correct: false },
        { id: 'fz-8-3', text: 'Xoletsistokinin', correct: false },
        { id: 'fz-8-4', text: 'Somatostatin', correct: false },
      ],
    },
    {
      id: 'fz-9',
      image: null,
      prompt: 'Buyrak nefronlarida birlamchi siydik hosil bo‘lishi qaysi jarayonga asoslangan?',
      options: [
        { id: 'fz-9-1', text: 'Koptokchalarda qon plazmasining filtratsiyasiga', correct: true },
        { id: 'fz-9-2', text: 'Naychalardagi faol reabsorbsiyaga', correct: false },
        { id: 'fz-9-3', text: 'Naychalar sekretsiyasiga', correct: false },
        { id: 'fz-9-4', text: 'Diffuzion osmosga', correct: false },
      ],
    },
    {
      id: 'fz-10',
      image: null,
      prompt: 'Qalqonsimon bez gormonlari (T3, T4) ning asosiy fiziologik ta’siri nimadan iborat?',
      options: [
        { id: 'fz-10-1', text: 'Asosiy moddalar almashinuvini va kislorod sarfini oshirish', correct: true },
        { id: 'fz-10-2', text: 'Qonda qand miqdorini kamaytirish', correct: false },
        { id: 'fz-10-3', text: 'Kalsiy miqdorini qonda keskin tushirish', correct: false },
        { id: 'fz-10-4', text: 'Immun tizimini bostirish', correct: false },
      ],
    },
  ],
};

export function getBanks(): Bank[] {
  if (typeof window === 'undefined') return [];
  let raw = window.localStorage.getItem(BANKS);
  if (banksSnap && banksSnap.raw === raw) return banksSnap.value;
  let parsed: Bank[] = [];
  try {
    parsed = raw ? (JSON.parse(raw) as Bank[]) : [];
  } catch {
    parsed = [];
  }
  let value = (Array.isArray(parsed) ? parsed : [])
    .filter((bank): bank is Bank => Boolean(bank && typeof bank === 'object' && bank.id))
    .map((bank) => ({
      ...bank,
      name: bank.name || 'Yangi to‘plam',
      questions: Array.isArray(bank.questions) ? bank.questions : [],
    }));

  if (value.length === 0) {
    value = [DEFAULT_SAMPLE_BANK];
    const serialized = JSON.stringify(value);
    raw = serialized;
    try {
      window.localStorage.setItem(BANKS, serialized);
    } catch {}
  }

  banksSnap = { raw, value };
  return value;
}

export function upsertBank(bank: Bank) {
  const safeBank: Bank = {
    ...bank,
    questions: Array.isArray(bank.questions) ? bank.questions : [],
  };
  updateKey<Bank[]>(BANKS, [], (banks) => {
    const list = Array.isArray(banks) ? banks : [];
    const index = list.findIndex((item) => item && item.id === safeBank.id);
    if (index === -1) return [safeBank, ...list];
    const next = [...list];
    next[index] = safeBank;
    return next;
  });
}

export function deleteBank(id: string) {
  updateKey<Bank[]>(BANKS, [], (banks) => banks.filter((bank) => bank.id !== id));
}

export function createBank(name: string, questions: Question[] = []): Bank {
  const now = Date.now();
  const bank: Bank = {
    id: uid('bank'),
    name: name.trim() || 'Yangi to‘plam',
    createdAt: now,
    updatedAt: now,
    questions: Array.isArray(questions) ? questions : [],
  };
  upsertBank(bank);
  return bank;
}

function subjectKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('uz');
}

export function saveQuestionsToSubject(name: string, questions: Question[]): Bank {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  const key = subjectKey(trimmed);
  const existing = getBanks().find((bank) => subjectKey(bank.name) === key);
  if (!existing) return createBank(trimmed, questions);
  const next: Bank = {
    ...existing,
    questions: [...(existing.questions ?? []), ...questions],
    updatedAt: Date.now(),
  };
  upsertBank(next);
  return next;
}

export function renameBank(id: string, name: string) {
  updateKey<Bank[]>(BANKS, [], (banks) => banks.map((bank) => (bank.id === id ? { ...bank, name: name.trim() || bank.name, updatedAt: Date.now() } : bank)));
}

export function replaceQuestions(id: string, questions: Question[]) {
  updateKey<Bank[]>(BANKS, [], (banks) => banks.map((bank) => (bank.id === id ? { ...bank, questions, updatedAt: Date.now() } : bank)));
}

export function getStatsMap(): Record<string, Stats> {
  return readFresh<Record<string, Stats>>(STATS, {});
}

export function myStats(me: Me | null): Stats | null {
  if (!me) return null;
  return getStatsMap()[me.id] ?? emptyStats(me);
}

export function recordSolo(me: Me, result: SoloResult) {
  const today = dayKey();
  updateKey<Record<string, Stats>>(STATS, {}, (map) => {
    const current = map[me.id] ?? emptyStats(me);
    let streak = current.streak;
    if (current.lastDay === today) streak = Math.max(streak, 1);
    else if (current.lastDay === yesterdayKey()) streak += 1;
    else streak = 1;
    return {
      ...map,
      [me.id]: {
        ...current,
        name: me.name,
        avatar: me.avatar,
        quizzes: current.quizzes + 1,
        correct: current.correct + result.correct,
        answered: current.answered + result.total,
        xp: current.xp + result.xp,
        streak,
        lastDay: today,
        perfects: current.perfects + (result.perfect ? 1 : 0),
        fastCorrect: current.fastCorrect + result.fastCorrect,
        history: rememberDay(current.history, result.correct, result.total, result.xp),
      },
    };
  });
}

function codeOf(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

let roomsSnap: { raw: string | null; value: Room[] } | null = null;

export function getRooms(): Room[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(ROOMS);
  if (roomsSnap && roomsSnap.raw === raw) return roomsSnap.value;
  const cutoff = Date.now() - 1000 * 60 * 60 * 18;
  let parsed: Room[] = [];
  try {
    parsed = raw ? (JSON.parse(raw) as Room[]) : [];
  } catch {
    parsed = [];
  }
  const value = (Array.isArray(parsed) ? parsed : [])
    .filter((room): room is Room => Boolean(room && typeof room === 'object' && room.id && room.createdAt > cutoff))
    .map((room) => ({
      ...room,
      players: Array.isArray(room.players) ? room.players : [],
      questions: Array.isArray(room.questions) ? room.questions : [],
      answers: room.answers && typeof room.answers === 'object' ? room.answers : {},
    }));
  roomsSnap = { raw, value };
  return value;
}

export function getRoom(code: string): Room | undefined {
  if (!code) return undefined;
  const clean = code.toLowerCase();
  return getRooms().find((room) => room?.code && room.code.toLowerCase() === clean);
}

export function syncRoomToServer(room: Room) {
  if (typeof window === 'undefined') return;
  fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(room),
  }).catch(() => {});
}

export async function fetchRoomFromServer(code: string): Promise<Room | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(`${API_BASE}/rooms/${code.toLowerCase()}`);
    if (res.ok) {
      const room = (await res.json()) as Room;
      if (room && room.code) {
        const local = getRoom(code);
        if (!local || (room.updatedAt || 0) >= (local.updatedAt || 0)) {
          updateKey<Room[]>(ROOMS, [], (rooms) => {
            const rest = rooms.filter((r) => r.id !== room.id && r.createdAt > Date.now() - 1000 * 60 * 60 * 18);
            return [room, ...rest];
          });
          return room;
        }
        return local;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function putRoom(next: Room) {
  const withTime: Room = { ...next, updatedAt: Date.now() };
  updateKey<Room[]>(ROOMS, [], (rooms) => {
    const rest = rooms.filter((room) => room.id !== withTime.id && room.createdAt > Date.now() - 1000 * 60 * 60 * 18);
    return [withTime, ...rest];
  });
  syncRoomToServer(withTime);
}

export function createRoom(me: Me, bank: Bank, count: number, order: OrderMode, seconds: number): Room {
  let questions = (bank.questions ?? []).map((question) => cleanQuestion(question)).filter((question): question is Question => question !== null);
  if (order === 'mixed') questions = shuffle(questions);
  questions = questions.slice(0, Math.max(1, Math.min(count, questions.length)));
  const player: RoomPlayer = { id: me.id, name: me.name, avatar: me.avatar };
  const room: Room = {
    id: uid('room'),
    code: codeOf(),
    hostId: me.id,
    bankId: bank.id,
    bankName: bank.name,
    order,
    seconds,
    status: 'lobby',
    questions,
    players: [{ ...player, ready: false }],
    index: 0,
    countdownAt: null,
    questionStartedAt: null,
    answers: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    rewardsGiven: false,
  };
  putRoom(room);
  return room;
}

export function joinRoom(me: Me, code: string): { room?: Room; error?: string } {
  const existing = getRoom(code);
  if (!existing) return { error: 'Xona topilmadi. Kodni tekshiring.' };
  const players = existing.players ?? [];
  if (existing.status !== 'lobby' && existing.status !== 'countdown') return { room: existing, error: players.some((player) => player.id === me.id) ? undefined : 'Bu xona allaqachon boshlangan.' };
  if (players.some((player) => player.id === me.id)) return { room: existing };
  const room: Room = { ...existing, status: 'lobby', countdownAt: null, players: [...players, { id: me.id, name: me.name, avatar: me.avatar, ready: false }], updatedAt: Date.now() };
  putRoom(room);
  return { room };
}

export function leaveRoom(meId: string, code: string) {
  const existing = getRoom(code);
  if (!existing || (existing.status !== 'lobby' && existing.status !== 'countdown')) return;
  const players = (existing.players ?? []).filter((player) => player.id !== meId);
  if (!players.length) {
    updateKey<Room[]>(ROOMS, [], (rooms) => rooms.filter((room) => room.code !== existing.code));
    return;
  }
  const allReady = players.every((player) => player.ready);
  putRoom({
    ...existing,
    players,
    hostId: existing.hostId === meId ? players[0]!.id : existing.hostId,
    status: allReady && existing.status === 'countdown' ? 'countdown' : 'lobby',
    countdownAt: allReady && existing.status === 'countdown' ? existing.countdownAt : null,
    updatedAt: Date.now(),
  });
}

export function setPlayerReady(userId: string, code: string) {
  const existing = getRoom(code);
  if (!existing) return;
  if (existing.status !== 'lobby' && existing.status !== 'countdown') return;
  const players = (existing.players ?? []).map((player) =>
    player.id === userId ? { ...player, ready: !player.ready } : player
  );
  const allReady = players.length > 0 && players.every((player) => player.ready);
  const updated: Room = {
    ...existing,
    players,
    status: allReady ? 'countdown' : 'lobby',
    countdownAt: allReady ? (existing.countdownAt || Date.now()) : null,
    updatedAt: Date.now(),
  };
  putRoom(updated);
}

export function beginLive(code: string) {
  const existing = getRoom(code);
  if (!existing || existing.status !== 'countdown' || !existing.countdownAt) return;
  if (Date.now() - existing.countdownAt < 5000) return;
  putRoom({ ...existing, status: 'live', index: 0, questionStartedAt: Date.now(), updatedAt: Date.now() });
}

export function startRoom(meId: string, code: string): string | null {
  const existing = getRoom(code);
  if (!existing) return 'Xona topilmadi';
  if (existing.hostId !== meId) return 'Faqat xona egasi boshlay oladi';
  if (!(existing.questions ?? []).length) return 'Savollar yo‘q';
  putRoom({ ...existing, status: 'live', index: 0, questionStartedAt: Date.now() });
  return null;
}

export function answerRoom(meId: string, code: string, picks: number[]) {
  const existing = getRoom(code);
  if (!existing || existing.status !== 'live') return;
  const key = String(existing.index);
  const answers = existing.answers ?? {};
  if (answers[meId]?.[key]) return;
  const question = (existing.questions ?? [])[existing.index];
  if (!question) return;
  const correct = isCorrectPick(question, picks);
  const firstCorrect =
    correct &&
    !Object.values(answers).some((byQuestion) => (byQuestion?.[key]?.points ?? 0) >= 10);
  const points = correct ? (firstCorrect ? 25 : 10) : 0;
  const userAnswers = answers[meId] ?? {};
  putRoom({
    ...existing,
    answers: {
      ...answers,
      [meId]: { ...userAnswers, [key]: { picks, points } },
    },
  });
}

export function tryAdvance(code: string) {
  const existing = getRoom(code);
  if (!existing || existing.status !== 'live') return;

  // Faqat vaqt to‘liq tugaganda avtomatik keyingi savolga o‘tadi!
  // Foydalanuvchilar javob berganida, javob rangini (yashil/qizil) ko‘rib,
  // "Keyingi savol" tugmasini bosgandan keyingina keyingisiga o‘tishi kerak.
  const isTimeExpired =
    existing.seconds > 0 &&
    existing.questionStartedAt &&
    Date.now() - existing.questionStartedAt >= existing.seconds * 1000;

  if (!isTimeExpired) return;

  const nextIndex = existing.index + 1;
  if (nextIndex >= (existing.questions ?? []).length) {
    putRoom({ ...existing, status: 'done', index: (existing.questions ?? []).length, updatedAt: Date.now() });
    return;
  }
  putRoom({ ...existing, index: nextIndex, questionStartedAt: Date.now(), updatedAt: Date.now() });
}

export function forceNext(meId: string, code: string) {
  const existing = getRoom(code);
  if (!existing || existing.status !== 'live') return;
  const nextIndex = existing.index + 1;
  if (nextIndex >= (existing.questions ?? []).length) {
    putRoom({ ...existing, status: 'done', index: (existing.questions ?? []).length, updatedAt: Date.now() });
  } else {
    putRoom({ ...existing, index: nextIndex, questionStartedAt: Date.now(), updatedAt: Date.now() });
  }
}

export function playerScore(room: Room, userId: string): number {
  if (!room || !userId) return 0;
  const answers = room.answers ?? {};
  const mine = answers[userId] ?? {};
  return Object.values(mine).reduce((sum, answer) => sum + (answer?.points ?? 0), 0);
}

export function claimBattle(me: Me, room: Room) {
  if (!room || room.status !== 'done' || !me) return;
  const map = getStatsMap();
  const current = map[me.id] ?? emptyStats(me);
  if (current.claimedRooms.includes(room.id)) return;
  const players = room.players ?? [];
  const ranked = [...players].sort((a, b) => playerScore(room, b?.id || '') - playerScore(room, a?.id || ''));
  const top = playerScore(room, ranked[0]?.id ?? '');
  const won = players.length > 1 && playerScore(room, me.id) === top && top > 0;
  const gained = playerScore(room, me.id) + (won ? 20 : 0);
  const answers = room.answers ?? {};
  const mine = Object.values(answers[me.id] ?? {});
  const answered = mine.length;
  const correct = mine.filter((answer) => (answer?.points ?? 0) > 0).length;
  updateKey<Record<string, Stats>>(STATS, {}, (latest) => {
    const stats = latest[me.id] ?? current;
    if (stats.claimedRooms.includes(room.id)) return latest;
    return {
      ...latest,
      [me.id]: {
        ...stats,
        name: me.name,
        avatar: me.avatar,
        xp: (stats.xp ?? 0) + gained,
        battlePlayed: (stats.battlePlayed ?? 0) + 1,
        battleWins: (stats.battleWins ?? 0) + (won ? 1 : 0),
        claimedRooms: [...(stats.claimedRooms ?? []), room.id],
        history: rememberDay(stats.history, correct, answered, gained),
      },
    };
  });
}

let invitesSnap: { raw: string | null; value: Invite[] } | null = null;

export function getInvites(): Invite[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(INVITES);
  if (invitesSnap && invitesSnap.raw === raw) return invitesSnap.value;
  const cutoff = Date.now() - 1000 * 60 * 60 * 2;
  let parsed: Invite[] = [];
  try {
    parsed = raw ? (JSON.parse(raw) as Invite[]) : [];
  } catch {
    parsed = [];
  }
  const value = parsed.filter((invite) => invite.createdAt > cutoff);
  invitesSnap = { raw, value };
  return value;
}

export async function fetchInvites(): Promise<Invite[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch(`${API_BASE}/invites`);
    if (res.ok) {
      const list = (await res.json()) as Invite[];
      if (Array.isArray(list)) {
        writeKey(INVITES, list);
        invitesSnap = null;
        return list;
      }
    }
  } catch {}
  return getInvites();
}

export function sendInvite(from: Me, to: PresenceUser, room: Room) {
  if (from.id === to.id) return;
  const invite: Invite = {
    id: uid('inv'),
    fromId: from.id,
    fromName: from.name,
    toId: to.id,
    toName: to.name,
    roomCode: room.code,
    bankName: room.bankName,
    status: 'pending',
    createdAt: Date.now(),
  };
  updateKey<Invite[]>(INVITES, [], (invites) => [invite, ...invites.filter((item) => !(item.toId === to.id && item.roomCode === room.code && item.status === 'pending'))].slice(0, 40));
  if (typeof window !== 'undefined') {
    fetch(`${API_BASE}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', invite }),
    }).catch(() => {});

    // If invited user is a bot, simulate accept & join
    if (to.id.startsWith('user-seed-')) {
      setTimeout(() => {
        respondInvite(invite.id, 'accepted');
        const currentRoom = getRoom(room.code);
        if (currentRoom && (currentRoom.status === 'lobby' || currentRoom.status === 'countdown')) {
          const players = currentRoom.players ?? [];
          if (!players.some((p) => p.id === to.id)) {
            const updated = {
              ...currentRoom,
              players: [...players, { id: to.id, name: to.name, avatar: to.avatar, ready: false }],
              updatedAt: Date.now(),
            };
            putRoom(updated);
            setTimeout(() => {
              setPlayerReady(to.id, room.code);
            }, 1200);
          }
        }
      }, 1000);
    }
  }
}

export function respondInvite(id: string, status: 'accepted' | 'rejected') {
  updateKey<Invite[]>(INVITES, [], (invites) => invites.map((invite) => (invite.id === id ? { ...invite, status } : invite)));
  if (typeof window !== 'undefined') {
    fetch(`${API_BASE}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'respond', id, status }),
    }).catch(() => {});
  }
}

export function roomLink(code: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${window.location.origin}${base}/battle/${code}`;
}

export function sendBattleReaction(roomCode: string, user: Me, emoji: string): BattleReaction {
  const reaction: BattleReaction = {
    id: uid('rx'),
    roomCode,
    userId: user.id,
    userName: user.name,
    emoji,
    createdAt: Date.now(),
  };
  const key = `medquiz-reaction-${roomCode}`;
  writeKey(key, reaction);
  // Also dispatch a custom window event for instant local pickup
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('medquiz-battle-reaction', { detail: reaction }));
    fetch(`${API_BASE}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reaction),
    }).catch(() => {});
  }
  return reaction;
}

// ----------------------------------------------------
// Social & Friends System
// ----------------------------------------------------
const FRIENDS = 'medquiz-v2-friends';
const SCHEDULES = 'medquiz-v2-schedules';
const PUBLIC_USERS = 'medquiz-v2-public-users';

export function getPublicUsers(): PublicUser[] {
  return readFresh<PublicUser[]>(PUBLIC_USERS, []);
}

export async function fetchPublicUsers(): Promise<PublicUser[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch(`${API_BASE}/users`);
    if (res.ok) {
      const users = (await res.json()) as PublicUser[];
      if (Array.isArray(users)) {
        writeKey(PUBLIC_USERS, users);
        window.dispatchEvent(new Event('medquiz-presence'));
        return users;
      }
    }
  } catch {}
  return getPublicUsers();
}

export function getFriendships(): FriendRequest[] {
  return readFresh<FriendRequest[]>(FRIENDS, []);
}

export async function fetchFriendships(): Promise<FriendRequest[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch(`${API_BASE}/friends`);
    if (res.ok) {
      const list = (await res.json()) as FriendRequest[];
      if (Array.isArray(list)) {
        writeKey(FRIENDS, list);
        return list;
      }
    }
  } catch {}
  return getFriendships();
}

export function sendFriendRequest(from: Me, toId: string) {
  if (from.id === toId) return;
  const now = Date.now();
  const reqObj: FriendRequest = {
    id: uid('fr'),
    fromId: from.id,
    toId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  updateKey<FriendRequest[]>(FRIENDS, [], (list) => {
    const rest = list.filter((f) => !((f.fromId === from.id && f.toId === toId) || (f.fromId === toId && f.toId === from.id)));
    return [reqObj, ...rest];
  });
  if (typeof window !== 'undefined') {
    fetch(`${API_BASE}/friends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', fromId: from.id, toId, id: reqObj.id }),
    }).catch(() => {});
  }
}

export function acceptFriendRequest(fromId: string, toId: string) {
  updateKey<FriendRequest[]>(FRIENDS, [], (list) =>
    list.map((f) =>
      (f.fromId === fromId && f.toId === toId) || (f.fromId === toId && f.toId === fromId)
        ? { ...f, status: 'accepted', updatedAt: Date.now() }
        : f
    )
  );
  if (typeof window !== 'undefined') {
    fetch(`${API_BASE}/friends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', fromId, toId }),
    }).catch(() => {});
  }
}

export function declineFriendRequest(fromId: string, toId: string) {
  updateKey<FriendRequest[]>(FRIENDS, [], (list) =>
    list.map((f) =>
      (f.fromId === fromId && f.toId === toId) || (f.fromId === toId && f.toId === fromId)
        ? { ...f, status: 'declined', updatedAt: Date.now() }
        : f
    )
  );
  if (typeof window !== 'undefined') {
    fetch(`${API_BASE}/friends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decline', fromId, toId }),
    }).catch(() => {});
  }
}

export function removeFriend(user1: string, user2: string) {
  updateKey<FriendRequest[]>(FRIENDS, [], (list) =>
    list.filter((f) => !((f.fromId === user1 && f.toId === user2) || (f.fromId === user2 && f.toId === user1)))
  );
  if (typeof window !== 'undefined') {
    fetch(`${API_BASE}/friends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', fromId: user1, toId: user2 }),
    }).catch(() => {});
  }
}

export function getFriendStatus(
  myId: string,
  targetId: string,
  friendships = getFriendships()
): 'none' | 'pending_sent' | 'pending_received' | 'friends' {
  if (myId === targetId) return 'none';
  const match = friendships.find(
    (f) => (f.fromId === myId && f.toId === targetId) || (f.fromId === targetId && f.toId === myId)
  );
  if (!match) return 'none';
  if (match.status === 'accepted') return 'friends';
  if (match.status === 'pending') {
    return match.fromId === myId ? 'pending_sent' : 'pending_received';
  }
  return 'none';
}

export function getFriendsCount(userId: string, friendships = getFriendships()): number {
  return friendships.filter(
    (f) => (f.fromId === userId || f.toId === userId) && f.status === 'accepted'
  ).length;
}

export function getFriendsList(
  userId: string,
  allUsers = getPublicUsers(),
  friendships = getFriendships()
): PublicUser[] {
  const friendIds = new Set<string>();
  for (const f of friendships) {
    if (f.status === 'accepted') {
      if (f.fromId === userId) friendIds.add(f.toId);
      if (f.toId === userId) friendIds.add(f.fromId);
    }
  }
  return allUsers.filter((u) => friendIds.has(u.id));
}

// ----------------------------------------------------
// Exam Preparation Calendar & Daily Workout System
// ----------------------------------------------------
export function getBankSchedules(): Record<string, BankExamSchedule> {
  return readFresh<Record<string, BankExamSchedule>>(SCHEDULES, {});
}

export function getBankSchedule(bankId: string): BankExamSchedule | undefined {
  return getBankSchedules()[bankId];
}

export function saveBankSchedule(schedule: BankExamSchedule) {
  updateKey<Record<string, BankExamSchedule>>(SCHEDULES, {}, (map) => ({
    ...map,
    [schedule.bankId]: schedule,
  }));
  if (typeof window !== 'undefined') {
    fetch(`${API_BASE}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    }).catch(() => {});
  }
}

export function setBankExamDate(
  bankId: string,
  examDate: string,
  totalQuestions: number
): BankExamSchedule {
  const existing = getBankSchedule(bankId);
  const now = Date.now();
  const target = new Date(examDate).getTime();
  const daysDiff = Math.max(1, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
  const dailyTarget = Math.max(5, Math.ceil(totalQuestions / daysDiff));

  // Build daily workout slots
  const workouts: Record<string, DailyWorkout> = { ...(existing?.workouts || {}) };
  const cursor = new Date();
  for (let i = 0; i <= daysDiff; i++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() + i);
    const key = dayKey(d);
    if (!workouts[key]) {
      workouts[key] = {
        date: key,
        questionCount: dailyTarget,
        completed: false,
      };
    }
  }

  const schedule: BankExamSchedule = {
    bankId,
    examDate,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    workouts,
  };

  saveBankSchedule(schedule);
  return schedule;
}

export function recordDailyWorkoutProgress(
  bankId: string,
  count: number,
  accuracy: number
) {
  const schedule = getBankSchedule(bankId);
  if (!schedule) return;
  const today = dayKey();
  const existingWorkout = schedule.workouts[today];
  const updatedWorkout: DailyWorkout = {
    date: today,
    questionCount: count,
    completed: true,
    accuracy,
    completedAt: Date.now(),
  };

  const updatedSchedule: BankExamSchedule = {
    ...schedule,
    updatedAt: Date.now(),
    workouts: {
      ...schedule.workouts,
      [today]: updatedWorkout,
    },
  };

  saveBankSchedule(updatedSchedule);
}

let mistakesSnap: { raw: string | null; value: MistakeItem[] } | null = null;

export function getMistakes(): MistakeItem[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(MISTAKES);
  if (mistakesSnap && mistakesSnap.raw === raw) return mistakesSnap.value;
  let parsed: MistakeItem[] = [];
  try {
    parsed = raw ? (JSON.parse(raw) as MistakeItem[]) : [];
  } catch {
    parsed = [];
  }
  const value = (Array.isArray(parsed) ? parsed : []).filter(
    (m): m is MistakeItem => Boolean(m && typeof m === 'object' && m.id && m.prompt)
  );
  mistakesSnap = { raw, value };
  return value;
}

export function recordMistake(
  bankId: string,
  bankName: string,
  question: Question,
  pickedIndices: number[],
  saved = false
) {
  updateKey<MistakeItem[]>(MISTAKES, [], (list) => {
    const safeList = Array.isArray(list) ? list : [];
    const existingIndex = safeList.findIndex((m) => m.questionId === question.id);
    const item: MistakeItem = {
      id: existingIndex >= 0 ? safeList[existingIndex].id : uid('mistake'),
      questionId: question.id,
      bankId,
      bankName: bankName || 'Fan',
      prompt: question.prompt,
      options: question.options,
      image: question.image,
      pickedIndices,
      timestamp: Date.now(),
      saved: existingIndex >= 0 ? (saved || safeList[existingIndex].saved) : saved,
    };
    if (existingIndex >= 0) {
      const copy = [...safeList];
      copy[existingIndex] = item;
      return copy;
    }
    return [item, ...safeList];
  });
}

export function toggleSaveQuestion(
  question: Question,
  bankId: string,
  bankName: string,
  pickedIndices: number[] = []
): boolean {
  let isSavedNow = false;
  updateKey<MistakeItem[]>(MISTAKES, [], (list) => {
    const safeList = Array.isArray(list) ? list : [];
    const existingIndex = safeList.findIndex((m) => m.questionId === question.id);
    if (existingIndex >= 0) {
      isSavedNow = !safeList[existingIndex].saved;
      const copy = [...safeList];
      copy[existingIndex] = { ...safeList[existingIndex], saved: isSavedNow, timestamp: Date.now() };
      return copy;
    }
    isSavedNow = true;
    const newItem: MistakeItem = {
      id: uid('saved'),
      questionId: question.id,
      bankId,
      bankName: bankName || 'Fan',
      prompt: question.prompt,
      options: question.options,
      image: question.image,
      pickedIndices,
      timestamp: Date.now(),
      saved: true,
    };
    return [newItem, ...safeList];
  });
  return isSavedNow;
}

export function removeMistake(id: string) {
  updateKey<MistakeItem[]>(MISTAKES, [], (list) =>
    (Array.isArray(list) ? list : []).filter((m) => m.id !== id)
  );
}

export function clearMistakesForBank(bankId?: string) {
  updateKey<MistakeItem[]>(MISTAKES, [], (list) =>
    bankId
      ? (Array.isArray(list) ? list : []).filter((m) => m.bankId !== bankId)
      : []
  );
}

// --- Group Battle Chat ---
export async function sendChatMessage(roomCode: string, me: Me, text: string): Promise<BattleChatMessage | null> {
  const clean = text.trim();
  if (!clean || !roomCode) return null;
  const msg: BattleChatMessage = {
    id: uid('chat'),
    roomCode: roomCode.toLowerCase(),
    userId: me.id,
    userName: me.name,
    userAvatar: me.avatar,
    text: clean,
    createdAt: Date.now(),
  };

  // Local broadcast for instant same-browser tabs
  try {
    const key = `medquiz-chat-${roomCode.toLowerCase()}`;
    const raw = window.localStorage.getItem(key);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [...(Array.isArray(existing) ? existing : []).slice(-50), msg];
    window.localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('medquiz-battle-chat', { detail: msg }));
  } catch {}

  // Sync to server for remote peers
  try {
    await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
  } catch {}

  return msg;
}

export async function fetchChatMessages(roomCode: string, since: number = 0): Promise<BattleChatMessage[]> {
  try {
    const res = await fetch(`${API_BASE}/chat/${roomCode.toLowerCase()}?since=${since}`);
    if (res.ok) {
      return (await res.json()) as BattleChatMessage[];
    }
  } catch {}
  return [];
}

// --- Group Battle WebRTC Voice Chat ---
export async function webrtcJoinVoice(
  roomCode: string,
  peerId: string,
  userName: string,
  userAvatar: string | null,
  isMuted: boolean
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/webrtc/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: roomCode.toLowerCase(), peerId, userName, userAvatar, isMuted, isSpeaking: false }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function webrtcLeaveVoice(roomCode: string, peerId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/webrtc/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: roomCode.toLowerCase(), peerId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function webrtcHeartbeat(
  roomCode: string,
  peerId: string,
  isMuted: boolean,
  isSpeaking: boolean
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/webrtc/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: roomCode.toLowerCase(), peerId, isMuted, isSpeaking }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function webrtcFetchPeers(roomCode: string): Promise<VoicePeer[]> {
  try {
    const res = await fetch(`${API_BASE}/webrtc/peers/${roomCode.toLowerCase()}`);
    if (res.ok) {
      return (await res.json()) as VoicePeer[];
    }
  } catch {}
  return [];
}

export async function webrtcSendSignal(signal: Omit<WebRTCSignal, 'id' | 'createdAt'>): Promise<boolean> {
  const fullSignal: WebRTCSignal = {
    ...signal,
    id: uid('sig'),
    roomCode: signal.roomCode.toLowerCase(),
    createdAt: Date.now(),
  };

  // Broadcast locally for instant local tab WebRTC connections
  try {
    window.dispatchEvent(new CustomEvent('medquiz-webrtc-signal', { detail: fullSignal }));
  } catch {}

  try {
    const res = await fetch(`${API_BASE}/webrtc/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullSignal),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function webrtcFetchSignals(roomCode: string, peerId: string, since: number = 0): Promise<WebRTCSignal[]> {
  try {
    const res = await fetch(
      `${API_BASE}/webrtc/signals/${roomCode.toLowerCase()}?peerId=${encodeURIComponent(peerId)}&since=${since}`
    );
    if (res.ok) {
      return (await res.json()) as WebRTCSignal[];
    }
  } catch {}
  return [];
}


