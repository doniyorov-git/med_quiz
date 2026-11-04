import { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * Pufi — MedQuiz brand companion.
 * Pseudo-3D (CSS perspective + layered gradients + spring physics), no WebGL needed.
 *  - follows the pointer (body tilts, eyes look at the cursor)
 *  - tap / click = poke: squish, giggle, heart flash, floating hearts, soft sound
 *  - drag = push, then it wobbles back with a spring
 *  - moods: idle | listening | thinking | talking
 */
export type CompanionMood = 'idle' | 'listening' | 'thinking' | 'talking';

type Particle = { id: number; x: number; dx: number; emoji: string };

const POKE_LINES = [
  'Voy! 😆',
  'Qitiqlama!',
  'Hihi 💚',
  'Men shu yerdaman!',
  'Yana bosib ko‘r 😄',
  'Yuragim yonyapti ✨',
];

let audioCtx: AudioContext | null = null;
function pip(freq = 640) {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    audioCtx = audioCtx ?? new AC();
    const ctx = audioCtx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.6, t + 0.09);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  } catch {
    /* audio is optional */
  }
}

export function Companion({
  size = 220,
  mood = 'idle',
  className = '',
  bubble,
  onPoke,
}: {
  size?: number;
  mood?: CompanionMood;
  className?: string;
  /** Optional speech bubble text (e.g. from chat). Poke lines are used when empty. */
  bubble?: string | null;
  onPoke?: (count: number) => void;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const stageRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const eyesRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  // physics state lives in refs: no React re-render per frame
  const phys = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, rx: 0, ry: 0, drag: false, sx: 0, sy: 0, squish: 0, vsq: 0 });
  const raf = useRef(0);

  const [pokeState, setPokeState] = useState<'none' | 'happy' | 'dizzy'>('none');
  const [line, setLine] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const pokes = useRef(0);
  const pokeTimer = useRef<number>(0);
  const lineTimer = useRef<number>(0);
  const lastPoke = useRef(0);
  const pid = useRef(0);
  const [blink, setBlink] = useState(false);

  // blink every few seconds
  useEffect(() => {
    let t = 0;
    const loop = () => {
      t = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 140);
        loop();
      }, 2200 + Math.random() * 2800);
    };
    loop();
    return () => window.clearTimeout(t);
  }, []);

  // spring animation loop
  useEffect(() => {
    const p = phys.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const step = () => {
      if (!p.drag) {
        // spring back to rest
        p.vx += (-p.x * 0.14);
        p.vy += (-p.y * 0.14);
        p.vx *= 0.82;
        p.vy *= 0.82;
        p.x += p.vx;
        p.y += p.vy;
      }
      p.vsq += -p.squish * 0.22;
      p.vsq *= 0.8;
      p.squish += p.vsq;

      // smooth tilt towards pointer
      p.rx += (p.tx - p.rx) * 0.12;
      p.ry += (p.ty - p.ry) * 0.12;

      const body = bodyRef.current;
      if (body) {
        const sq = p.squish;
        const sx = 1 + sq * 0.16;
        const sy = 1 - sq * 0.2;
        body.style.transform =
          `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotateX(${(p.rx - p.y * 0.2).toFixed(2)}deg) rotateY(${(p.ry + p.x * 0.25).toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      }
      const eyes = eyesRef.current;
      if (eyes) eyes.style.transform = `translate(${(p.ry * 0.9).toFixed(1)}px, ${(-p.rx * 0.8).toFixed(1)}px)`;
      const sh = shadowRef.current;
      if (sh) {
        const k = 1 - Math.min(Math.abs(p.y) / 120, 0.3) + p.squish * 0.08;
        sh.style.transform = `translateX(${(p.x * 0.5).toFixed(1)}px) scale(${k.toFixed(3)})`;
      }
      raf.current = requestAnimationFrame(step);
    };
    if (!reduce) raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const track = useCallback((clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (clientX - (r.left + r.width / 2)) / Math.max(r.width, 1);
    const dy = (clientY - (r.top + r.height / 2)) / Math.max(r.height, 1);
    const p = phys.current;
    p.tx = Math.max(-1, Math.min(1, dy)) * 10;
    p.ty = Math.max(-1, Math.min(1, dx)) * 14;
  }, []);

  // look at pointer anywhere on the page (desktop); touch devices only on contact
  useEffect(() => {
    const move = (e: PointerEvent) => track(e.clientX, e.clientY);
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [track]);

  const say = useCallback((text: string, ms = 1800) => {
    setLine(text);
    window.clearTimeout(lineTimer.current);
    lineTimer.current = window.setTimeout(() => setLine(null), ms);
  }, []);

  const poke = useCallback(() => {
    const now = Date.now();
    pokes.current = now - lastPoke.current < 900 ? pokes.current + 1 : 1;
    lastPoke.current = now;
    const p = phys.current;
    p.vsq += 2.4; // squish impulse
    p.vy -= 3;
    const dizzy = pokes.current >= 6;
    setPokeState(dizzy ? 'dizzy' : 'happy');
    window.clearTimeout(pokeTimer.current);
    pokeTimer.current = window.setTimeout(() => {
      setPokeState('none');
      pokes.current = 0;
    }, dizzy ? 1800 : 1100);
    say(dizzy ? 'Boshim aylanyapti... 😵‍💫' : POKE_LINES[Math.floor(Math.random() * POKE_LINES.length)]);
    pip(520 + Math.random() * 260);
    try {
      navigator.vibrate?.(14);
    } catch {
      /* ignore */
    }
    const id = ++pid.current;
    const emoji = ['💚', '💗', '✨', '💖'][Math.floor(Math.random() * 4)];
    setParticles((list) => [...list.slice(-6), { id, x: 40 + Math.random() * 20, dx: (Math.random() - 0.5) * 80, emoji }]);
    window.setTimeout(() => setParticles((list) => list.filter((q) => q.id !== id)), 1400);
    onPoke?.(pokes.current);
  }, [onPoke, say]);

  // drag to push, tap to poke
  const downAt = useRef<{ x: number; y: number; t: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    const p = phys.current;
    p.drag = true;
    p.sx = e.clientX - p.x;
    p.sy = e.clientY - p.y;
    downAt.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const p = phys.current;
    if (!p.drag) return;
    const lim = size * 0.28;
    const nx = Math.max(-lim, Math.min(lim, e.clientX - p.sx));
    const ny = Math.max(-lim, Math.min(lim, e.clientY - p.sy));
    p.vx = nx - p.x;
    p.vy = ny - p.y;
    p.x = nx;
    p.y = ny;
  };
  const onUp = (e: React.PointerEvent) => {
    const p = phys.current;
    p.drag = false;
    const d = downAt.current;
    downAt.current = null;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8 && Date.now() - d.t < 500) poke();
  };

  const talking = mood === 'talking';
  const thinking = mood === 'thinking';
  const listening = mood === 'listening';
  const happy = pokeState === 'happy';
  const dizzy = pokeState === 'dizzy';
  const eyesClosed = blink || happy;
  const shownLine = line ?? bubble ?? null;

  const eyeR = listening ? 1.12 : 1;
  const w = size;

  return (
    <div
      ref={stageRef}
      className={`companion-stage relative select-none ${className}`}
      style={{ width: w, height: w * 1.12, perspective: 900, touchAction: 'none' }}
    >
      {/* speech bubble */}
      {shownLine && (
        <div className="companion-bubble pointer-events-none absolute left-1/2 top-0 z-20 max-w-[85%] -translate-x-1/2 -translate-y-[88%] rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-center text-xs font-semibold text-slate-800 shadow-lg dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
          {shownLine}
          <span className="absolute left-1/2 top-full -mt-1 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white dark:border-white/10 dark:bg-slate-800" />
        </div>
      )}

      {/* floating hearts */}
      {particles.map((q) => (
        <span
          key={q.id}
          className="companion-float pointer-events-none absolute z-10 text-xl"
          style={{ left: `${q.x}%`, top: '30%', ['--dx' as string]: `${q.dx}px` }}
        >
          {q.emoji}
        </span>
      ))}

      {/* ground glow + shadow */}
      <div
        ref={shadowRef}
        className="absolute bottom-[1%] left-1/2 h-[8%] w-[62%] -translate-x-1/2 rounded-[50%]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.28), rgba(15,23,42,0) 70%)',
          filter: 'blur(4px)',
        }}
      />
      <div
        className="absolute bottom-[0%] left-1/2 h-[10%] w-[90%] -translate-x-1/2 rounded-[50%] opacity-70"
        style={{
          background: 'linear-gradient(90deg, rgba(45,212,191,0.55), rgba(244,114,182,0.5))',
          filter: 'blur(14px)',
        }}
      />

      {/* shared SVG defs */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <filter id={`fur${uid}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <radialGradient id={`heart${uid}`} cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#fff7d6" />
            <stop offset="100%" stopColor="#ffe29a" />
          </radialGradient>
        </defs>
      </svg>

      {/* body (3D tilt, squish, drag) */}
      <div
        ref={bodyRef}
        role="button"
        tabIndex={0}
        aria-label="MedQuiz yordamchisi Pufi. Bosib ko‘ring!"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            poke();
          }
        }}
        className={`companion-body absolute inset-x-[10%] top-[6%] bottom-[5%] cursor-grab outline-none active:cursor-grabbing ${thinking ? 'companion-think' : 'companion-idle'}`}
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        {/* silhouette with fuzzy fur edge */}
        <div className="absolute inset-0" style={{ filter: `url(#fur${uid}) drop-shadow(0 14px 18px rgba(71,85,105,0.25))` }}>
          <div
            className="absolute inset-0"
            style={{
              borderRadius: '48% 48% 44% 44% / 40% 40% 60% 60%',
              background:
                'radial-gradient(120% 90% at 30% 18%, #ffffff 0%, #f6f8ff 38%, #e9eefb 70%, #dfe6f6 100%)',
              boxShadow:
                'inset 14px -6px 26px rgba(45,212,191,0.38), inset -16px -8px 30px rgba(244,114,182,0.42), inset 0 18px 24px rgba(255,255,255,0.9)',
            }}
          />
        </div>

        {/* soft fur highlight */}
        <div
          className="pointer-events-none absolute left-[18%] top-[6%] h-[26%] w-[46%] rounded-[50%]"
          style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.95), rgba(255,255,255,0))', filter: 'blur(6px)' }}
        />

        {/* face */}
        <div ref={eyesRef} className="pointer-events-none absolute inset-x-0 top-[24%] h-[22%]" style={{ transform: 'translateZ(30px)' }}>
          {/* blush */}
          <span className="absolute left-[16%] top-[48%] h-[44%] w-[17%] rounded-[50%]" style={{ background: 'radial-gradient(ellipse, rgba(251,113,133,0.65), rgba(251,113,133,0) 70%)' }} />
          <span className="absolute right-[16%] top-[48%] h-[44%] w-[17%] rounded-[50%]" style={{ background: 'radial-gradient(ellipse, rgba(251,113,133,0.65), rgba(251,113,133,0) 70%)' }} />
          {/* eyes */}
          {[0, 1].map((i) => (
            <span
              key={i}
              className="absolute top-[4%]"
              style={{ [i === 0 ? 'left' : 'right']: '27%', width: `${8.5 * eyeR}%`, aspectRatio: '1' } as React.CSSProperties}
            >
              {eyesClosed ? (
                <svg viewBox="0 0 20 12" className="h-auto w-full overflow-visible">
                  <path d={happy ? 'M2 10 Q10 -2 18 10' : 'M2 4 Q10 9 18 4'} fill="none" stroke="#2b2236" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
              ) : dizzy ? (
                <svg viewBox="0 0 20 20" className="companion-spin h-auto w-full">
                  <path d="M10 10 m0 0 a2 2 0 1 1 3 1 a4 4 0 1 1 -6 -3 a6 6 0 1 1 9 4" fill="none" stroke="#2b2236" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <span className="relative block h-full w-full rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #4a3f5c 0%, #1c1626 60%, #0d0a14 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }}>
                  <span className="absolute left-[24%] top-[18%] h-[34%] w-[34%] rounded-full bg-white/95" />
                  <span className="absolute bottom-[18%] right-[22%] h-[16%] w-[16%] rounded-full bg-white/60" />
                </span>
              )}
            </span>
          ))}
          {/* mouth */}
          <svg viewBox="0 0 40 20" className="absolute left-1/2 top-[52%] w-[20%] -translate-x-1/2 overflow-visible">
            {talking || happy ? (
              <path
                className={talking ? 'companion-talk' : ''}
                d="M8 4 Q20 22 32 4 Z"
                fill="#fb7185"
                stroke="#e11d48"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            ) : dizzy ? (
              <path d="M8 12 Q14 6 20 12 T32 12" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
            ) : listening ? (
              <ellipse cx="20" cy="9" rx="4" ry="5" fill="#fb7185" stroke="#e11d48" strokeWidth="1.6" />
            ) : (
              <path d="M6 5 Q13 14 20 6 Q27 14 34 5" fill="none" stroke="#f0647d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </div>

        {/* glowing heart */}
        <div className="pointer-events-none absolute left-1/2 top-[48%] w-[46%] -translate-x-1/2" style={{ transform: 'translateX(-50%) translateZ(46px)' }}>
          <div
            className={`absolute inset-[-30%] rounded-full ${happy ? 'companion-flash' : listening ? 'companion-beat-fast' : 'companion-beat'}`}
            style={{ background: 'radial-gradient(circle, rgba(255,236,170,0.75), rgba(255,236,170,0) 65%)', filter: 'blur(6px)' }}
          />
          <svg viewBox="0 0 100 90" className={`relative w-full ${happy ? 'companion-flash' : listening ? 'companion-beat-fast' : 'companion-beat'}`} style={{ filter: 'drop-shadow(0 0 10px rgba(255,214,102,0.9))' }}>
            <path d="M50 84 C12 56 4 36 4 24 C4 11 14 3 26 3 C36 3 45 9 50 18 C55 9 64 3 74 3 C86 3 96 11 96 24 C96 36 88 56 50 84 Z" fill={`url(#heart${uid})`} />
            <ellipse cx="30" cy="22" rx="9" ry="5" fill="#fff" opacity="0.8" transform="rotate(-30 30 22)" />
          </svg>
        </div>

        {/* arms hugging the heart */}
        <span
          className="pointer-events-none absolute left-[9%] top-[53%] h-[22%] w-[30%] rounded-[50%]"
          style={{
            transform: 'rotate(-24deg) translateZ(60px)',
            background: 'radial-gradient(ellipse at 40% 30%, #ffffff, #eef1fb 60%, #dde4f5)',
            boxShadow: 'inset 6px -3px 12px rgba(45,212,191,0.3), 0 4px 8px rgba(100,116,139,0.18)',
            filter: `url(#fur${uid})`,
          }}
        />
        <span
          className="pointer-events-none absolute right-[9%] top-[53%] h-[22%] w-[30%] rounded-[50%]"
          style={{
            transform: 'rotate(24deg) translateZ(60px)',
            background: 'radial-gradient(ellipse at 60% 30%, #ffffff, #f7eef8 60%, #f0dcee)',
            boxShadow: 'inset -6px -3px 12px rgba(244,114,182,0.32), 0 4px 8px rgba(100,116,139,0.18)',
            filter: `url(#fur${uid})`,
          }}
        />

        {/* feet */}
        <span className="absolute bottom-[-2%] left-[24%] h-[8%] w-[20%] rounded-[50%] bg-gradient-to-b from-white to-slate-200 shadow-sm" />
        <span className="absolute bottom-[-2%] right-[24%] h-[8%] w-[20%] rounded-[50%] bg-gradient-to-b from-white to-slate-200 shadow-sm" />
      </div>
    </div>
  );
}

