import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '5180', 10);
const HOST = process.env.HOST || '0.0.0.0';
const BASE_PATH = (process.env.BASE_PATH || '/quiz/').replace(/\/+$/, ''); // e.g. "/quiz"
const DIST_DIR = path.resolve(__dirname, 'dist', 'public');

const roomsFile = path.resolve(__dirname, '.sync-rooms.json');
const usersFile = path.resolve(__dirname, '.sync-users.json');
const friendsFile = path.resolve(__dirname, '.sync-friends.json');
const schedulesFile = path.resolve(__dirname, '.sync-schedules.json');
const invitesFile = path.resolve(__dirname, '.sync-invites.json');

const roomsMap = new Map();
const usersMap = new Map();
const friendsList = [];
const reactionsList = [];
const schedulesMap = new Map();
const invitesList = [];
const chatList = [];
const signalsList = [];
const voicePeersList = [];

// Seed users
const seedUsers = [
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

// Load persisted state
try {
  if (fs.existsSync(roomsFile)) {
    const loaded = JSON.parse(fs.readFileSync(roomsFile, 'utf-8'));
    if (Array.isArray(loaded)) {
      for (const room of loaded) {
        if (room && room.code) roomsMap.set(room.code.toLowerCase(), room);
      }
    }
  }
} catch {}

try {
  if (fs.existsSync(usersFile)) {
    const loaded = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    if (Array.isArray(loaded)) {
      for (const u of loaded) {
        if (u && u.id) usersMap.set(u.id, u);
      }
    }
  }
} catch {}

try {
  if (fs.existsSync(friendsFile)) {
    const loaded = JSON.parse(fs.readFileSync(friendsFile, 'utf-8'));
    if (Array.isArray(loaded)) friendsList.push(...loaded);
  }
} catch {}

try {
  if (fs.existsSync(schedulesFile)) {
    const loaded = JSON.parse(fs.readFileSync(schedulesFile, 'utf-8'));
    if (Array.isArray(loaded)) {
      for (const item of loaded) {
        if (item && item.bankId) schedulesMap.set(item.bankId, item);
      }
    }
  }
} catch {}

try {
  if (fs.existsSync(invitesFile)) {
    const loaded = JSON.parse(fs.readFileSync(invitesFile, 'utf-8'));
    if (Array.isArray(loaded)) invitesList.push(...loaded);
  }
} catch {}

const persistRooms = () => {
  try {
    fs.writeFileSync(roomsFile, JSON.stringify(Array.from(roomsMap.values()).slice(-50)), 'utf-8');
  } catch {}
};

const persistUsers = () => {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(Array.from(usersMap.values()).slice(-100)), 'utf-8');
  } catch {}
};

const persistFriends = () => {
  try {
    fs.writeFileSync(friendsFile, JSON.stringify(friendsList.slice(-200)), 'utf-8');
  } catch {}
};

const persistSchedules = () => {
  try {
    fs.writeFileSync(schedulesFile, JSON.stringify(Array.from(schedulesMap.values())), 'utf-8');
  } catch {}
};

