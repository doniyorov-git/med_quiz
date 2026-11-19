import { useEffect, useRef, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Icon } from '@/components/chrome';
import { AlertModal } from '@/components/alert-modal';
import { useStore } from '@/lib/store';

interface FileAttachment {
  name: string;
  size: number;
  type: 'image' | 'document';
  dataUrl: string;
}

interface RoadmapStep {
  step: number;
  title: string;
  desc: string;
  badge?: string;
}

interface SupportMessage {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  avatar?: string | null;
  text?: string;
  file?: FileAttachment;
  time: string;
  options?: { label: string; query: string }[];
  roadmap?: {
    title: string;
    steps: RoadmapStep[];
  };
  actions?: { label: string; link?: string; external?: boolean; primary?: boolean }[];
}

const STORAGE_KEY = 'medquiz_support_chat_messages_v4';

const INITIAL_MESSAGES: SupportMessage[] = [
  {
    id: 'm-welcome',
    sender: 'support',
    senderName: 'MedQuiz Yordamchi',
    text: 'Assalomu alaykum! MedQuiz qo‘llab-quvvatlash markaziga xush kelibsiz. Savolingiz bo‘yicha quyidagi yo‘l xaritalaridan birini tanlang yoki savolingizni to‘g‘ridan-to‘g‘ri yozing:',
    time: 'Bugun',
    options: [
      { label: 'Word yoki PDF dan test yuklash', query: 'Word yoki PDF dan test yuklash' },
      { label: 'Do‘stlar bilan jonli Battle rejimi', query: 'Battle qanday o‘ynaladi?' },
      { label: 'Imtihon taqvimi va kunlik me’yor', query: 'Imtihon kalendari qanday ishlaydi?' },
      { label: 'Test savolida xatolik haqida xabar', query: 'Savolda xatolik topsam nima qilaman?' },
      { label: 'Jonli administrator bilan bog‘lanish', query: 'Administrator bilan bog‘lanish' },
    ],
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
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  } catch {}
}

