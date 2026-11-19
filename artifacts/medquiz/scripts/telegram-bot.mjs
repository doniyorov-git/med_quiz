/**
 * MedQuiz Telegram Bot
 *
 * Ssenariy:
 * 1. /start: Iliq salomlashish, MedQuiz imkoniyatlari tanishuvi.
 * 2. Yuridik shartnoma talabi (Foydalanish shartlari va Maxfiylik siyosati inline havolalari).
 * 3. Reply keyboard: [ 📱 Telefon raqamni ulashish (Kontakt) ] (request_contact: true).
 * 4. Kontakt qabul qilinganda foydalanuvchini bazaga (server API yoki .sync-users.json) saqlash/yangilash.
 * 5. Mini App tugmasi: [ 🚀 MedQuiz ilovasini ochish ] (web_app: { url: APP_URL }).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '';
const APP_URL = process.env.MEDQUIZ_APP_URL || 'https://medquiz.uz/quiz';
const API_URL = process.env.MEDQUIZ_API_URL || 'http://localhost:3000/api';

const USERS_FILE = path.join(__dirname, '../.sync-users.json');

function saveTelegramUserToDb(userRecord) {
  try {
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
    }
    const idx = users.findIndex(
      (u) => String(u.telegramId) === String(userRecord.telegramId) || String(u.id) === String(userRecord.id)
    );
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...userRecord, seen: Date.now() };
    } else {
      users.push(userRecord);
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    console.log(`[Bot] Foydalanuvchi saqlandi: ${userRecord.name} (@${userRecord.username || userRecord.telegramId})`);
  } catch (err) {
    console.error('[Bot] Bazaga yozishda xatolik:', err);
  }
}

async function tgRequest(method, payload) {
  if (!BOT_TOKEN) {
    console.warn('[Bot] TELEGRAM_BOT_TOKEN berilmagan.');
    return null;
  }
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`[Bot] Telegram API xatoligi (${method}):`, err);
    return null;
  }
}

export async function handleTelegramUpdate(update) {
  if (!update) return;

  const msg = update.message;
  if (!msg) return;

  const chatId = msg.chat?.id;
  const from = msg.from;
  if (!chatId || !from) return;

  const tgId = from.id;
  const firstName = from.first_name || '';
  const lastName = from.last_name || '';
  const username = from.username || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Hurmatli Talaba';

  // 1. /start ssenariysi
  if (msg.text && msg.text.startsWith('/start')) {
    const greetingText =
      `Assalomu alaykum, <b>${fullName}</b>!\n\n` +
      `🩺 <b>MedQuiz</b> — Tibbiyot talabalari va shifokorlar uchun interaktiv imtihon hamda test tayyorgarligi platformasiga xush kelibsiz!\n\n` +
      `Platformamiz orqali siz:\n` +
      `• Klinik keyslar va fan testlarini yechishingiz;\n` +
      `• Kursdoshlar bilan jonli <b>Battle</b> musobaqalarida bellashishingiz;\n` +
      `• <b>Spaced Repetition (SRS)</b> orqali xatolarni eslab qolishingiz;\n` +
      `• Yurak va o‘pka <b>audio auskultatsiya</b> savollarini tahlil qilishingiz mumkin.\n\n` +
      `⚖️ <i>Platformadan foydalanishdan oldin <a href="${APP_URL}">Foydalanish shartlari</a> hamda <a href="${APP_URL}">Maxfiylik siyosati</a>ga rozilik bildirishingiz kerak.</i>\n\n` +
      `Iltimos, profilingizni tasdiqlash uchun pastdagi <b>«📱 Telefon raqamni ulashish»</b> tugmasini bosing:`;

    await tgRequest('sendMessage', {
      chat_id: chatId,
      text: greetingText,
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [
            {
              text: '📱 Telefon raqamni ulashish (Kontakt)',
              request_contact: true,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  // 2. Kontakt kelganda
  if (msg.contact) {
    let phone = msg.contact.phone_number || '';
    if (!phone.startsWith('+')) phone = '+' + phone;

    const userProfile = {
      id: `tg-${tgId}`,
      telegramId: tgId,
      name: fullName,
      username: username ? username.toLowerCase() : `user_${tgId}`,
      phone: phone,
      role: 'Talaba',
      rating: 1000,
      xp: 50,
      coins: 25,
      streak: 1,
      streakFreezes: 1,
      termsAgreed: true,
      termsAgreedAt: Date.now(),
      seen: Date.now(),
    };

    saveTelegramUserToDb(userProfile);

    const successText =
      `✅ <b>Rahmat, ${firstName}! Telefon raqamingiz muvaffaqiyatli tasdiqlandi.</b>\n\n` +
      `Telefon: <code>${phone}</code>\n\n` +
      `Sizga <b>+25 MedCoins</b> va <b>1 ta Streak Freeze</b> sovg‘a qilindi! 🎁\n\n` +
      `MedQuiz ilovasiga to‘g‘ridan-to‘g‘ri kirish uchun pastdagi tugmani bosing:`;

    await tgRequest('sendMessage', {
      chat_id: chatId,
      text: successText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 MedQuiz ilovasini ochish',
              web_app: { url: APP_URL },
            },
          ],
        ],
      },
    });
    return;
  }
}

// Long polling runner if executed directly
async function startPolling() {
  if (!BOT_TOKEN) {
    console.log('[Bot] TELEGRAM_BOT_TOKEN aniqlanmadi. Botni ishga tushirish uchun TELEGRAM_BOT_TOKEN=... node scripts/telegram-bot.mjs bering.');
    return;
  }
  console.log('[Bot] MedQuiz Telegram Bot polling rejimi ishga tushdi...');
  let offset = 0;
  while (true) {
    try {
      const res = await tgRequest('getUpdates', { offset, timeout: 30 });
      if (res && res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          offset = update.update_id + 1;
          await handleTelegramUpdate(update);
        }
      }
    } catch (e) {
      console.error('[Bot] Polling xatosi:', e);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startPolling();
}
