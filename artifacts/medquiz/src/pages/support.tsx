import { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Icon, Avatar } from '@/components/chrome';
import { useStore } from '@/lib/store';

interface FileAttachment {
  name: string;
  size: number;
  type: 'image' | 'document';
  dataUrl: string;
}

interface SupportMessage {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  avatar?: string;
  text?: string;
  file?: FileAttachment;
  time: string;
  actions?: { label: string; link?: string; external?: boolean }[];
}

const STORAGE_KEY = 'medquiz_support_chat_messages_v2';

const INITIAL_MESSAGES: SupportMessage[] = [
  {
    id: 'm-welcome-1',
    sender: 'support',
    senderName: 'MedQuiz Yordamchi (Shifokor-maslahatchi)',
    text: 'Assalomu alaykum! MedQuiz tibbiy qo‘llab-quvvatlash markaziga xush kelibsiz! 🩺\n\nBiz sizga test to‘plamlarini yuklash, xatoliklar, do‘stlar bilan jonli Battle yoki imtihon kalendari bo‘yicha har qanday masalada yordam beramiz.\n\nFayllar (skrinshotlar, Word, PDF yoki matnli testlar) yuborishingiz ham mumkin!',
    time: 'Bugun, hozir',
    actions: [
      { label: '📚 To‘plam yuklash' },
      { label: '⚔️ Battle qoidalari' },
      { label: '📅 Imtihon kalendari' },
    ],
  },
  {
    id: 'm-welcome-2',
    sender: 'support',
    senderName: 'MedQuiz Yordamchi (Shifokor-maslahatchi)',
    text: 'Savolingizni yozing yoki quyidagi skкрепka (📎) tugmasi orqali rasm/hujjat ilova qiling. Bir necha soniyada batafsil javob beramiz!',
    time: 'Bugun, hozir',
  },
];

const QUICK_TOPICS = [
  {
    query: 'Word (.docx) yoki PDF fayldan testlarni qanday yuklayman?',
    short: '📄 Word/PDF dan test yuklash',
  },
  {
    query: 'Battle qanday o‘ynaladi va do‘stlarni qanday taklif qilaman?',
    short: '⚔️ Battle va chaqiruvlar',
  },
  {
    query: 'Imtihon kalendari va kunlik me’yor qanday hisoblanadi?',
    short: '📅 Imtihon taqvimi',
  },
  {
    query: 'Test savolida xatolik topsam nima qilishim kerak?',
    short: '❌ Savoldagi xatoliklar',
  },
  {
    query: 'XP ballari, streak va reyting o‘rinlari qanday beriladi?',
    short: '🏆 XP va Reyting',
  },
  {
    query: 'Administrator yoki shifokor bilan bevosita bog‘lanish',
    short: '👨‍⚕️ Jonli admin bilan aloqa',
  },
];

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function playMessageBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  } catch {}
}