export function SupportPage() {
  const { me } = useStore();
  const [, setLocation] = useLocation();
  const [clearChatConfirm, setClearChatConfirm] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  const [isTyping, setIsTyping] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

    if (file.size > 25 * 1024 * 1024) {
      alert('Fayl hajmi 25 MB dan oshmasligi kerak!');
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
    e.target.value = '';
  };

  const generateAnswer = (
    userQuery: string,
    hasFile: boolean,
    fileName?: string
  ): {
    text: string;
    roadmap?: SupportMessage['roadmap'];
    actions?: SupportMessage['actions'];
  } => {
    const q = userQuery.toLowerCase();

    if (hasFile) {
      return {
        text: `Faylingiz muvaffaqiyatli qabul qilindi. Moderatsiya va tekshirish bosqichlari quyidagicha kechadi:`,
        roadmap: {
          title: 'Hujjatni tekshirish yo‘l xaritasi',
          steps: [
            {
              step: 1,
              title: 'Qabul qilindi va tahlilga olindi',
              desc: `«${fileName || 'Hujjat'}» fayli tizim xotirasiga yuklandi.`,
              badge: 'Bajarildi',
            },
            {
              step: 2,
              title: 'Shifokor-moderator tekshiruvi',
              desc: 'Tibbiyot ekspertlari test tuzilishi va javoblarning ilmiy to‘g‘riligini tasdiqlaydi.',
              badge: 'Jarayonda',
            },
            {
              step: 3,
              title: 'Bazaga qo‘shish va tasdiqlash',
              desc: 'Yakuniy test to‘plami profilingizda faollashadi va sizga xabar beriladi.',
            },
          ],
        },
        actions: [
          { label: 'To‘plamlarga o‘tish', link: '/banks', primary: true },
          { label: 'Admin bilan bog‘lanish', link: 'https://t.me/medquiz_uz', external: true },
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
        text: `Word (.docx), PDF yoki TXT fayllardan yangi test to‘plamini yuklash bo‘yicha bosqichma-bosqich yo‘l xaritasi:`,
        roadmap: {
          title: 'Test bazasini yuklash yo‘l xaritasi',
          steps: [
            {
              step: 1,
              title: 'Faylni tayyorlash',
              desc: 'Har bir savoldan so‘ng variantlarni joylashtiring. To‘g‘ri javob oldiga «+» yoki «*» belgisini qo‘ying (Masalan: +A) Normal qon bosimi 120/80 mm sim.ust).',
              badge: 'Format',
            },
            {
              step: 2,
              title: 'To‘plamlar sahifasiga yuklash',
              desc: '«To‘plamlar» sahifasiga o‘tib, «+ Yangi to‘plam» tugmasini bosing va faylingizni (.docx, .pdf yoki .txt) tanlang.',
              badge: 'Yuklash',
            },
            {
              step: 3,
              title: 'Avtomatik testga aylantirish',
              desc: 'MedQuiz algoritmi 1 soniyada savollar, variantlar va kalitlarni ajratib oladi. Test to‘plami mashq uchun tayyor bo‘ladi.',
              badge: 'Tayyor',
            },
          ],
        },
        actions: [
          { label: 'To‘plamlar bo‘limiga o‘tish', link: '/banks', primary: true },
          { label: 'Yordam (Telegram)', link: 'https://t.me/medquiz_uz', external: true },
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
        text: `Kursdoshlar bilan onlayn test musobaqasi (Battle) o‘tkazish yo‘l xaritasi:`,
        roadmap: {
          title: 'Jonli Battle o‘tkazish yo‘l xaritasi',
          steps: [
            {
              step: 1,
              title: 'Xona yaratish va rejim tanlash',
              desc: '«Battle» sahifasiga o‘tib kerakli fanni tanlang. Rejimlardan birini tanlang: Klassik, Sudden Death (bitta xatoda chiqish) yoki Speed Run.',
              badge: '1-qadam',
            },
            {
              step: 2,
              title: 'Do‘stni taklif qilish',
              desc: 'Kursdoshlar ro‘yxatidan do‘stingiz yonidagi «Battle» tugmasini bosing. Agar do‘stingiz onlayn bo‘lsa, ekranida taklif modali paydo bo‘ladi.',
              badge: '2-qadam',
            },
            {
              step: 3,
              title: 'Real vaqtda bellashuv va mukofot',
              desc: 'Savollarga bir vaqtda javob berasiz. G‘alaba qozongan ishtirokchi +10 MedCoins va reyting XP ballari bilan taqdirlanadi.',
              badge: 'G‘alaba',
            },
          ],
        },
        actions: [
          { label: 'Battle bo‘limiga o‘tish', link: '/battle', primary: true },
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
        text: `Spaced Repetition (SRS) asosida imtihonga tizimli tayyorgarlik ko‘rish yo‘l xaritasi:`,
        roadmap: {
          title: 'Imtihon tayyorgarligi yo‘l xaritasi (SRS)',
          steps: [
            {
              step: 1,
              title: 'Imtihon sanasini belgilash',
              desc: '«To‘plamlar» sahifasidagi fan kartochkasida kalendar belgisini bosing va rasmiy imtihon kunini tanlang.',
              badge: 'Taqvim',
            },
            {
              step: 2,
              title: 'Kunlik me’yorni hisoblash',
              desc: 'Tizim imtihongacha qolgan kunlarni inobatga olgan holda kunlik o‘zlashtirish me’yorini (masalan, kuniga 35 ta savol) belgilaydi.',
              badge: 'Me’yor',
            },
            {
              step: 3,
              title: 'Intervalli takrorlash va mustahkamlash',
              desc: 'Xato qilingan savollar SM-2 algoritmi bo‘yicha 1, 3 va 7 kunlik intervallarda qaytarilib, uzoq muddatli xotiraga muhrlanadi.',
              badge: 'SRS',
            },
          ],
        },
        actions: [
          { label: 'To‘plamlarga o‘tish', link: '/banks', primary: true },
        ],
      };
    }

    if (
      q.includes('xato') ||
      q.includes('noto‘g‘ri') ||
      q.includes('report') ||
      q.includes('shikoyat')
    ) {
      return {
        text: `Savoldagi xatolikni bildirish va tuzatish bo‘yicha yo‘l xaritasi:`,
        roadmap: {
          title: 'Savoldagi xatolikni tuzatish yo‘l xaritasi',
          steps: [
            {
              step: 1,
              title: 'Xatoni belgilash',
              desc: 'Test yechish davomida savol ostidagi shikoyat tugmasini bosing yoki ushbu chatga savol skrinshotini yuboring.',
              badge: 'Belgilash',
            },
            {
              step: 2,
              title: 'Xatolarim bankida saqlash',
              desc: 'Noto‘g‘ri topilgan savol avtomatik «Xatolarim» bankiga tushadi va u yerda AI Klinik Tushuntirish tugmasi faollashadi.',
              badge: 'AI Tahlil',
            },
            {
              step: 3,
              title: 'Bazani yangilash',
              desc: 'Klinik tahririyat savolni tekshirib to‘g‘rilaydi va barcha foydalanuvchilarda to‘g‘ri variant aks etadi.',
              badge: 'Tuzatildi',
            },
          ],
        },
        actions: [
          { label: 'Xatolarim bo‘limi', link: '/mistakes', primary: true },
          { label: 'Telegramda xabar berish', link: 'https://t.me/medquiz_uz', external: true },
        ],
      };
    }

    if (
      q.includes('admin') ||
      q.includes('bog‘lanish') ||
      q.includes('telefon') ||
      q.includes('aloqa')
    ) {
      return {
        text: `MedQuiz ma’muriyati va texnik xizmati bilan bog‘lanish yo‘l xaritasi:`,
        roadmap: {
          title: 'Aloqa markazi yo‘l xaritasi',
          steps: [
            {
              step: 1,
              title: 'Mavzuni shakllantirish',
              desc: 'Savol, taklif yoki to‘lov masalasini ushbu chatda yoki Telegramda yozing.',
              badge: 'Savol',
            },
            {
              step: 2,
              title: 'Skrinshot ilova qilish',
              desc: 'Zarur bo‘lsa pastdagi skrepka tugmasi orqali rasm yoki faylni ilova qiling.',
              badge: 'Ilova',
            },
            {
              step: 3,
              title: 'To‘g‘ridan-to‘g‘ri javob',
              desc: 'Administrator 15 daqiqa ichida siz bilan bog‘lanadi va masalani hal qiladi.',
              badge: 'Tezkor',
            },
          ],
        },
        actions: [
          { label: 'Telegram admin ochish', link: 'https://t.me/medquiz_uz', external: true, primary: true },
        ],
      };
    }

    return {
      text: `Savolingiz qabul qilindi. MedQuiz imkoniyatlaridan to‘liq foydalanish bo‘yicha yo‘l xaritasi:`,
      roadmap: {
        title: 'Platformadan samarali foydalanish yo‘l xaritasi',
        steps: [
          {
            step: 1,
            title: 'Testlarni yuklash va mustaqil yechish',
            desc: '«To‘plamlar» sahifasidan fanni tanlang yoki o‘z savollaringizni yuklang.',
          },
          {
            step: 2,
            title: 'Xatolar ustida ishlash',
            desc: 'Xatolar banki va AI klinik tushuntirish yordamida bilimlarni mustahkamlang.',
          },
          {
            step: 3,
            title: 'Do‘stlar bilan bellashish',
            desc: 'Battle janglarida qatnashib MedCoins va reyting ballarini to‘plang.',
          },
        ],
      },
      actions: [
        { label: 'Boshqaruv paneliga o‘tish', link: '/dashboard', primary: true },
        { label: 'Telegram admin', link: 'https://t.me/medquiz_uz', external: true },
      ],
    };
  };

  const handleSend = (overrideText?: string) => {
    const textToSend = (overrideText ?? input).trim();
    if (!textToSend && !selectedFile) return;

    const userMsg: SupportMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      senderName: me?.name || 'Siz',
      avatar: me?.avatar,
      text: textToSend,
      file: selectedFile || undefined,
      time: 'Hozir',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const hadFile = Boolean(selectedFile);
    const fileName = selectedFile?.name;
    setSelectedFile(null);

    setIsTyping(true);

    const replyDelay = Math.min(1000, 450 + textToSend.length * 8);

    setTimeout(() => {
      const answer = generateAnswer(textToSend, hadFile, fileName);

      const botMsg: SupportMessage = {
        id: `bot-${Date.now()}`,
        sender: 'support',
        senderName: 'MedQuiz Yordamchi',
        text: answer.text,
        roadmap: answer.roadmap,
        actions: answer.actions,
        time: 'Hozir',
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      playMessageBeep();
    }, replyDelay);
  };

  const handleClearChat = () => {
    setClearChatConfirm(true);
  };

  const executeClearChat = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setClearChatConfirm(false);
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const sq = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        (m.text && m.text.toLowerCase().includes(sq)) ||
        (m.file && m.file.name.toLowerCase().includes(sq))
    );
  }, [messages, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50/70 dark:bg-[#090d16] text-slate-900 dark:text-white overflow-hidden">
      {/* 1. TOP HEADER: MedQuiz dizayn tizimiga 100% mos toza header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-3 bg-white dark:bg-[#111827] border-b border-slate-200/80 dark:border-white/10 shadow-xs shrink-0">
        {/* Left: Ortga qaytish */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/90 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shrink-0"
            title="Ortga qaytish"
          >
            <Icon name="ri-arrow-left-s-line" className="text-xl" />
            <span className="hidden sm:inline">Ortga</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-md shadow-primary/25 shrink-0">
              <Icon name="ri-customer-service-2-fill" className="text-lg sm:text-xl" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Qo‘llab-quvvatlash markazi
              </h1>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 leading-none mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Onlayn yordamchi</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Qidiruv va Tozalash */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer ${
              searchOpen
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'
            }`}
            title="Xabarlarni qidirish"
            aria-label="Qidirish"
          >
            <Icon name="ri-search-line" className="text-base sm:text-lg" />
          </button>

          <a
            href="https://t.me/medquiz_uz"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/25 transition-colors"
            title="Telegram admin"
          >
            <Icon name="ri-telegram-fill" className="text-base text-sky-500" />
            <span>Telegram</span>
          </a>

          <button
            type="button"
            onClick={handleClearChat}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            title="Chat tarixini tozalash"
            aria-label="Tozalash"
          >
            <Icon name="ri-delete-bin-line" className="text-base" />
          </button>
        </div>
      </header>

      {/* Qidiruv paneli (Faqat qidiruv bosilganda ochiladi) */}
      {searchOpen && (
        <div className="px-3 sm:px-6 py-2.5 bg-white dark:bg-[#111827] border-b border-slate-200/80 dark:border-white/10 animate-in slide-in-from-top-2 duration-150 shrink-0">
          <div className="relative max-w-2xl mx-auto flex items-center">
            <Icon name="ri-search-line" className="absolute left-3 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Xabarlardan qidirish..."
              autoFocus
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <Icon name="ri-close-circle-fill" className="text-sm" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. CHAT XABARLARI MAYDONI */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4">
        <div className="max-w-2xl mx-auto w-full space-y-4">
          {/* Sana ajratkichi */}
          <div className="text-center py-1">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-white/5">
              Bugun, {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })}
            </span>
          </div>

          {filteredMessages.map((msg) => {
            const isUser = msg.sender === 'user';

            if (isUser) {
              return (
                /* Foydalanuvchi xabari: MedQuiz uslubidagi o'ng tomon kartasi */
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[78%] rounded-2xl rounded-tr-xs bg-emerald-600 text-white p-3.5 sm:p-4 shadow-sm text-xs sm:text-sm leading-relaxed space-y-2">
                    {msg.file && (
                      <div className="overflow-hidden rounded-xl border border-white/20 bg-white/10">
                        {msg.file.type === 'image' ? (
                          <img
                            src={msg.file.dataUrl}
                            alt={msg.file.name}
                            className="max-h-60 w-auto rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setPreviewImage(msg.file!.dataUrl)}
                          />
                        ) : (
                          <div className="flex items-center gap-2.5 p-2.5 text-xs text-white">
                            <Icon name="ri-file-text-line" className="text-lg" />
                            <span className="truncate flex-1 font-semibold">{msg.file.name}</span>
                            <span className="text-[10px] opacity-80">{formatFileSize(msg.file.size)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.text && <p className="font-medium whitespace-pre-wrap">{msg.text}</p>}
                  </div>
                </div>
              );
            }

            /* Yordamchi xabari: Toza MedQuiz kartasi, tepada bitta avatar va ichida chiroyli Yo'l xaritasi */
            return (
              <div key={msg.id} className="flex items-start gap-2.5">
                {/* Yagona Yordamchi Avatari (faqat xabar boshida) */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs mt-0.5">
                  <Icon name="ri-stethoscope-fill" className="text-lg" />
                </div>

                <div className="flex-1 max-w-[90%] sm:max-w-[82%] space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">
                    MedQuiz Yordamchi
                  </span>

                  {/* Asosiy xabar kartasi */}
                  <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-[#111827] text-slate-900 dark:text-white p-4 sm:p-5 shadow-xs border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm leading-relaxed space-y-3">
                    {msg.text && (
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                        {msg.text}
                      </p>
                    )}

                    {/* Boshlang'ich mavzular tanlovi */}
                    {msg.options && msg.options.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Kerakli yo‘nalishni tanlang:
                        </p>
                        {msg.options.map((opt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSend(opt.query)}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 dark:bg-white/5 dark:hover:bg-emerald-950/20 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer text-left active:scale-[0.99]"
                          >
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                              <span>{opt.label}</span>
                            </span>
                            <Icon name="ri-arrow-right-s-line" className="text-base text-slate-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 🗺️ YO'L XARITASI (ROADMAP): Bosqichma-bosqich chiziqli vizual yo'riqnoma */}
                    {msg.roadmap && (
                      <div className="mt-3 p-3.5 sm:p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/15 space-y-3.5">
                        <div className="flex items-center gap-2 pb-2.5 border-b border-emerald-500/20">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs">
                            <Icon name="ri-map-2-line" />
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {msg.roadmap.title}
                          </h4>
                        </div>

                        {/* Vertikal tutashgan bosqichlar chizig'i */}
                        <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-emerald-500/40">
                          {msg.roadmap.steps.map((st) => (
                            <div key={st.step} className="relative">
                              {/* Bosqich doirasi */}
                              <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-xs ring-2 ring-white dark:ring-[#111827]">
                                {st.step}
                              </span>

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                                    {st.title}
                                  </p>
                                  {st.badge && (
                                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                      {st.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {st.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Harakat tugmalari: To'g'ridan-to'g'ri karta ichida MedQuiz uslubida */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-200/70 dark:border-white/10 flex flex-wrap gap-2">
                        {msg.actions.map((act, idx) => {
                          const isPrimary = act.primary;

                          if (act.external) {
                            return (
                              <a
                                key={idx}
                                href={act.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs ${
                                  isPrimary
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                    : 'border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                <Icon name="ri-external-link-line" />
                                <span>{act.label}</span>
                              </a>
                            );
                          }

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (act.link) setLocation(act.link);
                              }}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs ${
                                isPrimary
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                  : 'border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <Icon name="ri-arrow-right-line" />
                              <span>{act.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Yozmoqda indikatori */}
          {isTyping && (
            <div className="flex items-start gap-2.5 animate-in fade-in duration-150">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
                <Icon name="ri-stethoscope-fill" className="text-lg" />
              </div>
              <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-[#111827] px-4 py-3 shadow-xs border border-slate-200/80 dark:border-white/10 flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">
                  Yozilmoqda
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. FOOTER INPUT MAYDONI: Umumiy MedQuiz dizayn tizimiga mos, silliq rounded-xl shakllarda */}
      <footer className="border-t border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111827] p-3 sm:p-4 shrink-0 shadow-xs">
        <div className="max-w-2xl mx-auto w-full space-y-2">
          {/* Tanlangan fayl prebyusi */}
          {selectedFile && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/25 text-xs text-slate-900 dark:text-white">
              <div className="flex items-center gap-2 min-w-0">
                {selectedFile.type === 'image' ? (
                  <img
                    src={selectedFile.dataUrl}
                    alt={selectedFile.name}
                    className="h-8 w-8 rounded-lg object-cover border border-emerald-500/30 shrink-0"
                  />
                ) : (
                  <Icon name="ri-file-text-line" className="text-lg text-emerald-600 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-bold truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-400">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="Faylni olib tashlash"
              >
                <Icon name="ri-close-line" className="text-base" />
              </button>
            </div>
          )}

          {/* Yashirin fayl inputi */}
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
            {/* Fayl biriktirish tugmasi */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors cursor-pointer shadow-2xs"
              title="Fayl yoki rasm biriktirish (PDF, Word, rasm)"
              aria-label="Fayl biriktirish"
            >
              <Icon name="ri-attachment-2" className="text-xl" />
            </button>

            {/* Xabar yozish inputi */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Savolingizni yozing..."
              className="flex-1 h-11 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111827] transition-all"
            />

            {/* Yuborish tugmasi */}
            <button
              type="submit"
              disabled={!input.trim() && !selectedFile}
              className="flex h-11 px-4 sm:px-5 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
              title="Yuborish"
            >
              <span className="hidden sm:inline">Yuborish</span>
              <Icon name="ri-send-plane-fill" className="text-base" />
            </button>
          </form>
        </div>
      </footer>

      {/* Rasm to'liq o'lchamda ko'rish modali */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Ko‘rish"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-rose-600 transition-colors cursor-pointer"
            >
              <Icon name="ri-close-line" className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* Chat tarixini tozalash Alert Modali */}
      <AlertModal
        isOpen={clearChatConfirm}
        onClose={() => setClearChatConfirm(false)}
        onConfirm={executeClearChat}
        variant="warning"
        title="Yozishmalarni tozalash"
        description="Rostdan ham qo‘llab-quvvatlash chati yozishmalarini tozalamoqchimisiz? Barcha xabarlar o‘chiriladi."
        confirmText="Tozalash"
        cancelText="Bekor qilish"
      />
    </div>
  );
}
