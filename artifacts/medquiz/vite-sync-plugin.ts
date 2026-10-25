import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

interface Room {
  id: string;
  code: string;
  hostId: string;
  bankName: string;
  order: string;
  seconds: number;
  status: string;
  questions: any[];
  players: any[];
  index: number;
  countdownAt: number | null;
  questionStartedAt: number | null;
  answers: Record<string, any>;
  createdAt: number;
  updatedAt?: number;
  rewardsGiven: boolean;
}

interface Reaction {
  id: string;
  roomCode: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: number;
}

interface User {
  id: string;
  username: string;
  name: string;
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
}

interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
  updatedAt?: number;
}

interface SyncInvite {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  roomCode: string;
  bankName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

interface ExamSchedule {
  bankId: string;
  examDate: string;
  createdAt: number;
  updatedAt: number;
  workouts: Record<string, any>;
}

interface BattleChatMessage {
  id: string;
  roomCode: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  text: string;
  createdAt: number;
}

interface WebRTCSignal {
  id: string;
  roomCode: string;
  fromPeerId: string;
  toPeerId: string;
  type: 'offer' | 'answer' | 'candidate';
  data: any;
  createdAt: number;
}

interface VoicePeer {
  peerId: string;
  roomCode: string;
  userName: string;
  userAvatar: string | null;
  isMuted: boolean;
  isSpeaking: boolean;
  lastSeen: number;
}

export function medquizSyncPlugin(): Plugin {
  const roomsFile = path.resolve(import.meta.dirname, '.sync-rooms.json');
  const usersFile = path.resolve(import.meta.dirname, '.sync-users.json');
  const friendsFile = path.resolve(import.meta.dirname, '.sync-friends.json');
  const schedulesFile = path.resolve(import.meta.dirname, '.sync-schedules.json');
  const invitesFile = path.resolve(import.meta.dirname, '.sync-invites.json');

  const roomsMap = new Map<string, Room>();
  const usersMap = new Map<string, User>();
  const friendsList: FriendRequest[] = [];
  const reactionsList: Reaction[] = [];
  const schedulesMap = new Map<string, ExamSchedule>();
  const invitesList: SyncInvite[] = [];
  const chatList: BattleChatMessage[] = [];
  const signalsList: WebRTCSignal[] = [];
  const voicePeersList: VoicePeer[] = [];

  // Default seed medical peers
  const seedUsers: User[] = [
    {
      id: 'user-seed-1',
      username: 'madina_pharma',
      name: 'Madina Rahimova',
      avatar: null,
      university: 'Toshkent Tibbiyot Akademiyasi (TTA)',
      course: '5-kurs',
      faculty: 'Farmatsevtika',
      bio: 'Magistr talabasi · Klinik farmatsevtika va yangi dori vositalari tahlili',
      xp: 1450,
      quizzes: 28,
      battleWins: 9,
      streak: 6,
      seen: Date.now() - 1000 * 30,
    },
    {
      id: 'user-seed-2',
      username: 'shaxzod_neuro',
      name: 'Shaxzod Aliyev',
      avatar: null,
      university: 'Samarqand Davlat Tibbiyot Universiteti',
      course: 'Doktorantura (PhD)',
      faculty: 'Neyroxirurgiya',
      bio: 'Doktorant · Neyroanatomiya va mikroxirurgiya bo‘yicha izlanuvchi',
      xp: 4200,
      quizzes: 62,
      battleWins: 24,
      streak: 15,
      seen: Date.now() - 1000 * 15,
    },
    {
      id: 'user-seed-3',
      username: 'laylo_pediatr',
      name: 'Laylo Karimova',
      avatar: null,
      university: 'Toshkent Pediatriya Tibbiyot Instituti',
      course: '3-kurs',
      faculty: 'Pediatriya',
      bio: 'Bo‘lajak pediatr · Bolalar fiziologiyasi va kardiologiyasi shaydosi',
      xp: 850,
      quizzes: 18,
      battleWins: 4,
      streak: 3,
      seen: Date.now() - 1000 * 45,
    },
    {
      id: 'user-seed-4',
      username: 'jasur_cardio',
      name: 'Dr. Jasur Mansurov',
      avatar: null,
      university: 'Respublika Kardiologiya Markazi',
      course: 'Katta ilmiy xodim',
      faculty: 'Kardiologiya',
      bio: 'Fan doktori (DSc) · Invaziv kardiologiya va EKG diagnostikasi mutaxassisi',
      xp: 7800,
      quizzes: 95,
      battleWins: 41,
      streak: 22,
      seen: Date.now() - 1000 * 60,
    },
    {
      id: 'user-seed-5',
      username: 'anvar_surgeon',
      name: 'Anvar Boboyev',
      avatar: null,
      university: 'Andijon Davlat Tibbiyot Instituti',
      course: '4-kurs',
      faculty: 'Davolash ishi',
      bio: 'Topografik anatomiya va operativ xirurgiya ixlosmandi',
      xp: 1200,
      quizzes: 24,
      battleWins: 7,
      streak: 5,
      seen: Date.now() - 1000 * 120,
    },
  ];

  for (const u of seedUsers) {
    usersMap.set(u.id, u);
  }

  // Load from disk if exists
  try {
    if (fs.existsSync(roomsFile)) {
      const raw = fs.readFileSync(roomsFile, 'utf-8');
      const loaded = JSON.parse(raw);
      if (Array.isArray(loaded)) {
        for (const room of loaded) {
          if (room && room.code) {
            roomsMap.set(room.code.toLowerCase(), room);
          }
        }
      }
    }
  } catch {}

  try {
    if (fs.existsSync(usersFile)) {
      const raw = fs.readFileSync(usersFile, 'utf-8');
      const loaded = JSON.parse(raw);
      if (Array.isArray(loaded)) {
        for (const user of loaded) {
          if (user && user.id) usersMap.set(user.id, user);
        }
      }
    }
  } catch {}

  try {
    if (fs.existsSync(friendsFile)) {
      const raw = fs.readFileSync(friendsFile, 'utf-8');
      const loaded = JSON.parse(raw);
      if (Array.isArray(loaded)) {
        friendsList.push(...loaded);
      }
    }
  } catch {}

  try {
    if (fs.existsSync(schedulesFile)) {
      const raw = fs.readFileSync(schedulesFile, 'utf-8');
      const loaded = JSON.parse(raw);
      if (Array.isArray(loaded)) {
        for (const item of loaded) {
          if (item && item.bankId) schedulesMap.set(item.bankId, item);
        }
      }
    }
  } catch {}

  try {
    if (fs.existsSync(invitesFile)) {
      const raw = fs.readFileSync(invitesFile, 'utf-8');
      const loaded = JSON.parse(raw);
      if (Array.isArray(loaded)) {
        invitesList.push(...loaded);
      }
    }
  } catch {}

  const persistRooms = () => {
    try {
      const array = Array.from(roomsMap.values()).slice(-50);
      fs.writeFileSync(roomsFile, JSON.stringify(array), 'utf-8');
    } catch {}
  };

  const persistUsers = () => {
    try {
      const array = Array.from(usersMap.values()).slice(-100);
      fs.writeFileSync(usersFile, JSON.stringify(array), 'utf-8');
    } catch {}
  };

  const persistFriends = () => {
    try {
      fs.writeFileSync(friendsFile, JSON.stringify(friendsList.slice(-200)), 'utf-8');
    } catch {}
  };

  const persistSchedules = () => {
    try {
      const array = Array.from(schedulesMap.values());
      fs.writeFileSync(schedulesFile, JSON.stringify(array), 'utf-8');
    } catch {}
  };

  const persistInvites = () => {
    try {
      fs.writeFileSync(invitesFile, JSON.stringify(invitesList.slice(-100)), 'utf-8');
    } catch {}
  };

  return {
    name: 'medquiz-sync-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // CORS headers so any tunnel or local IP can talk to the API
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (!url.startsWith('/api/')) {
          return next();
        }

        // Helper to read JSON body
        const readBody = (callback: (body: any) => void) => {
          let data = '';
          req.on('data', (chunk) => {
            data += chunk;
          });
          req.on('end', () => {
            try {
              callback(data ? JSON.parse(data) : {});
            } catch {
              callback({});
            }
          });
        };

        // 1. GET /api/rooms
        if (url === '/api/rooms' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          const rooms = Array.from(roomsMap.values()).filter(
            (r) => Date.now() - r.createdAt < 1000 * 60 * 60 * 12
          );
          res.end(JSON.stringify(rooms));
          return;
        }

        // 2. GET /api/rooms/:code
        const roomMatch = url.match(/^\/api\/rooms\/([a-zA-Z0-9]+)$/);
        if (roomMatch && req.method === 'GET') {
          const code = roomMatch[1].toLowerCase();
          const room = roomsMap.get(code);
          res.setHeader('Content-Type', 'application/json');
          if (room) {
            res.end(JSON.stringify(room));
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Xona topilmadi' }));
          }
          return;
        }

        // 3. POST /api/rooms (upsert room)
        if (url === '/api/rooms' && req.method === 'POST') {
          readBody((body: Room) => {
            if (body && body.code) {
              const code = body.code.toLowerCase();
              roomsMap.set(code, body);
              persistRooms();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, room: body }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Noto‘g‘ri ma‘lumot' }));
            }
          });
          return;
        }

        // 4. POST /api/reactions
        if (url === '/api/reactions' && req.method === 'POST') {
          readBody((reaction: Reaction) => {
            if (reaction && reaction.roomCode) {
              reactionsList.push(reaction);
              if (reactionsList.length > 200) {
                reactionsList.splice(0, 50);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Noto‘g‘ri reaksiya' }));
            }
          });
          return;
        }

        // 5. GET /api/reactions/:code?since=123
        const rxMatch = url.match(/^\/api\/reactions\/([a-zA-Z0-9]+)(\?.*)?$/);
        if (rxMatch && req.method === 'GET') {
          const code = rxMatch[1].toLowerCase();
          const query = new URL(url, 'http://localhost').searchParams;
          const since = Number(query.get('since') || '0');
          const matching = reactionsList.filter(
            (r) => r.roomCode.toLowerCase() === code && r.createdAt > since
          );
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(matching));
          return;
        }

        // 6. GET /api/users
        if (url === '/api/users' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(Array.from(usersMap.values())));
          return;
        }

