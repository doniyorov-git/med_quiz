import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Companion, type CompanionMood } from '@/components/companion';
import { Icon } from '@/components/chrome';
import { useBanks, useMistakes, useStore } from '@/lib/store';
import type { Bank, MistakeItem } from '@/lib/types';

/* ---------- types ---------- */
type Attachment = {
  id: string;
  name: string;
  kind: 'image' | 'text' | 'other';
  /** data URL for images, plain text for text files */
  data?: string;
  size: number;
};
type Msg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  files?: { name: string; kind: Attachment['kind']; preview?: string }[];
  source?: 'ai' | 'local';
};

const STORE_KEY = 'medquiz-v2-ai-chat';
const LANG_KEY = 'medquiz-v2-ai-lang';
const LANGS = [
  { code: 'uz-UZ', label: 'O‘zbekcha' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'en-US', label: 'English' },
];
const MAX_FILES = 4;
const MAX_IMAGE_SIDE = 1280;
const MAX_TEXT_CHARS = 20000;

const mid = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/* ---------- file helpers ---------- */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Fayl o‘qilmadi'));
    r.readAsDataURL(file);
  });
}
function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Fayl o‘qilmadi'));
    r.readAsText(file);
  });
}
async function shrinkImage(file: File): Promise<string> {
  const url = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Rasm ochilmadi'));
    i.src = url;
  });
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return url;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.82);
}
const TEXT_EXT = /\.(txt|md|csv|json|tsv|log)$/i;

async function fileToAttachment(file: File): Promise<Attachment> {
  const base = { id: mid(), name: file.name, size: file.size };
  if (file.type.startsWith('image/')) return { ...base, kind: 'image', data: await shrinkImage(file) };
  if (file.type.startsWith('text/') || TEXT_EXT.test(file.name)) {
    const text = (await readAsText(file)).slice(0, MAX_TEXT_CHARS);
    return { ...base, kind: 'text', data: text };
  }
  return { ...base, kind: 'other' };
}

