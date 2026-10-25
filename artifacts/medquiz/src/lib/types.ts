export type OrderMode = 'sequential' | 'mixed';

export type Option = {
  id: string;
  text: string;
  correct: boolean;
};

export type Question = {
  id: string;
  prompt: string;
  options: Option[];
  image: string | null;
};

export type Bank = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  questions: Question[];
};

export type Me = {
  id: string;
  username?: string;
  name: string;
  phone?: string;
  email?: string;
  university: string;
  course: string;
  faculty: string;
  bio?: string;
  avatar: string | null;
};

export type DayStat = {
  correct: number;
  answered: number;
  xp: number;
};

export type Stats = {
  userId: string;
  name: string;
  avatar: string | null;
  quizzes: number;
  correct: number;
  answered: number;
  xp: number;
  streak: number;
  lastDay: string;
  perfects: number;
  fastCorrect: number;
  battleWins: number;
  battlePlayed: number;
  claimedRooms: string[];
  history?: Record<string, DayStat>;
};

export type RoomAnswer = {
  picks: number[];
  points: number;
};

export type RoomPlayer = {
  id: string;
  name: string;
  avatar: string | null;
  ready?: boolean;
};

export type Room = {
  id: string;
  code: string;
  hostId: string;
  bankId?: string;
  bankName: string;
  order: OrderMode;
  seconds: number;
  status: 'lobby' | 'countdown' | 'live' | 'done';
  questions: Question[];
  players: RoomPlayer[];
  index: number;
  countdownAt: number | null;
  questionStartedAt: number | null;
  answers: Record<string, Record<string, RoomAnswer>>;
  createdAt: number;
  updatedAt?: number;
  rewardsGiven: boolean;
};

export type Invite = {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  roomCode: string;
  bankName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
};

export type PresenceUser = {
  id: string;
  name: string;
  avatar: string | null;
  seen: number;
};

export type SoloResult = {
  bankName: string;
  correct: number;
  total: number;
  xp: number;
  fastCorrect: number;
  perfect: boolean;
};

export type MedicalTitle = {
  id: string;
  title: string;
  stage: string;
  minXp: number;
  nextXp: number;
  badge: string;
  icon: string;
  color: string;
};

export type BattleReaction = {
  id: string;
  roomCode: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: number;
};

export type PublicUser = {
  id: string;
  username: string;
  name: string;
  phone?: string;
  email?: string;
  avatar: string | null;
  university: string;
  course: string;
  faculty: string;
  bio?: string;
  xp: number;
  quizzes: number;
  battleWins: number;
  streak: number;
  seen: number;
  friendsCount?: number;
};

export type FriendRequest = {
  id: string;
  fromId: string;
  toId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
  updatedAt?: number;
};

export type DailyWorkout = {
  date: string; // YYYY-MM-DD
  questionCount: number;
  completed: boolean;
  accuracy?: number;
  completedAt?: number;
};

export type BankExamSchedule = {
  bankId: string;
  examDate: string; // YYYY-MM-DD or ISO string
  createdAt: number;
  updatedAt: number;
  workouts: Record<string, DailyWorkout>;
};

export type MistakeItem = {
  id: string;
  questionId: string;
  bankId: string;
  bankName: string;
  prompt: string;
  options: Option[];
  image: string | null;
  pickedIndices: number[];
  timestamp: number;
  saved?: boolean;
};

export type BattleChatMessage = {
  id: string;
  roomCode: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  text: string;
  createdAt: number;
};

export type WebRTCSignal = {
  id: string;
  roomCode: string;
  fromPeerId: string;
  toPeerId: string;
  type: 'offer' | 'answer' | 'candidate';
  data: any;
  createdAt: number;
};

export type VoicePeer = {
  peerId: string;
  roomCode: string;
  userName: string;
  userAvatar: string | null;
  isMuted: boolean;
  isSpeaking: boolean;
  lastSeen: number;
};

export type BlogComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  authorTitle?: string;
  text: string;
  likes: number;
  likedBy: string[];
  createdAt: number;
};

export type BlogPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  authorTitle: string;
  authorUniversity?: string;
  title?: string;
  content: string;
  tags: string[];
  image?: string | null;
  likes: number;
  likedBy: string[];
  savedBy: string[];
  shares: number;
  comments: BlogComment[];
  createdAt: number;
};

export type StoryItem = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  title: string;
  text: string;
  image?: string | null;
  gradient?: string;
  viewsCount: number;
  viewedBy: string[];
  createdAt: number;
};

export type UserSession = {
  id: string;
  userId: string;
  deviceName: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  isCurrent: boolean;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  createdAt: number;
  lastActive: number;
};