const persistInvites = () => {
  try {
    fs.writeFileSync(invitesFile, JSON.stringify(invitesList.slice(-100)), 'utf-8');
  } catch {}
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Handle redirect from BASE_PATH to BASE_PATH/
  if (BASE_PATH && pathname === BASE_PATH) {
    res.statusCode = 301;
    res.setHeader('Location', BASE_PATH + '/' + (parsedUrl.search || ''));
    res.end();
    return;
  }

  // Strip BASE_PATH if present
  let relativePath = pathname;
  if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
    relativePath = pathname.slice(BASE_PATH.length);
  }
  if (!relativePath.startsWith('/')) {
    relativePath = '/' + relativePath;
  }

  // Helper: send JSON
  const sendJson = (status, obj) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
  };

  // Helper: read JSON body
  const readBody = (callback) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) {
        // limit 5MB
        res.statusCode = 413;
        res.end('Payload too large');
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        callback(data ? JSON.parse(data) : {});
      } catch {
        callback({});
      }
    });
  };

  // Health check
  if (relativePath === '/health' || relativePath === '/api/health') {
    return sendJson(200, { status: 'ok', app: 'medquiz', uptime: process.uptime() });
  }

  // --- API ROUTES ---
  if (relativePath.startsWith('/api/')) {
    const apiPath = relativePath;

    // 1. GET /api/rooms
    if (apiPath === '/api/rooms' && req.method === 'GET') {
      const activeRooms = Array.from(roomsMap.values()).filter(
        (r) => Date.now() - r.createdAt < 1000 * 60 * 60 * 12
      );
      return sendJson(200, activeRooms);
    }

    // 2. GET /api/rooms/:code
    const roomMatch = apiPath.match(/^\/api\/rooms\/([a-zA-Z0-9]+)$/);
    if (roomMatch && req.method === 'GET') {
      const code = roomMatch[1].toLowerCase();
      const room = roomsMap.get(code);
      if (room) {
        return sendJson(200, room);
      }
      return sendJson(404, { error: 'Xona topilmadi' });
    }

    // 3. POST /api/rooms
    if (apiPath === '/api/rooms' && req.method === 'POST') {
      return readBody((body) => {
        if (body && body.code) {
          const code = body.code.toLowerCase();
          roomsMap.set(code, body);
          persistRooms();
          return sendJson(200, { ok: true, room: body });
        }
        return sendJson(400, { error: 'Noto‘g‘ri ma‘lumot' });
      });
    }

    // 4. POST /api/reactions
    if (apiPath === '/api/reactions' && req.method === 'POST') {
      return readBody((reaction) => {
        if (reaction && reaction.roomCode) {
          reactionsList.push(reaction);
          if (reactionsList.length > 200) reactionsList.splice(0, 50);
          return sendJson(200, { ok: true });
        }
        return sendJson(400, { error: 'Noto‘g‘ri reaksiya' });
      });
    }

    // 5. GET /api/reactions/:code?since=123
    const rxMatch = apiPath.match(/^\/api\/reactions\/([a-zA-Z0-9]+)$/);
    if (rxMatch && req.method === 'GET') {
      const code = rxMatch[1].toLowerCase();
      const since = Number(parsedUrl.searchParams.get('since') || '0');
      const matching = reactionsList.filter(
        (r) => r.roomCode.toLowerCase() === code && r.createdAt > since
      );
      return sendJson(200, matching);
    }

    // 6. GET /api/users
    if (apiPath === '/api/users' && req.method === 'GET') {
      return sendJson(200, Array.from(usersMap.values()));
    }

    // 7. POST /api/users
    if (apiPath === '/api/users' && req.method === 'POST') {
      return readBody((body) => {
        if (body && body.id) {
          const existing = usersMap.get(body.id);
          const updated = {
            ...existing,
            ...body,
            seen: Date.now(),
          };
          usersMap.set(body.id, updated);
          persistUsers();
          return sendJson(200, { ok: true, user: updated });
        }
        return sendJson(400, { error: 'Foydalanuvchi ma‘lumoti xato' });
      });
    }

    // 7.1 POST /api/auth/telegram-sync
    if (apiPath === '/api/auth/telegram-sync' && req.method === 'POST') {
      return readBody((body) => {
        if (!body || !body.telegramId) {
          return sendJson(400, { ok: false, error: 'Telegram ID talab qilinadi' });
        }

        const tgIdStr = String(body.telegramId);
        let foundUser = null;
        for (const user of usersMap.values()) {
          if (String(user.telegramId) === tgIdStr || String(user.id) === `tg-${tgIdStr}`) {
            foundUser = user;
            break;
          }
        }

        if (!foundUser && body.username) {
          const normUsername = String(body.username).toLowerCase().replace(/^@/, '');
          for (const user of usersMap.values()) {
            if (user.username && user.username.toLowerCase() === normUsername) {
              foundUser = user;
              break;
            }
          }
        }

        if (foundUser) {
          const updated = {
            ...foundUser,
            telegramId: tgIdStr,
            termsAgreed: true,
            termsAgreedAt: foundUser.termsAgreedAt || Date.now(),
            seen: Date.now(),
          };
          if (body.photoUrl && !updated.avatar) updated.avatar = body.photoUrl;
          if (body.phone && !updated.phone) updated.phone = body.phone;
          usersMap.set(updated.id, updated);
          persistUsers();
          return sendJson(200, {
            ok: true,
            user: updated,
            needsContact: !updated.phone,
          });
        }

        const newUser = {
          id: `tg-${tgIdStr}`,
          telegramId: tgIdStr,
          name: `${body.firstName || ''} ${body.lastName || ''}`.trim() || `Talaba ${tgIdStr.slice(-4)}`,
          username: body.username ? String(body.username).toLowerCase() : `user_${tgIdStr}`,
          phone: body.phone || '',
          avatar: body.photoUrl || null,
          role: 'Talaba',
          rating: 1000,
          xp: 50,
          coins: 20,
          streak: 1,
          streakFreezes: 1,
          termsAgreed: true,
          termsAgreedAt: Date.now(),
          seen: Date.now(),
        };

        usersMap.set(newUser.id, newUser);
        persistUsers();
        return sendJson(200, {
          ok: true,
          user: newUser,
          needsContact: !newUser.phone,
        });
      });
    }

    // 8. GET /api/friends
    if (apiPath === '/api/friends' && req.method === 'GET') {
      return sendJson(200, friendsList);
    }

    // 9. POST /api/friends
    if (apiPath === '/api/friends' && req.method === 'POST') {
      return readBody((payload) => {
        const { action, fromId, toId } = payload || {};
        if (!fromId || !toId) {
          return sendJson(400, { error: 'fromId va toId talab qilinadi' });
        }
        const now = Date.now();
        if (action === 'request') {
          const idx = friendsList.findIndex(
            (f) => (f.fromId === fromId && f.toId === toId) || (f.fromId === toId && f.toId === fromId)
          );
          const reqObj = {
            id: payload.id || `fr-${now}-${Math.random().toString(36).slice(2, 7)}`,
            fromId,
            toId,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          };
          if (idx !== -1) friendsList[idx] = reqObj;
          else friendsList.push(reqObj);
          persistFriends();
          return sendJson(200, { ok: true, request: reqObj });
        }
        if (action === 'accept' || action === 'decline') {
          const reqObj = friendsList.find(
            (f) => (f.fromId === fromId && f.toId === toId) || (f.fromId === toId && f.toId === fromId)
          );
          if (reqObj) {
            reqObj.status = action === 'accept' ? 'accepted' : 'declined';
            reqObj.updatedAt = now;
            persistFriends();
          }
          return sendJson(200, { ok: true, request: reqObj });
        }
        if (action === 'remove') {
          const idx = friendsList.findIndex(
            (f) => (f.fromId === fromId && f.toId === toId) || (f.fromId === toId && f.toId === fromId)
          );
          if (idx !== -1) {
            friendsList.splice(idx, 1);
            persistFriends();
          }
          return sendJson(200, { ok: true });
        }
        return sendJson(400, { error: 'Noma‘lum harakat' });
      });
    }

    // 10. GET /api/schedules
    if (apiPath === '/api/schedules' && req.method === 'GET') {
      return sendJson(200, Array.from(schedulesMap.values()));
    }

    // 11. POST /api/schedules
    if (apiPath === '/api/schedules' && req.method === 'POST') {
      return readBody((schedule) => {
        if (schedule && schedule.bankId) {
          schedulesMap.set(schedule.bankId, schedule);
          persistSchedules();
          return sendJson(200, { ok: true, schedule });
        }
        return sendJson(400, { error: 'Jadval ma‘lumoti xato' });
      });
    }

    // 12. GET /api/invites
    if (apiPath === '/api/invites' && req.method === 'GET') {
      const cutoff = Date.now() - 1000 * 60 * 60 * 2;
      return sendJson(200, invitesList.filter((inv) => inv.createdAt > cutoff));
    }

    // 13. POST /api/invites
    if (apiPath === '/api/invites' && req.method === 'POST') {
      return readBody((payload) => {
        if (payload && payload.action === 'send' && payload.invite) {
          const inv = payload.invite;
          const idx = invitesList.findIndex(
            (item) => item.toId === inv.toId && item.roomCode === inv.roomCode && item.status === 'pending'
          );
          if (idx !== -1) invitesList[idx] = inv;
          else invitesList.unshift(inv);
          persistInvites();
          return sendJson(200, { ok: true, invite: inv });
        }
        if (payload && payload.action === 'respond' && payload.id && payload.status) {
          const target = invitesList.find((item) => item.id === payload.id);
          if (target) {
            target.status = payload.status;
            persistInvites();
          }
          return sendJson(200, { ok: true });
        }
        return sendJson(400, { error: 'Taklif ma‘lumoti noto‘g‘ri' });
      });
    }

    // 14. POST /api/chat
    if (apiPath === '/api/chat' && req.method === 'POST') {
      return readBody((msg) => {
        if (msg && msg.roomCode && msg.text) {
          chatList.push(msg);
          if (chatList.length > 500) chatList.splice(0, 100);
          return sendJson(200, { ok: true, message: msg });
        }
        return sendJson(400, { error: 'Xabar ma‘lumoti xato' });
      });
    }

    // 15. GET /api/chat/:code?since=123
    const chatMatch = apiPath.match(/^\/api\/chat\/([a-zA-Z0-9]+)$/);
    if (chatMatch && req.method === 'GET') {
      const code = chatMatch[1].toLowerCase();
      const since = Number(parsedUrl.searchParams.get('since') || '0');
      const matching = chatList.filter((m) => m.roomCode.toLowerCase() === code && m.createdAt > since);
      return sendJson(200, matching);
    }

    // 16. POST /api/webrtc/join
    if (apiPath === '/api/webrtc/join' && req.method === 'POST') {
      return readBody((peer) => {
        if (peer && peer.roomCode && peer.peerId) {
          const code = peer.roomCode.toLowerCase();
          const existingIdx = voicePeersList.findIndex(
            (p) => p.roomCode.toLowerCase() === code && p.peerId === peer.peerId
          );
          const updatedPeer = {
            ...peer,
            roomCode: code,
            lastSeen: Date.now(),
          };
          if (existingIdx !== -1) voicePeersList[existingIdx] = updatedPeer;
          else voicePeersList.push(updatedPeer);
          return sendJson(200, { ok: true, peer: updatedPeer });
        }
        return sendJson(400, { error: 'Peer ma‘lumoti xato' });
      });
    }

    // 17. POST /api/webrtc/leave
    if (apiPath === '/api/webrtc/leave' && req.method === 'POST') {
      return readBody((body) => {
        if (body && body.roomCode && body.peerId) {
          const code = body.roomCode.toLowerCase();
          const idx = voicePeersList.findIndex(
            (p) => p.roomCode.toLowerCase() === code && p.peerId === body.peerId
          );
          if (idx !== -1) voicePeersList.splice(idx, 1);
          return sendJson(200, { ok: true });
        }
        return sendJson(400, { error: 'Noto‘g‘ri ma‘lumot' });
      });
    }

    // 18. POST /api/webrtc/heartbeat
    if (apiPath === '/api/webrtc/heartbeat' && req.method === 'POST') {
      return readBody((body) => {
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
          return sendJson(200, { ok: true });
        }
        return sendJson(400, { error: 'Noto‘g‘ri heartbeat' });
      });
    }

    // 19. GET /api/webrtc/peers/:code
    const peersMatch = apiPath.match(/^\/api\/webrtc\/peers\/([a-zA-Z0-9]+)$/);
    if (peersMatch && req.method === 'GET') {
      const code = peersMatch[1].toLowerCase();
      const now = Date.now();
      for (let i = voicePeersList.length - 1; i >= 0; i--) {
        if (now - voicePeersList[i].lastSeen > 15000) {
          voicePeersList.splice(i, 1);
        }
      }
      const active = voicePeersList.filter((p) => p.roomCode.toLowerCase() === code);
      return sendJson(200, active);
    }

    // 20. POST /api/webrtc/signal
    if (apiPath === '/api/webrtc/signal' && req.method === 'POST') {
      return readBody((sig) => {
        if (sig && sig.roomCode && sig.fromPeerId && sig.toPeerId) {
          sig.createdAt = Date.now();
          signalsList.push(sig);
          const now = Date.now();
          if (signalsList.length > 500) {
            for (let i = signalsList.length - 1; i >= 0; i--) {
              if (now - signalsList[i].createdAt > 90000) {
                signalsList.splice(i, 1);
              }
            }
          }
          return sendJson(200, { ok: true });
        }
        return sendJson(400, { error: 'Signal ma‘lumoti xato' });
      });
    }

    // 21. GET /api/webrtc/signals/:code
    const signalsMatch = apiPath.match(/^\/api\/webrtc\/signals\/([a-zA-Z0-9]+)$/);
    if (signalsMatch && req.method === 'GET') {
      const code = signalsMatch[1].toLowerCase();
      const peerId = parsedUrl.searchParams.get('peerId') || '';
      const since = Number(parsedUrl.searchParams.get('since') || '0');
      const matching = signalsList.filter(
        (s) => s.roomCode.toLowerCase() === code && s.toPeerId === peerId && s.createdAt > since
      );
      return sendJson(200, matching);
    }

    return sendJson(404, { error: 'API endpoint topilmadi' });
  }

  // --- STATIC FILES & SPA FALLBACK ---
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  // If file exists and is a file, serve it
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        if (filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
        const stream = fs.createReadStream(filePath);
        return stream.pipe(res);
      }
    }
  } catch {}

  // SPA Fallback: serve dist/public/index.html
  const indexPath = path.join(DIST_DIR, 'index.html');
  try {
    if (fs.existsSync(indexPath)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      const stream = fs.createReadStream(indexPath);
      return stream.pipe(res);
    }
  } catch {}

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`[MedQuiz] Server listening on http://${HOST}:${PORT}`);
  console.log(`[MedQuiz] Base path configured as: ${BASE_PATH || '/'}`);
  console.log(`[MedQuiz] Serving static files from: ${DIST_DIR}`);
});