export function SupportPage() {
  const { me } = useStore();
  const [, setLocation] = useLocation();

  const [messages, setMessages] = useState<SupportMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_MESSAGES;
  });

  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, selectedFile]);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation('/dashboard');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Fayl hajmi 15 MB dan oshmasligi kerak!');
      return;
    }

    const isImg = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedFile({
        name: file.name,
        size: file.size,
        type: isImg ? 'image' : 'document',
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
    // Reset file input value so same file can be chosen again
    e.target.value = '';
  };

  const generateAnswer = (
    userQuery: string,
    hasFile: boolean,
    fileName?: string
  ): { text: string; actions?: SupportMessage['actions'] } => {
    const q = userQuery.toLowerCase();

    if (hasFile) {
      return {
        text: `📎 **Faylingiz qabul qilindi!** («${fileName}»)\n\nShifokor-moderatorlarimiz ushbu faylni tekshirib chiqishmoqda. Agar savolda xatolik bo‘lsa, u tahrirlanadi. Agar yangi test bazasi yuborgan bo‘lsangiz, tizimga yuklanishi bo‘yicha tez orada natija ko‘rsatiladi.\n\nQo‘shimcha ma’lumot kerak bo‘lsa, bevosita administrator bilan bog‘lanishingiz mumkin.`,
        actions: [
          { label: 'To‘plamlarga o‘tish', link: '/banks' },
          { label: 'Admin Telegram (@medquiz_admin)', link: 'https://t.me/medquiz_uz', external: true },
        ],
      };
    }

    if (
      q.includes('fayl') ||
      q.includes('word') ||
      q.includes('docx') ||
      q.includes('pdf') ||
      q.includes('yuklash') ||
      q.includes('to‘plam')
    ) {
      return {
        text: `📄 **Word (.docx), PDF yoki TXT dan test yuklash bo‘yicha qo‘llanma:**\n\n1. «To‘plamlar» bo‘limiga o‘ting va «+ Yangi to‘plam» tugmasini bosing.\n2. «Fayl yuklash» yorlig‘ini tanlang va kompyuteringizdan *.docx, *.pdf yoki *.txt faylini tanlang.\n3. MedQuiz avtomatik ravishda savollarni, 4 ta variant (A, B, C, D) va to‘g‘ri javoblarni ajratib oladi.\n\n💡 **Fayl formati talabi:**\nHar bir savoldan keyin variantlar joylashsin. To‘g‘ri javob oldiga yulduzcha (\`*\`), plyus (\`+\`) yoki qalin shrift (bold) qo‘yilgan bo‘lsa, tizim uni 100% aniqlik bilan to‘g‘ri javob deb tanlaydi!`,
        actions: [
          { label: 'To‘plamlarga o‘tish', link: '/banks' },
          { label: 'Admin Telegram orqali yordam', link: 'https://t.me/medquiz_uz', external: true },
        ],
      };
    }

    if (
      q.includes('battle') ||
      q.includes('jang') ||
      q.includes('do‘st') ||
      q.includes('taklif') ||
      q.includes('chaqir')
    ) {
      return {
        text: `⚔️ **Do‘stlar bilan jonli Battle rejimi:**\n\n1. **Xona yaratish:** «Battle» bo‘limiga kiring, to‘plamni tanlang va «Xona yaratish» tugmasini bosing. Sizga 6 harfli maxsus kod beriladi (masalan, \`DFMXMF\`).\n2. **Do‘stni taklif qilish:** Kursdoshlar ro‘yxatidan do‘stingiz yonidagi «Battle» tugmasini bosing. Agar do‘stingiz onlayn bo‘lsa, uning ekranining **yuqorisida maxsus modal oyna** chiqadi va u «Qabul qilish» tugmasini bosib darhol sizga qo‘shiladi!\n3. **Jonli bellashuv:** Ikkalangizga ham bir xil savol beriladi. Kim tez va to‘g‘ri topsa, shuncha ko‘p ball oladi. Emotikonlar va ovozli aloqa (Voice Chat) ham mavjud!`,
        actions: [
          { label: 'Battle xonasiga o‘tish', link: '/battle' },
          { label: 'Do‘stlar ro‘yxati', link: '/friends' },
        ],
      };
    }

    if (
      q.includes('kalendar') ||
      q.includes('taqvim') ||
      q.includes('imtihon') ||
      q.includes('me’yor') ||
      q.includes('norma') ||
      q.includes('reja')
    ) {
      return {
        text: `📅 **Imtihon kalendari va kunlik o‘quv rejasi:**\n\n• «To‘plamlar» sahifasida har bir fan kartochkasida kalendar belgisi bor.\n• Kalendarga kirib, istalgan kelgusi sanani bosib, «Ushbu sanani imtihon kuni deb belgilash» tugmasini bossangiz, tizim imtihongacha qolgan kunlarni hisoblab chiqadi.\n• **Kunlik me’yor (Spaced Repetition):** Jami savollar soni qolgan kunlarga teng taqsimlanadi. Har kuni belgilangan normani bajarsangiz, imtihongacha barcha savollarni 100% puxta o‘zlashtirasiz!`,
        actions: [{ label: 'To‘plamlar va Kalendar', link: '/banks' }],
      };
    }

    if (
      q.includes('xato') ||
      q.includes('noto‘g‘ri') ||
      q.includes('report') ||
      q.includes('shikoyat')
    ) {
      return {
        text: `❌ **Test savolidagi xatoliklar bo‘yicha:**\n\n• Test yechayotganda yoki yechib bo‘lgach, siz noto‘g‘ri deb bilgan savolingiz bo‘lsa, savol ostidagi «Xatolik haqida xabar berish» tugmasini bosing.\n• Barcha adashgan savollaringiz avtomatik tarzda «Xatolarim» bo‘limiga saqlanadi.\n• U yerdan istalgan vaqtda faqat adashgan savollaringiz bo‘yicha qayta mashq qilishingiz mumkin!`,
        actions: [
          { label: 'Xatolarim bo‘limi', link: '/mistakes' },
          { label: 'Adminga xatolikni yuborish (Telegram)', link: 'https://t.me/medquiz_uz', external: true },
        ],
      };
    }

    if (
      q.includes('xp') ||
      q.includes('ball') ||
      q.includes('reyting') ||
      q.includes('streak') ||
      q.includes('unvon')
    ) {
      return {
        text: `🏆 **XP, Reyting va Darajalar tizimi:**\n\n• **Har bir to‘g‘ri javob uchun:** +10 XP\n• **100% mukammal test uchun:** +50 XP qo‘shimcha bonus\n• **Battle g‘alabasi uchun:** +50 XP\n• **Har kungi doimiy o‘qish (Streak):** Har kuni kamida 1 marta test yechsangiz, streak kunchalari oshib boradi va qo‘shimcha ballar beriladi.\n• Barcha to‘plangan XP reytingingizni oshiradi va PesHQadamlar jadvalida yuqoriga ko‘taradi!`,
        actions: [
          { label: 'Reyting jadvali', link: '/leaderboard' },
          { label: 'Mening yutuqlarim', link: '/achievements' },
        ],
      };
    }

    if (
      q.includes('admin') ||
      q.includes('aloqa') ||
      q.includes('telegram') ||
      q.includes('telefon') ||
      q.includes('bog‘lanish')
    ) {
      return {
        text: `👨‍⚕️ **Administrator va Texnik Qo‘llab-quvvatlash bilan aloqa:**\n\n• **Telegram yordam:** [@medquiz_admin](https://t.me/medquiz_uz)\n• **Rasmiy kanal:** [@medquiz_official](https://t.me/medquiz_uz)\n• **Ish vaqti:** 24/7 (tibbiyot talabalari va foydalanuvchilar uchun uzluksiz)\n• **Murojaatlar:** Yangi test bazalarini qo‘shish, mualliflik savollarini kiritish yoki takliflar bo‘yicha Telegram orqali yozishingiz mumkin.`,
        actions: [{ label: 'Telegramda yozish', link: 'https://t.me/medquiz_uz', external: true }],
      };
    }

    return {
      text: `Rahmat! Savolingiz qabul qilindi. 🩺\n\n«${userQuery}» masalasi bo‘yicha:\nMedQuiz platformasida barcha funksiyalar tibbiyot talabalari imtihonlarga oson, samarali va do‘stlar bilan qiziqarli tayyorlanishi uchun yaratilgan.\n\nAgar bu bo‘yicha qo‘shimcha tushuntirish kerak bo‘lsa, quyidagi tugmalar orqali tegishli bo‘limga o‘tishingiz yoki to‘g‘ridan-to‘g‘ri Telegram orqali admin bilan bog‘lanishingiz mumkin.`,
      actions: [
        { label: 'To‘plamlar', link: '/banks' },
        { label: 'Battle o‘ynash', link: '/battle' },
        { label: 'Telegramda yozish', link: 'https://t.me/medquiz_uz', external: true },
      ],
    };
  };

  const handleSend = (textToSend?: string) => {
    const raw = (textToSend !== undefined ? textToSend : input).trim();
    if (!raw && !selectedFile) return;

    const filePayload = selectedFile || undefined;

    const userMsg: SupportMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      senderName: me?.name || 'Talaba',
      avatar: me?.avatar || undefined,
      text: raw || (filePayload ? `[Yuborilgan fayl: ${filePayload.name}]` : undefined),
      file: filePayload,
      time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSelectedFile(null);
    setIsTyping(true);

    const replyDelay = 700 + Math.random() * 400;

    setTimeout(() => {
      const { text: answerText, actions } = generateAnswer(
        raw,
        !!filePayload,
        filePayload?.name
      );
      const botMsg: SupportMessage = {
        id: `s-${Date.now()}`,
        sender: 'support',
        senderName: 'MedQuiz Qo‘llab-quvvatlash',
        text: answerText,
        time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        actions,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      playMessageBeep();
    }, replyDelay);
  };

  const handleClearChat = () => {
    if (confirm('Rostdan ham yordam chati yozishmalarini tozalamoqchimisiz?')) {
      setMessages(INITIAL_MESSAGES);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-white overflow-hidden">
      {/* 1. TOP HEADER: [← Ortga] + Qo'llab-quvvatlash markazi */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-3 border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-md shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          {/* Ortga qaytish tugmasi */}
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title="Ortga qaytish"
          >
            <Icon name="ri-arrow-left-line" className="text-base sm:text-lg" />
            <span>Ortga</span>
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 shrink-0" />

          {/* Qo'llab-quvvatlash markazi yozuvi */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-md shadow-primary/20">
                <Icon name="ri-customer-service-2-fill" className="text-lg sm:text-xl" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-[#0e1422]"></span>
              </span>
            </div>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Qo‘llab-quvvatlash markazi
              </h1>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>24/7 Onlayn • Jonli yordam</span>
              </p>
            </div>
          </div>
        </div>

        {/* O'ng tomon: Telegram va Chat tozalash */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://t.me/medquiz_uz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/25 transition-colors"
            title="Telegramda administrator bilan bog‘lanish"
          >
            <Icon name="ri-telegram-fill" className="text-sm sm:text-base text-sky-500" />
            <span className="hidden sm:inline">Telegram admin</span>
          </a>

          <button
            type="button"
            onClick={handleClearChat}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            title="Chat tarixini tozalash"
          >
            <Icon name="ri-delete-bin-line" className="text-base" />
          </button>
        </div>
      </header>

      {/* 2. TEZKOR SAVOLLAR (FAQ CHIPSLAR) */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 bg-slate-50/70 px-4 py-2 text-xs no-scrollbar dark:border-white/10 dark:bg-white/[0.02] shrink-0">
        <span className="shrink-0 font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Tezkor savollar:
        </span>
        {QUICK_TOPICS.map((topic, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(topic.query)}
            className="shrink-0 rounded-full border border-slate-200/90 bg-white px-3 py-1 font-medium text-slate-700 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-[#111827] dark:text-slate-300 dark:hover:border-primary transition-colors cursor-pointer shadow-2xs"
          >
            {topic.short}
          </button>
        ))}
      </div>

      {/* 3. ASOSIY FULLSCREEN XABARLAR MAYDONI */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40 dark:bg-[#070b14]/50">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {isUser ? (
                  <Avatar name={msg.senderName} image={msg.avatar} size="w-9 h-9" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-xs">
                    <Icon name="ri-stethoscope-fill" className="text-lg" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`max-w-[88%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-med-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 dark:bg-[#111827] dark:text-slate-200 dark:border-white/10 rounded-tl-none'
                  }`}
                >
                  {/* Sender Title and Time */}
                  <div
                    className={`flex items-center justify-between gap-3 pb-1.5 mb-1.5 border-b text-[11px] ${
                      isUser
                        ? 'border-white/20 text-emerald-100'
                        : 'border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 font-semibold'
                    }`}
                  >
                    <span>{msg.senderName}</span>
                    <span className="opacity-75">{msg.time}</span>
                  </div>

                  {/* Agar xabarda Fayl (Rasm yoki Hujjat) biriktirilgan bo'lsa */}
                  {msg.file && (
                    <div className="mb-3">
                      {msg.file.type === 'image' ? (
                        <div className="relative group overflow-hidden rounded-xl border border-white/20 max-w-sm">
                          <img
                            src={msg.file.dataUrl}
                            alt={msg.file.name}
                            className="max-h-60 w-auto rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setPreviewImage(msg.file!.dataUrl)}
                          />
                          <div className="mt-1 flex items-center justify-between text-[11px] opacity-80">
                            <span className="truncate max-w-[200px]">{msg.file.name}</span>
                            <span>{formatFileSize(msg.file.size)}</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`flex items-center gap-3 p-3 rounded-xl border ${
                            isUser
                              ? 'bg-white/10 border-white/20 text-white'
                              : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white'
                          }`}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                            <Icon name="ri-file-text-line" className="text-2xl" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs truncate">{msg.file.name}</p>
                            <p className="text-[10px] opacity-75">{formatFileSize(msg.file.size)}</p>
                          </div>
                          <a
                            href={msg.file.dataUrl}
                            download={msg.file.name}
                            className={`p-2 rounded-lg transition-colors ${
                              isUser
                                ? 'bg-white/20 hover:bg-white/30 text-white'
                                : 'bg-primary/10 hover:bg-primary/20 text-primary'
                            }`}
                            title="Yuklab olish"
                          >
                            <Icon name="ri-download-2-line" className="text-base" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Xabar matni */}
                  {msg.text && (
                    <div className="whitespace-pre-wrap space-y-2">
                      {msg.text}
                    </div>
                  )}

                  {/* Qo'shimcha tezkor harakat tugmalari */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-2">
                      {msg.actions.map((act, idx) =>
                        act.external ? (
                          <a
                            key={idx}
                            href={act.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold border border-primary/20 transition-colors"
                          >
                            <Icon name="ri-external-link-line" />
                            <span>{act.label}</span>
                          </a>
                        ) : (
                          <Link
                            key={idx}
                            href={act.link || '/'}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold border border-primary/20 transition-colors"
                          >
                            <Icon name="ri-arrow-right-line" />
                            <span>{act.label}</span>
                          </Link>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-xs">
                <Icon name="ri-stethoscope-fill" className="text-lg" />
              </div>
              <div className="rounded-2xl rounded-tl-none border border-slate-200/80 bg-white p-3.5 text-xs text-slate-500 shadow-xs dark:border-white/10 dark:bg-[#111827] dark:text-slate-400 flex items-center gap-2">
                <span className="font-semibold text-primary">MedQuiz Support yozmoqda</span>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 4. FOOTER INPUT VA FAYL BIRIKTIRISH MAYDONI */}
      <footer className="border-t border-slate-200/80 bg-white p-3 sm:p-4 dark:border-white/10 dark:bg-[#0e1422] shrink-0">
        <div className="max-w-4xl mx-auto w-full">
          {/* Tanlangan fayl prebyusi (agar biriktirilgan bo'lsa) */}
          {selectedFile && (
            <div className="mb-2.5 flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs">
              <div className="flex items-center gap-2 min-w-0">
                {selectedFile.type === 'image' ? (
                  <img
                    src={selectedFile.dataUrl}
                    alt={selectedFile.name}
                    className="h-9 w-9 rounded-lg object-cover border border-primary/30 shrink-0"
                  />
                ) : (
                  <Icon name="ri-file-text-line" className="text-xl shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-bold truncate max-w-[260px] sm:max-w-md">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1 rounded-lg hover:bg-primary/20 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                title="Faylni olib tashlash"
              >
                <Icon name="ri-close-line" className="text-lg" />
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Fayl biriktirish (Skrepka) tugmasi */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors cursor-pointer"
              title="Fayl yoki rasm biriktirish (PDF, Word, rasm, matn)"
            >
              <Icon name="ri-attachment-2" className="text-xl" />
            </button>

            {/* Xabar kiritish inputi */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Savolingizni yozing yoki fayl yuboring..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-primary"
            />

            {/* Yuborish tugmasi */}
            <button
              type="submit"
              disabled={!input.trim() && !selectedFile}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 sm:px-5 font-bold text-xs sm:text-sm text-white shadow-md transition-all hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              <span className="hidden sm:inline">Yuborish</span>
              <Icon name="ri-send-plane-fill" className="text-base" />
            </button>
          </form>
        </div>
      </footer>

      {/* Rasm to'liq ekranda ko'rish modali (Lightbox) */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Ko‘rish"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-rose-600 transition-colors"
            >
              <Icon name="ri-close-line" className="text-xl" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
