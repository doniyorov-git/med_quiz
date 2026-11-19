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

interface SupportMessage {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  avatar?: string | null;
  text?: string;
  file?: FileAttachment;
  time: string;
  options?: { label: string; query: string }[];
  choices?: string[];
  summaryCard?: { title: string; items: { label: string; value: string }[] };
  actions?: { label: string; link?: string; external?: boolean; primary?: boolean }[];
}

const STORAGE_KEY = 'medquiz_support_chat_messages_v3';

const INITIAL_MESSAGES: SupportMessage[] = [
  {
    id: 'm-welcome',
    sender: 'support',
    senderName: 'Assistant',
    text: 'Assalomu alaykum! MedQuiz yordamchisiga xush kelibsiz. Qaysi masala bo‘yicha yordam beray?',
    time: 'Bugun, hozir',
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
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
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
    choices?: string[];
    summaryCard?: SupportMessage['summaryCard'];
    actions?: SupportMessage['actions'];
  } => {
    const q = userQuery.toLowerCase();

    if (hasFile) {
      return {
        text: `Faylingiz muvaffaqiyatli qabul qilindi. Shifokor-moderatorlarimiz uni tekshirishni boshladi.`,
        summaryCard: {
          title: 'Qabul qilingan hujjat',
          items: [
            { label: 'Fayl', value: fileName || 'Hujjat' },
            { label: 'Holat', value: 'Ko‘rib chiqilmoqda' },
            { label: 'Bo‘lim', value: 'MedQuiz Moderatsiya' },
          ],
        },
        actions: [
          { label: 'Bekor qilish', link: '/support' },
          { label: 'Telegram admin', link: 'https://t.me/medquiz_uz', external: true, primary: true },
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
        text: `Word (.docx), PDF yoki TXT fayllardan testlarni avtomatik yuklash mumkin:`,
        summaryCard: {
          title: 'Yuklash qoidalari',
          items: [
            { label: 'Format', value: '.docx, .pdf, .txt' },
            { label: 'To‘g‘ri javob', value: 'Oldiga «*» yoki «+» belgisi' },
            { label: 'Variantlar', value: 'Kamida 2 ta (A, B, C, D)' },
          ],
        },
        choices: ['To‘plam ochish', 'Namuna yuklash', 'Format qoidalari'],
        actions: [
          { label: 'Yopish', link: '/support' },
          { label: 'To‘plamlarga o‘tish', link: '/banks', primary: true },
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
        text: `Do‘stlaringiz bilan jonli musobaqa (Battle) o‘tkazish bo‘yicha ko‘rsatma:`,
        summaryCard: {
          title: 'Battle parametrlari',
          items: [
            { label: 'Rejim', value: 'Klassik, Sudden Death, Speed Run' },
            { label: 'Chaqiruv', value: 'Onlayn modal bildirishnoma' },
            { label: 'Mukofot', value: '+10 MedCoins g‘olibga' },
          ],
        },
        actions: [
          { label: 'Do‘stlar ro‘yxati', link: '/friends' },
          { label: 'Battle boshlash', link: '/battle', primary: true },
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
        text: `Imtihon kalendari Spaced Repetition (SRS) orqali kunlik savollar me’yorini avtomatik taqsimlaydi:`,
        summaryCard: {
          title: 'O‘quv rejasi',
          items: [
            { label: 'Algoritm', value: 'SM-2 Intervalli takrorlash' },
            { label: 'Imtihon sanasi', value: 'To‘plamlar sahifasidan' },
            { label: 'Bildirishnoma', value: 'Tepada qo‘ng‘iroqcha' },
          ],
        },
        actions: [
          { label: 'Ortga', link: '/support' },
          { label: 'Kalendarga o‘tish', link: '/banks', primary: true },
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
        text: `Test savolidagi xatolik bo‘yicha: Test yechayotganda bayroqcha yoki shikoyat tugmasini bossangiz, savol adashganlar bankiga saqlanadi.`,
        summaryCard: {
          title: 'Xatolik tekshiruvi',
          items: [
            { label: 'Bo‘lim', value: 'Xatolarim banki' },
            { label: 'AI Tahlil', value: 'Patofiziologik asos' },
          ],
        },
        actions: [
          { label: 'Xatolarim', link: '/mistakes' },
          { label: 'Adminga yozish', link: 'https://t.me/medquiz_uz', external: true, primary: true },
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
        text: `MedQuiz ma’muriyati va shifokor-maslahatchilar bilan Telegram orqali to‘g‘ridan-to‘g‘ri bog‘lanishingiz mumkin.`,
        summaryCard: {
          title: 'Aloqa markazi',
          items: [
            { label: 'Telegram', value: '@medquiz_uz' },
            { label: 'Vaqt', value: '24/7 doimiy aloqa' },
            { label: 'Kafolat', value: '10 daqiqa ichida javob' },
          ],
        },
        actions: [
          { label: 'Bekor qilish', link: '/support' },
          { label: 'Telegram ochish', link: 'https://t.me/medquiz_uz', external: true, primary: true },
        ],
      };
    }

    return {
      text: `Savolingiz qabul qilindi. Sizga qanday qo‘shimcha yordam bera olaman?`,
      choices: ['Test yuklash', 'Battle qoidalari', 'Imtihon rejasi', 'Admin aloqa'],
      actions: [
        { label: 'Bosh sahifa', link: '/dashboard' },
        { label: 'Telegram yordam', link: 'https://t.me/medquiz_uz', external: true, primary: true },
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
        senderName: 'Assistant',
        text: answer.text,
        summaryCard: answer.summaryCard,
        choices: answer.choices,
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f4f5f7] dark:bg-[#0b0f19] text-slate-900 dark:text-white overflow-hidden font-sans">
      {/* 1. TOP HEADER: Exact clean redesign like the image */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200/60 dark:border-white/5 shrink-0">
        {/* Left: Back chevron button */}
        <button
          type="button"
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title="Ortga"
          aria-label="Ortga"
        >
          <Icon name="ri-arrow-left-s-line" className="text-2xl" />
        </button>

        {/* Center: Title "Support Assistant" */}
        <div className="text-center">
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Support Assistant
          </h1>
        </div>

        {/* Right: Search icon & Clear options */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors cursor-pointer ${
              searchOpen
                ? 'bg-slate-100 dark:bg-white/10 text-emerald-600 dark:text-emerald-400'
                : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200'
            }`}
            title="Xabarlarni qidirish"
            aria-label="Qidirish"
          >
            <Icon name="ri-search-line" className="text-lg" />
          </button>

          <button
            type="button"
            onClick={handleClearChat}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            title="Chat tarixini tozalash"
            aria-label="Tozalash"
          >
            <Icon name="ri-delete-bin-line" className="text-base" />
          </button>
        </div>
      </header>

      {/* Optional Search Bar dropdown */}
      {searchOpen && (
        <div className="px-4 py-2.5 bg-white dark:bg-[#111827] border-b border-slate-200/60 dark:border-white/5 animate-in slide-in-from-top-2 duration-150 shrink-0">
          <div className="relative max-w-xl mx-auto flex items-center">
            <Icon name="ri-search-line" className="absolute left-3 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Xabarlardan qidirish..."
              autoFocus
              className="w-full h-9 pl-9 pr-8 rounded-full bg-slate-100 dark:bg-white/5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
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

      {/* 2. CHAT MESSAGES AREA: Exactly styled like the "After" mockup */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
        <div className="max-w-xl mx-auto w-full space-y-5">
          {/* Date Label: "Nov 28" / localized current date */}
          <div className="text-center pt-1 pb-1">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 select-none">
              {new Date().toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {filteredMessages.map((msg) => {
            const isUser = msg.sender === 'user';

            if (isUser) {
              return (
                /* User Message: Clean white bubble, right-aligned */
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-3.5 sm:p-4 shadow-xs border border-slate-200/60 dark:border-white/5 text-xs sm:text-sm leading-relaxed space-y-2">
                    {/* File Attachment */}
                    {msg.file && (
                      <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-white/10">
                        {msg.file.type === 'image' ? (
                          <img
                            src={msg.file.dataUrl}
                            alt={msg.file.name}
                            className="max-h-60 w-auto rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setPreviewImage(msg.file!.dataUrl)}
                          />
                        ) : (
                          <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-white/5 text-xs">
                            <Icon name="ri-file-text-line" className="text-lg text-emerald-500" />
                            <span className="truncate flex-1 font-semibold">{msg.file.name}</span>
                            <span className="text-[10px] text-slate-400">{formatFileSize(msg.file.size)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.text && <p className="font-medium whitespace-pre-wrap">{msg.text}</p>}
                  </div>
                </div>
              );
            }

            /* Assistant Message: Robot avatar on left, "Assistant" label on top, clean white card */
            return (
              <div key={msg.id} className="flex items-end gap-2.5 group">
                {/* Robot Avatar (exactly like the image) */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200/80 dark:bg-white/10 border border-slate-300/60 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-2xs overflow-hidden mb-1">
                  <span className="text-lg select-none">🤖</span>
                </div>

                <div className="flex-1 max-w-[88%] sm:max-w-[82%] space-y-1.5">
                  {/* Subtle "Assistant" label */}
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 ml-1 block">
                    Assistant
                  </span>

                  {/* Main Bubble Card */}
                  <div className="rounded-3xl bg-white dark:bg-[#151c2c] text-slate-900 dark:text-slate-100 p-4 sm:p-5 shadow-xs border border-slate-200/60 dark:border-white/5 text-xs sm:text-sm leading-relaxed space-y-3">
                    {/* Text */}
                    {msg.text && (
                      <p className="font-medium whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                        {msg.text}
                      </p>
                    )}

                    {/* Interactive Option Cards (with chevron >, exactly like the mockup: "New bicycle >") */}
                    {msg.options && msg.options.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {msg.options.map((opt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSend(opt.query)}
                            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer text-left active:scale-[0.99]"
                          >
                            <span>{opt.label}</span>
                            <Icon name="ri-arrow-right-s-line" className="text-base text-slate-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Inline choice pills (like $50 $100 $300 in the mockup) */}
                    {msg.choices && msg.choices.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {msg.choices.map((ch, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSend(ch)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all active:scale-95 cursor-pointer"
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Summary Detail Card (like the nested card in the mockup: Amount, From, To) */}
                    {msg.summaryCard && (
                      <div className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02] p-3.5 space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          {msg.summaryCard.title}
                        </span>
                        {msg.summaryCard.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between py-0.5">
                            <span className="text-slate-500 dark:text-slate-400">{it.label}:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{it.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Pill Buttons beneath the bubble:
                      Exact recreation of [ Cancel ] and bright lime-green [ Confirm ] from the mockup! */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {msg.actions.map((act, idx) => {
                        const isPrimary = act.primary || idx === msg.actions!.length - 1;

                        const buttonClasses = isPrimary
                          ? 'px-6 py-2.5 rounded-full bg-[#ccff00] hover:bg-[#bbf000] text-slate-900 font-extrabold text-xs shadow-xs transition-all active:scale-95 cursor-pointer text-center'
                          : 'px-5 py-2.5 rounded-full bg-white dark:bg-[#151c2c] hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all active:scale-95 cursor-pointer text-center';

                        if (act.external) {
                          return (
                            <a
                              key={idx}
                              href={act.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={buttonClasses}
                            >
                              {act.label}
                            </a>
                          );
                        }

                        if (act.link) {
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setLocation(act.link!)}
                              className={buttonClasses}
                            >
                              {act.label}
                            </button>
                          );
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSend(act.label)}
                            className={buttonClasses}
                          >
                            {act.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-2.5 animate-in fade-in duration-150">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 shadow-2xs overflow-hidden mb-1">
                <span className="text-lg select-none">🤖</span>
              </div>
              <div className="rounded-3xl bg-white dark:bg-[#151c2c] p-3.5 shadow-xs border border-slate-200/60 dark:border-white/5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. FLOATING BOTTOM BAR: Exact recreation of the floating attachment button + pill input from the mockup */}
      <footer className="p-3 sm:p-5 shrink-0">
        <div className="max-w-xl mx-auto w-full space-y-2">
          {/* Selected File Badge */}
          {selectedFile && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-white/10 shadow-sm text-xs">
              <div className="flex items-center gap-2 min-w-0">
                {selectedFile.type === 'image' ? (
                  <img
                    src={selectedFile.dataUrl}
                    alt={selectedFile.name}
                    className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0"
                  />
                ) : (
                  <Icon name="ri-file-text-line" className="text-lg text-emerald-500" />
                )}
                <div className="min-w-0">
                  <p className="font-bold truncate text-slate-800 dark:text-slate-200">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-400">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1 rounded-full text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="Faylni olib tashlash"
              >
                <Icon name="ri-close-line" className="text-base" />
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
            className="flex items-center gap-2.5"
          >
            {/* Left: Floating square attachment button with rounded-2xl */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
              title="Fayl yoki rasm biriktirish"
              aria-label="Fayl biriktirish"
            >
              <Icon name="ri-upload-2-line" className="text-xl" />
            </button>

            {/* Right: Floating rounded-full pill bar */}
            <div className="flex-1 h-12 rounded-full bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-white/10 px-4 flex items-center justify-between shadow-sm focus-within:border-slate-300 dark:focus-within:border-white/20 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 min-w-0 pr-2"
              />

              {/* Up-arrow Send Button inside the pill on the right */}
              <button
                type="submit"
                disabled={!input.trim() && !selectedFile}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
                  input.trim() || selectedFile
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs active:scale-95'
                    : 'bg-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed'
                }`}
                title="Yuborish"
                aria-label="Yuborish"
              >
                <Icon name="ri-arrow-up-line" className="text-base font-bold" />
              </button>
            </div>
          </form>
        </div>
      </footer>

      {/* Image Preview Modal */}
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

      {/* Clear Chat Confirmation Alert Modal */}
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
