import { useEffect, useRef, useState } from 'react';
import { Icon, Panel } from '@/components/chrome';
import { fetchChatMessages, sendChatMessage } from '@/lib/model';
import type { BattleChatMessage, Me } from '@/lib/types';

const QUICK_PHRASES = [
  'Men tayyorman! 🚀',
  'Omad barchaga! 🩺',
  'Qiyin savol ekan! 🧠',
  'Vaqt oz qoldi! ⚡',
  'Natijalarni ko‘ramiz! 🏆',
  'Zo‘r bellashuv bo‘lyapti! 🔥',
];

export function BattleChat({
  roomCode,
  me,
  open,
  onClose,
  onUnreadChange,
}: {
  roomCode: string;
  me: Me | null;
  open: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}) {
  const [messages, setMessages] = useState<BattleChatMessage[]>([]);
  const [text, setText] = useState('');
  const [lastTime, setLastTime] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. Load initial local storage messages
  useEffect(() => {
    if (!roomCode) return;
    try {
      const key = `medquiz-chat-${roomCode.toLowerCase()}`;
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          const max = parsed.reduce((acc, m) => Math.max(acc, m.createdAt || 0), 0);
          setLastTime(max);
        }
      }
    } catch {}
  }, [roomCode]);

  // 2. Listen to local CustomEvents for instant tab messaging
  useEffect(() => {
    const handler = (event: Event) => {
      const msg = (event as CustomEvent<BattleChatMessage>).detail;
      if (msg && msg.roomCode.toLowerCase() === roomCode.toLowerCase()) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setLastTime((prev) => Math.max(prev, msg.createdAt));
        if (!open && msg.userId !== me?.id) {
          setUnreadCount((c) => {
            const next = c + 1;
            onUnreadChange?.(next);
            return next;
          });
        }
      }
    };
    window.addEventListener('medquiz-battle-chat', handler);
    return () => window.removeEventListener('medquiz-battle-chat', handler);
  }, [roomCode, open, me?.id, onUnreadChange]);

  // 3. Poll server for messages from other devices
  useEffect(() => {
    if (!roomCode) return;
    const interval = window.setInterval(async () => {
      try {
        const fetched = await fetchChatMessages(roomCode, lastTime);
        if (Array.isArray(fetched) && fetched.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newOnes = fetched.filter((m) => !existingIds.has(m.id));
            if (!newOnes.length) return prev;
            return [...prev, ...newOnes];
          });
          const max = fetched.reduce((acc, m) => Math.max(acc, m.createdAt || 0), lastTime);
          setLastTime(max);

          if (!open) {
            const othersNew = fetched.filter((m) => m.userId !== me?.id);
            if (othersNew.length) {
              setUnreadCount((c) => {
                const next = c + othersNew.length;
                onUnreadChange?.(next);
                return next;
              });
            }
          }
        }
      } catch {}
    }, 1500);

    return () => window.clearInterval(interval);
  }, [roomCode, lastTime, open, me?.id, onUnreadChange]);

  // Clear unread count when chat opens
  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      onUnreadChange?.(0);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [open, onUnreadChange]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, open]);

  const handleSend = async (msgText: string) => {
    if (!msgText.trim() || !me || !roomCode) return;
    const clean = msgText.trim();
    setText('');
    await sendChatMessage(roomCode, me, clean);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-end sm:justify-end bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full sm:w-96 max-h-[85vh] sm:max-h-[600px] h-full flex flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <Icon name="ri-chat-3-line" className="text-base" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Guruh suhbati</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {roomCode.toUpperCase()}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {messages.length} ta xabar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Icon name="ri-close-line" className="text-xl" />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {!messages.length ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Icon name="ri-chat-smile-2-line" className="text-2xl" />
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Hozircha xabarlar yo‘q</p>
              <p className="text-[11px] mt-1 text-slate-400">
                Guruhdoshlaringizga birinchi xabarni yuboring yoki tezkor jumlalardan foydalaning!
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.userId === me?.id;
              const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={m.id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="h-7 w-7 rounded-full overflow-hidden bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {m.userAvatar ? (
                      <img src={m.userAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      m.userName.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {isMe ? 'Siz' : m.userName}
                      </span>
                      <span className="text-[10px] text-slate-400">{time}</span>
                    </div>
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-xs ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-xs'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white rounded-tl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Phrases Bar */}
        <div className="px-3 py-1.5 border-t border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {QUICK_PHRASES.map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => handleSend(phrase)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(text);
          }}
          className="p-3 border-t border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111827] flex items-center gap-2"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Xabar yozing..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="h-9 w-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <Icon name="ri-send-plane-2-fill" className="text-base" />
          </button>
        </form>
      </div>
    </div>
  );
}