        // 7. POST /api/users (upsert profile)
        if (url === '/api/users' && req.method === 'POST') {
          readBody((body: User) => {
            if (body && body.id) {
              const existing = usersMap.get(body.id);
              const updated: User = {
                ...existing,
                ...body,
                seen: Date.now(),
              };
              usersMap.set(body.id, updated);
              persistUsers();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, user: updated }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Foydalanuvchi ma‘lumoti xato' }));
            }
          });
          return;
        }

        // 8. GET /api/friends
        if (url === '/api/friends' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(friendsList));
          return;
        }

        // 9. POST /api/friends (request, accept, decline, remove)
        if (url === '/api/friends' && req.method === 'POST') {
          readBody((payload: { action: 'request' | 'accept' | 'decline' | 'remove'; fromId: string; toId: string; id?: string }) => {
            const { action, fromId, toId } = payload;
            if (!fromId || !toId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'fromId va toId talab qilinadi' }));
              return;
            }

            if (action === 'request') {
              const existingIdx = friendsList.findIndex(
                (f) => (f.fromId === fromId && f.toId === toId) || (f.fromId === toId && f.toId === fromId)
              );
              const now = Date.now();
              const reqObj: FriendRequest = {
                id: payload.id || `fr-${now}-${Math.random().toString(36).slice(2, 7)}`,
                fromId,
                toId,
                status: 'pending',
                createdAt: now,
                updatedAt: now,
              };
              if (existingIdx !== -1) {
                friendsList[existingIdx] = reqObj;
              } else {
                friendsList.push(reqObj);
              }
              persistFriends();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, request: reqObj }));
              return;
            }

            if (action === 'accept' || action === 'decline') {
              const reqObj = friendsList.find(
                (f) => ((f.fromId === fromId && f.toId === toId) || (f.fromId === toId && f.toId === fromId))
              );
              if (reqObj) {
                reqObj.status = action === 'accept' ? 'accepted' : 'declined';
                reqObj.updatedAt = Date.now();
                persistFriends();
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, request: reqObj }));
              return;
            }

            if (action === 'remove') {
              const idx = friendsList.findIndex(
                (f) => (f.fromId === fromId && f.toId === toId) || (f.fromId === toId && f.toId === fromId)
              );
              if (idx !== -1) {
                friendsList.splice(idx, 1);
                persistFriends();
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
              return;
            }

            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Noma‘lum harakat' }));
          });
          return;
        }

        // 10. GET /api/schedules
        if (url === '/api/schedules' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(Array.from(schedulesMap.values())));
          return;
        }

        // 11. POST /api/schedules
        if (url === '/api/schedules' && req.method === 'POST') {
          readBody((schedule: ExamSchedule) => {
            if (schedule && schedule.bankId) {
              schedulesMap.set(schedule.bankId, schedule);
              persistSchedules();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, schedule }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Jadval ma‘lumoti xato' }));
            }
          });
          return;
        }

        // 12. GET /api/invites
        if (url === '/api/invites' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          const cutoff = Date.now() - 1000 * 60 * 60 * 2;
          const recent = invitesList.filter((inv) => inv.createdAt > cutoff);
          res.end(JSON.stringify(recent));
          return;
        }

        // 13. POST /api/invites
        if (url === '/api/invites' && req.method === 'POST') {
          readBody((payload: { action: 'send' | 'respond'; invite?: SyncInvite; id?: string; status?: 'accepted' | 'rejected' }) => {
            if (payload && payload.action === 'send' && payload.invite) {
              const inv = payload.invite;
              const idx = invitesList.findIndex(
                (existing) => existing.toId === inv.toId && existing.roomCode === inv.roomCode && existing.status === 'pending'
              );
              if (idx !== -1) {
                invitesList[idx] = inv;
              } else {
                invitesList.unshift(inv);
              }
              persistInvites();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, invite: inv }));
              return;
            }
            if (payload && payload.action === 'respond' && payload.id && payload.status) {
              const target = invitesList.find((item) => item.id === payload.id);
              if (target) {
                target.status = payload.status;
                persistInvites();
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Taklif ma‘lumoti noto‘g‘ri' }));
          });
          return;
        }

        // 14. POST /api/chat
        if (url === '/api/chat' && req.method === 'POST') {
          readBody((msg: BattleChatMessage) => {
            if (msg && msg.roomCode && msg.text) {
              chatList.push(msg);
              if (chatList.length > 500) {
                chatList.splice(0, 100);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, message: msg }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Xabar ma‘lumoti xato' }));
            }
          });
          return;
        }

        // 15. GET /api/chat/:code?since=123
        const chatMatch = url.match(/^\/api\/chat\/([a-zA-Z0-9]+)(\?.*)?$/);
        if (chatMatch && req.method === 'GET') {
          const code = chatMatch[1].toLowerCase();
          const query = new URL(url, 'http://localhost').searchParams;
          const since = Number(query.get('since') || '0');
          const matching = chatList.filter(
            (m) => m.roomCode.toLowerCase() === code && m.createdAt > since
          );
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(matching));
          return;
        }

        // 16. POST /api/webrtc/join
        if (url === '/api/webrtc/join' && req.method === 'POST') {
          readBody((peer: VoicePeer) => {
            if (peer && peer.roomCode && peer.peerId) {
              const code = peer.roomCode.toLowerCase();
              const existingIdx = voicePeersList.findIndex(
                (p) => p.roomCode.toLowerCase() === code && p.peerId === peer.peerId
              );
              const updatedPeer: VoicePeer = {
                ...peer,
                roomCode: code,
                lastSeen: Date.now(),
              };
              if (existingIdx !== -1) {
                voicePeersList[existingIdx] = updatedPeer;
              } else {
                voicePeersList.push(updatedPeer);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, peer: updatedPeer }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Peer ma‘lumoti xato' }));
            }
          });
          return;
        }

        // 17. POST /api/webrtc/leave
        if (url === '/api/webrtc/leave' && req.method === 'POST') {
          readBody((body: { roomCode: string; peerId: string }) => {
            if (body && body.roomCode && body.peerId) {
              const code = body.roomCode.toLowerCase();
              const idx = voicePeersList.findIndex(
                (p) => p.roomCode.toLowerCase() === code && p.peerId === body.peerId
              );
              if (idx !== -1) {
                voicePeersList.splice(idx, 1);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Noto‘g‘ri ma‘lumot' }));
            }
          });
          return;
        }

        // 18. POST /api/webrtc/heartbeat
        if (url === '/api/webrtc/heartbeat' && req.method === 'POST') {
          readBody((body: { roomCode: string; peerId: string; isMuted?: boolean; isSpeaking?: boolean }) => {
            if (body && body.roomCode && body.peerId) {
              const code = body.roomCode.toLowerCase();
              const peer = voicePeersList.find(
                (p) => p.roomCode.toLowerCase() === code && p.peerId === body.peerId
              );
              if (peer) {
                peer.lastSeen = Date.now();
                if (typeof body.isMuted === 'boolean') peer.isMuted = body.isMuted;
                if (typeof body.isSpeaking === 'boolean') peer.isSpeaking = body.isSpeaking;
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Noto‘g‘ri heartbeat' }));
            }
          });
          return;
        }

        // 19. GET /api/webrtc/peers/:code
        const peersMatch = url.match(/^\/api\/webrtc\/peers\/([a-zA-Z0-9]+)(\?.*)?$/);
        if (peersMatch && req.method === 'GET') {
          const code = peersMatch[1].toLowerCase();
          const now = Date.now();
          // Prune stale peers older than 15s
          for (let i = voicePeersList.length - 1; i >= 0; i--) {
            if (now - voicePeersList[i].lastSeen > 15000) {
              voicePeersList.splice(i, 1);
            }
          }
          const active = voicePeersList.filter((p) => p.roomCode.toLowerCase() === code);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(active));
          return;
        }

        // 20. POST /api/webrtc/signal
        if (url === '/api/webrtc/signal' && req.method === 'POST') {
          readBody((sig: WebRTCSignal) => {
            if (sig && sig.roomCode && sig.fromPeerId && sig.toPeerId) {
              sig.createdAt = Date.now();
              signalsList.push(sig);
              // Keep last 1000 signals and prune older than 90 seconds
              const now = Date.now();
              if (signalsList.length > 500) {
                for (let i = signalsList.length - 1; i >= 0; i--) {
                  if (now - signalsList[i].createdAt > 90000) {
                    signalsList.splice(i, 1);
                  }
                }
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Signal ma‘lumoti xato' }));
            }
          });
          return;
        }

        // 21. GET /api/webrtc/signals/:code?peerId=xyz&since=123
        const signalsMatch = url.match(/^\/api\/webrtc\/signals\/([a-zA-Z0-9]+)(\?.*)?$/);
        if (signalsMatch && req.method === 'GET') {
          const code = signalsMatch[1].toLowerCase();
          const query = new URL(url, 'http://localhost').searchParams;
          const peerId = query.get('peerId') || '';
          const since = Number(query.get('since') || '0');
          const matching = signalsList.filter(
            (s) =>
              s.roomCode.toLowerCase() === code &&
              s.toPeerId === peerId &&
              s.createdAt > since
          );
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(matching));
          return;
        }

        next();
      });
    },
  };
}