/** Tiny flat version of Pufi for nav buttons / avatars. */
export function CompanionMini({ size = 40, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <span
      className="relative inline-block"
      style={{ width: size, height: size, filter: glow ? 'drop-shadow(0 3px 6px rgba(45,212,191,0.45))' : undefined }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <defs>
          <radialGradient id="cmBody" cx="35%" cy="25%" r="85%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#eef2fb" />
            <stop offset="100%" stopColor="#d9e1f4" />
          </radialGradient>
          <radialGradient id="cmHeart" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffe08a" />
          </radialGradient>
        </defs>
        <ellipse cx="32" cy="35" rx="25" ry="26" fill="url(#cmBody)" />
        <ellipse cx="14" cy="40" rx="9" ry="14" fill="#2dd4bf" opacity="0.22" />
        <ellipse cx="50" cy="40" rx="9" ry="14" fill="#f472b6" opacity="0.28" />
        <circle cx="23" cy="28" r="3.2" fill="#1c1626" />
        <circle cx="41" cy="28" r="3.2" fill="#1c1626" />
        <circle cx="22" cy="27" r="1" fill="#fff" />
        <circle cx="40" cy="27" r="1" fill="#fff" />
        <ellipse cx="17" cy="34" rx="4" ry="2.6" fill="#fb7185" opacity="0.55" />
        <ellipse cx="47" cy="34" rx="4" ry="2.6" fill="#fb7185" opacity="0.55" />
        <path d="M28 33 Q30 36 32 33.5 Q34 36 36 33" fill="none" stroke="#f0647d" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M32 55 C20 46 17 40 17 37 C17 33.5 19.7 31.5 22.5 31.5 C26 31.5 29.5 34 32 37 C34.5 34 38 31.5 41.5 31.5 C44.3 31.5 47 33.5 47 37 C47 40 44 46 32 55 Z" transform="translate(0 2) scale(1)" fill="url(#cmHeart)" opacity="0.98" />
      </svg>
    </span>
  );
}