/* ---------- offline helper (used when the AI server is unreachable) ---------- */
function norm(s: string) {
  return s.toLowerCase().replace(/[‘’`ʻʼ']/g, "'");
}
function tokens(s: string) {
  return norm(s)
    .split(/[^a-z0-9а-яё']+/i)
    .filter((w) => w.length > 2);
}
function correctText(q: { options: { text: string; correct: boolean }[] }) {
  return q.options.filter((o) => o.correct).map((o) => o.text).join('; ');
}

function localAnswer(question: string, banks: Bank[], mistakes: MistakeItem[]): string {
  const q = norm(question);
  const wantsMistakes = /xato|mistake|ошибк|noto'g'ri/.test(q);
  if (wantsMistakes) {
    const list = mistakes.filter((m) => !m.saved || m.pickedIndices?.length).slice(0, 5);
    if (!list.length) return 'Hozircha xatolaringiz yo‘q. Test yechganingizdan keyin xatolar shu yerda tahlil qilinadi. 🎉';
    return (
      'Oxirgi xatolaringiz va to‘g‘ri javoblari:\n\n' +
      list.map((m, i) => `${i + 1}. ${m.prompt}\n   ✅ ${correctText(m)}`).join('\n\n') +
      '\n\n«Xatolarim» bo‘limida “Xatolardan test” tugmasi bilan shularni mashq qilishingiz mumkin.'
    );
  }
  const words = tokens(question);
  if (!words.length) return 'Savolingizni biroz batafsilroq yozing.';
  const hits: { score: number; prompt: string; answer: string; bank: string }[] = [];
  const add = (prompt: string, options: { text: string; correct: boolean }[], bank: string) => {
    const hay = norm(prompt + ' ' + options.map((o) => o.text).join(' '));
    const score = words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
    if (score >= Math.max(1, Math.ceil(words.length / 2))) hits.push({ score, prompt, answer: correctText({ options }), bank });
  };
  banks.forEach((b) => (b.questions ?? []).forEach((qq) => add(qq.prompt, qq.options, b.name)));
  mistakes.forEach((m) => add(m.prompt, m.options, m.bankName));
  hits.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const top = hits.filter((h) => (seen.has(h.prompt) ? false : (seen.add(h.prompt), true))).slice(0, 3);
  if (!top.length) {
    return 'AI server hozircha ulanmagan, shuning uchun faqat o‘z to‘plamlaringizdan qidira olaman — bu mavzu bo‘yicha savol topilmadi.';
  }
  return (
    'AI server ulanmagan, shuning uchun to‘plamlaringizdan eng mos savollarni topdim:\n\n' +
    top.map((h, i) => `${i + 1}. ${h.prompt}\n   ✅ ${h.answer}\n   📚 ${h.bank}`).join('\n\n')
  );
}

/* ---------- speech recognition ---------- */
type SR = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
function getSR(): (new () => SR) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const SUGGESTIONS = [
  { icon: 'ri-error-warning-line', text: 'Xatolarimni tushuntirib ber' },
  { icon: 'ri-heart-pulse-line', text: 'Yurak qon aylanishi bo‘yicha qisqa konspekt tuz' },
  { icon: 'ri-lightbulb-line', text: 'Menga eslab qolish uchun mnemonika ber' },
];

/* ---------- page ---------- */
export function AiChat() {
  const { me } = useStore();
  const banks = useBanks();
  const mistakes = useMistakes();

  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) || 'uz-UZ';
    } catch {
      return 'uz-UZ';
    }
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const srRef = useRef<SR | null>(null);
  const baseInput = useRef('');
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const speakTimer = useRef<number>(0);
  const sttSupported = useMemo(() => typeof window !== 'undefined' && !!getSR(), []);

  // persist (without heavy previews)
  useEffect(() => {
    try {
      const slim = msgs.slice(-40).map((m) => ({ ...m, files: m.files?.map((f) => ({ name: f.name, kind: f.kind })) }));
      localStorage.setItem(STORE_KEY, JSON.stringify(slim));
    } catch {
      /* storage is optional */
    }
  }, [msgs]);
  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, busy]);
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [input]);
  useEffect(
    () => () => {
      srRef.current?.abort();
      abortRef.current?.abort();
      window.clearTimeout(speakTimer.current);
    },
    [],
  );

  const flash = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice((n) => (n === text ? null : n)), 3200);
  }, []);

  /* --- voice input --- */
  const stopListening = useCallback(() => {
    srRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SRClass = getSR();
    if (!SRClass) {
      flash('Brauzeringiz ovozni matnga o‘girishni qo‘llamaydi. Chrome yoki Safari ishlating.');
      return;
    }
    try {
      const sr = new SRClass();
      sr.lang = lang;
      sr.interimResults = true;
      sr.continuous = true;
      baseInput.current = input ? input.replace(/\s*$/, ' ') : '';
      sr.onresult = (e: any) => {
        let text = '';
        for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
        setInput(baseInput.current + text);
      };
      sr.onerror = (e: any) => {
        const code = e?.error;
        if (code === 'not-allowed' || code === 'service-not-allowed') flash('Mikrofonga ruxsat berilmagan. Brauzer sozlamalaridan ruxsat bering.');
        else if (code === 'no-speech') flash('Ovoz eshitilmadi. Qayta urinib ko‘ring.');
        else if (code === 'language-not-supported') flash('Bu til qurilmangizda qo‘llanmaydi. Boshqa tilni tanlang.');
        else if (code !== 'aborted') flash('Ovozni aniqlashda xatolik.');
        setListening(false);
      };
      sr.onend = () => setListening(false);
      srRef.current = sr;
      sr.start();
      setListening(true);
    } catch {
      flash('Mikrofonni ishga tushirib bo‘lmadi.');
      setListening(false);
    }
  }, [flash, input, lang]);

  /* --- files --- */
  const onPickFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const room = MAX_FILES - files.length;
    if (room <= 0) {
      flash(`Eng ko‘pi bilan ${MAX_FILES} ta fayl biriktirish mumkin.`);
      return;
    }
    const picked = Array.from(list).slice(0, room);
    const out: Attachment[] = [];
    for (const f of picked) {
      if (f.size > 12 * 1024 * 1024) {
        flash(`«${f.name}» juda katta (12 MB dan oshmasin).`);
        continue;
      }
      try {
        out.push(await fileToAttachment(f));
      } catch (err) {
        flash(err instanceof Error ? err.message : 'Faylni o‘qib bo‘lmadi');
      }
    }
    if (out.length) setFiles((cur) => [...cur, ...out]);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* --- companion speech (browser TTS, optional) --- */
  const speak = useCallback(
    (text: string) => {
      try {
        const synth = window.speechSynthesis;
        if (!synth) return;
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}✅📚]/gu, ''));
        u.lang = lang;
        u.rate = 1.02;
        u.onstart = () => setSpeaking(true);
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
        synth.speak(u);
      } catch {
        /* optional */
      }
    },
    [lang],
  );
  const [voiceOut, setVoiceOut] = useState(false);

  /* --- send --- */
  const send = useCallback(
    async (override?: string) => {
      const text = (override ?? input).trim();
      if ((!text && !files.length) || busy) return;
      if (listening) stopListening();

      const userMsg: Msg = {
        id: mid(),
        role: 'user',
        text: text || '(fayl yuborildi)',
        files: files.map((f) => ({ name: f.name, kind: f.kind, preview: f.kind === 'image' ? f.data : undefined })),
      };
      const history = [...msgs, userMsg];
      setMsgs(history);
      setInput('');
      const sendFiles = files;
      setFiles([]);
      setBusy(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      let reply = '';
      let source: Msg['source'] = 'ai';
      try {
        const base = (import.meta.env.BASE_URL || './').replace(/\/?$/, '/');
        const res = await fetch(`${base}ai.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            user: { name: me?.name ?? '' },
            messages: history.slice(-12).map((m) => ({ role: m.role, content: m.text })),
            attachments: sendFiles.map((f) => ({ name: f.name, kind: f.kind, data: f.kind === 'other' ? undefined : f.data })),
          }),
        });
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || !ct.includes('json')) throw new Error(`http ${res.status}`);
        const data = (await res.json()) as { reply?: string; error?: string };
        if (!data.reply) throw new Error(data.error || 'empty');
        reply = data.reply;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          setBusy(false);
          return;
        }
        source = 'local';
        reply = localAnswer(text, banks, mistakes);
        if (sendFiles.length) reply += '\n\n(Fayllarni tahlil qilish uchun AI server ulangan bo‘lishi kerak.)';
      }
      setMsgs((cur) => [...cur, { id: mid(), role: 'assistant', text: reply, source }]);
      setBusy(false);
      if (voiceOut) speak(reply);
    },
    [banks, busy, files, input, listening, me?.name, mistakes, msgs, speak, stopListening, voiceOut],
  );

  const clearChat = () => {
    abortRef.current?.abort();
    window.speechSynthesis?.cancel();
    setMsgs([]);
    setBusy(false);
  };

  const mood: CompanionMood = speaking ? 'talking' : busy ? 'thinking' : listening ? 'listening' : 'idle';
  const hasChat = msgs.length > 0;
  const hello = me?.name ? `Salom, ${me.name.split(' ')[0]}!` : 'Salom!';
  const bubble = listening ? 'Eshitaman... 🎧' : busy ? 'O‘ylayapman...' : null;

  return (
    <div className="mx-auto flex h-[calc(100dvh-9.5rem)] max-w-3xl flex-col lg:h-[calc(100dvh-7rem)]">
      {/* Header with the companion */}
      <div
        className={`relative overflow-hidden rounded-[18px] border border-slate-200/80 bg-gradient-to-b from-emerald-50 via-white to-white shadow-sm transition-all duration-500 dark:border-white/10 dark:from-[#0f1a1a] dark:via-[#111827] dark:to-[#111827] ${
          hasChat ? 'px-3 py-2' : 'px-4 pb-4 pt-6'
        }`}
      >
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-teal-300/30 blur-3xl dark:bg-teal-500/10" />
        <div className="pointer-events-none absolute -right-10 top-4 h-40 w-40 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-500/10" />
        <div className={`relative flex ${hasChat ? 'items-center gap-3' : 'flex-col items-center text-center'}`}>
          <Companion size={hasChat ? 84 : 190} mood={mood} bubble={bubble} className={hasChat ? '-my-1 shrink-0' : ''} />
          <div className={hasChat ? 'min-w-0 flex-1' : 'mt-1'}>
            <h1 className={`font-display font-bold text-slate-900 dark:text-white ${hasChat ? 'text-base' : 'text-2xl'}`}>
              {hasChat ? 'Pufi — AI yordamchi' : `${hello} Men Pufi 💚`}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasChat
                ? 'Yozing, gapiring yoki fayl yuboring'
                : 'MedQuiz yordamchisiman. Savol bering, ovoz bilan gapiring yoki konspekt/rasm yuboring. Meni bosib ko‘ring!'}
            </p>
          </div>
          {hasChat && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setVoiceOut((v) => {
                    if (v) window.speechSynthesis?.cancel();
                    return !v;
                  });
                }}
                className={`rounded-[10px] p-2 text-lg transition-colors ${voiceOut ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                aria-label="Javoblarni ovozda o‘qish"
                title="Javoblarni ovozda o‘qish"
              >
                <Icon name={voiceOut ? 'ri-volume-up-line' : 'ri-volume-mute-line'} />
              </button>
              <button
                type="button"
                onClick={clearChat}
                className="rounded-[10px] p-2 text-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                aria-label="Suhbatni tozalash"
                title="Suhbatni tozalash"
              >
                <Icon name="ri-delete-bin-line" />
              </button>
            </div>
          )}
        </div>

        {!hasChat && (
          <div className="relative mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.text}
                type="button"
                onClick={() => send(s.text)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-emerald-400 hover:text-emerald-700 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              >
                <Icon name={s.icon} className="text-emerald-500" />
                {s.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-1 py-3" aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-xs ${
                m.role === 'user'
                  ? 'rounded-br-md bg-emerald-600 text-white'
                  : 'rounded-bl-md border border-slate-200/80 bg-white text-slate-800 dark:border-white/10 dark:bg-[#1a2231] dark:text-slate-100'
              }`}
            >
              {m.files?.length ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {m.files.map((f, i) =>
                    f.preview ? (
                      <img key={i} src={f.preview} alt={f.name} className="max-h-32 rounded-lg object-cover" />
                    ) : (
                      <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-black/10 px-2 py-1 text-[11px] font-medium">
                        <Icon name={f.kind === 'text' ? 'ri-file-text-line' : f.kind === 'image' ? 'ri-image-line' : 'ri-attachment-2'} />
                        <span className="max-w-[140px] truncate">{f.name}</span>
                      </span>
                    ),
                  )}
                </div>
              ) : null}
              {m.text}
              {m.role === 'assistant' && m.source === 'local' && (
                <p className="mt-2 border-t border-dashed border-slate-300 pt-1.5 text-[10px] font-medium text-slate-400 dark:border-white/15">
                  Oflayn rejim: AI server ulanmagan, javob to‘plamlaringizdan olindi
                </p>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200/80 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1a2231]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="relative">
        {notice && (
          <div className="absolute -top-10 left-0 right-0 mx-auto w-fit max-w-full rounded-full bg-slate-900 px-3 py-1.5 text-center text-xs font-medium text-white shadow-lg">
            {notice}
          </div>
        )}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((f) => (
              <span key={f.id} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2 text-xs font-medium text-slate-700 shadow-xs dark:border-white/10 dark:bg-[#1a2231] dark:text-slate-200">
                {f.kind === 'image' && f.data ? (
                  <img src={f.data} alt="" className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Icon name={f.kind === 'text' ? 'ri-file-text-line' : 'ri-attachment-2'} />
                  </span>
                )}
                <span className="max-w-[120px] truncate">{f.name}</span>
                <button type="button" onClick={() => setFiles((cur) => cur.filter((x) => x.id !== f.id))} className="text-slate-400 hover:text-rose-500" aria-label="Olib tashlash">
                  <Icon name="ri-close-line" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div
          className={`flex items-end gap-1.5 rounded-[18px] border bg-white p-1.5 shadow-md transition dark:bg-[#111827] ${
            listening ? 'border-emerald-400 ring-4 ring-emerald-400/20' : 'border-slate-200 dark:border-white/10'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.txt,.md,.csv,.json,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => void onPickFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-xl text-slate-500 transition hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:bg-white/5"
            aria-label="Fayl biriktirish"
            title="Rasm yoki fayl biriktirish"
          >
            <Icon name="ri-attachment-2" />
          </button>
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={listening ? 'Eshitaman... gapiring' : 'Savolingizni yozing...'}
            className="max-h-[140px] min-h-[40px] flex-1 resize-none bg-transparent px-1.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
          {sttSupported && (
            <div className="flex shrink-0 items-center">
              <select
                value={lang}
                onChange={(e) => {
                  if (listening) stopListening();
                  setLang(e.target.value);
                }}
                className="hidden h-8 rounded-lg bg-transparent px-1 text-[11px] font-semibold text-slate-500 outline-none sm:block dark:text-slate-400"
                aria-label="Ovoz tili"
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code} className="text-slate-900">
                    {l.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => (listening ? stopListening() : startListening())}
                className={`relative flex h-10 w-10 items-center justify-center rounded-[12px] text-xl transition active:scale-95 ${
                  listening ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                }`}
                aria-label={listening ? 'Yozishni to‘xtatish' : 'Ovoz bilan yozish'}
                title={listening ? 'To‘xtatish' : 'Ovoz bilan yozish'}
              >
                {listening && <span className="absolute inset-0 animate-ping rounded-[12px] bg-rose-400/50" />}
                <Icon name={listening ? 'ri-stop-fill' : 'ri-mic-line'} className="relative" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || (!input.trim() && !files.length)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-emerald-600 text-lg text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-95 disabled:opacity-40"
            aria-label="Yuborish"
          >
            <Icon name="ri-send-plane-2-fill" />
          </button>
        </div>
        {sttSupported && (
          <div className="mt-1.5 flex justify-end sm:hidden">
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-lg bg-transparent text-[11px] font-semibold text-slate-500 outline-none" aria-label="Ovoz tili">
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  🎙 {l.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
