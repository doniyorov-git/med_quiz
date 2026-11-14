import type { ReactNode } from 'react';
import { Icon } from '@/components/chrome';

/** Glossy gold trophy (pure SVG). */
export function Trophy({ size = 150, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="trGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="0.5" stopColor="#ffb21e" />
          <stop offset="1" stopColor="#e07b00" />
        </linearGradient>
        <linearGradient id="trGoldDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4a31a" />
          <stop offset="1" stopColor="#c76500" />
        </linearGradient>
        <radialGradient id="trShine" cx="30%" cy="25%" r="60%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="146" rx="46" ry="7" fill="#047857" opacity="0.16" />
      <path d="M38 42 C10 40 8 78 42 86" fill="none" stroke="url(#trGoldDark)" strokeWidth="9" strokeLinecap="round" />
      <path d="M122 42 C150 40 152 78 118 86" fill="none" stroke="url(#trGoldDark)" strokeWidth="9" strokeLinecap="round" />
      <path d="M34 26 H126 C126 70 112 98 80 104 C48 98 34 70 34 26 Z" fill="url(#trGold)" />
      <path d="M34 26 H126 C126 70 112 98 80 104 C48 98 34 70 34 26 Z" fill="url(#trShine)" />
      <rect x="30" y="20" width="100" height="12" rx="6" fill="#ffd34d" />
      <rect x="30" y="20" width="100" height="5" rx="2.5" fill="#fff" opacity="0.5" />
      <path d="M70 104 H90 L94 124 H66 Z" fill="url(#trGoldDark)" />
      <rect x="48" y="122" width="64" height="16" rx="6" fill="url(#trGold)" />
      <rect x="56" y="138" width="48" height="8" rx="4" fill="#c76500" />
      <circle cx="80" cy="58" r="20" fill="#fff6d6" />
      <circle cx="80" cy="58" r="20" fill="none" stroke="#ffb21e" strokeWidth="3" />
      <path d="M80 44 l4.4 9 9.9 1.4 -7.2 7 1.7 9.8 -8.8 -4.7 -8.8 4.7 1.7 -9.8 -7.2 -7 9.9 -1.4 Z" fill="#ff8a00" />
      <path d="M18 22 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" fill="#ffd34d" />
      <path d="M140 14 l2 4.6 4.6 2 -4.6 2 -2 4.6 -2 -4.6 -4.6 -2 4.6 -2 Z" fill="#ff9d4d" />
    </svg>
  );
}

/** Instant vector celebration badge with party popper, star rays and confetti (0ms network delay). */
export function CelebrationBadge({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible animate-in zoom-in duration-300">
        <defs>
          <linearGradient id="partyCone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="partyGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Pulsing ambient glow */}
        <circle cx="70" cy="70" r="48" fill="#10b981" opacity="0.14" className="animate-pulse" />

        {/* Floating confetti dots */}
        <circle cx="28" cy="38" r="4" fill="#f59e0b" />
        <circle cx="112" cy="35" r="3.5" fill="#38bdf8" />
        <circle cx="20" cy="72" r="3.5" fill="#ec4899" />
        <circle cx="118" cy="75" r="4" fill="#a855f7" />
        <circle cx="46" cy="22" r="3.5" fill="#10b981" />
        <circle cx="95" cy="24" r="3.5" fill="#f43f5e" />

        {/* Streamers */}
        <path d="M25 50 Q36 40 30 26" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M110 52 Q122 42 116 26" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M68 20 Q76 8 86 14" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Party popper cone centered inside container */}
        <g transform="translate(70, 78) rotate(-14) translate(-70, -78)">
          <path d="M48 96 L70 46 L92 96 Z" fill="url(#partyCone)" stroke="#047857" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M57 76 L83 76" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
          <path d="M62 64 L78 64" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
          <path d="M70 44 L70 26" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M64 45 L50 32" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          <path d="M76 45 L90 32" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Sparkling stars */}
        <path d="M70 10 L72.5 17 L79 19.5 L72.5 22 L70 29 L67.5 22 L61 19.5 L67.5 17 Z" fill="#fbbf24" />
        <path d="M102 48 L104 52.5 L108.5 54.5 L104 56.5 L102 61 L100 56.5 L95.5 54.5 L100 52.5 Z" fill="#fbbf24" />
        <path d="M38 48 L40 52.5 L44.5 54.5 L40 56.5 L38 61 L36 56.5 L31.5 54.5 L36 52.5 Z" fill="#38bdf8" />
      </svg>
    </div>
  );
}

/** Coin chip: "2185 XP" reward pill in medical theme. */
export function XpChip({ value, label = 'XP' }: { value: number | string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-[11px] text-white shadow-xs">★</span>
      {value} {label}
    </span>
  );
}

function verdict(percent: number) {
  if (percent === 100) return { title: 'Tabriklaymiz! 100% Mukammal natija! 🏆', text: 'Barcha savollarga xatosiz, a‘lo darajada javob berdingiz!' };
  if (percent >= 80) return { title: 'Zo‘r natija! Tabriklaymiz! 🌟', text: 'Tibbiy bilimingiz mustahkam. Ajoyib natija!' };
  if (percent >= 60) return { title: 'Yaxshi natija!', text: 'Xatolar ustida ishlab, natijani yanada oshiring.' };
  return { title: 'Davom eting!', text: 'Xatolaringizni tahlil qilib, qayta urinib ko‘ring. Siz uddalaysiz!' };
}

/**
 * Result Card with Trophy, celebration animations and medical theme.
 * Illustration is strictly contained INSIDE the card (no floating outside).
 */
export function ResultCard({
  percent,
  correct,
  total,
  xp,
  primary,
  secondary,
  children,
}: {
  percent: number;
  correct: number;
  total: number;
  xp?: number;
  primary: ReactNode;
  secondary?: ReactNode;
  children?: ReactNode;
}) {
  const v = verdict(percent);
  return (
    <div className="pop-in relative mx-auto max-w-md w-full">
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white px-5 pb-6 pt-6 text-center shadow-xl dark:border-white/10 dark:bg-[#111827]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Celebration Illustration strictly INSIDE the card container */}
        <div className="mx-auto mb-3 flex items-center justify-center">
          {percent >= 80 ? (
            <CelebrationBadge size={120} />
          ) : (
            <Trophy size={110} className="trophy-bob drop-shadow-[0_12px_16px_rgba(16,185,129,0.25)]" />
          )}
        </div>

        {percent === 100 && (
          <div className="mb-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs">
            <span>🎉 Mukammal g‘alaba!</span>
          </div>
        )}

        <h1 className="relative font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {v.title}
        </h1>
        <p className="relative mx-auto mt-1.5 max-w-xs text-sm text-slate-500 dark:text-slate-400">
          {v.text}
        </p>

        <div className="relative mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-[14px] bg-slate-50 px-3 py-3 border border-slate-100 dark:border-white/5 dark:bg-white/5">
            <p className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              {correct}
              <span className="text-base font-bold text-slate-400">/{total}</span>
            </p>
            <p className="text-[11px] font-semibold text-slate-500">to‘g‘ri javob</p>
          </div>
          <div className="rounded-[14px] bg-emerald-50 px-3 py-3 border border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-500/10">
            <p className="text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
              {percent}%
            </p>
            <p className="text-[11px] font-semibold text-slate-500">aniqlik</p>
          </div>
        </div>

        {typeof xp === 'number' && (
          <div className="relative mt-3.5 flex justify-center">
            <XpChip value={`+${xp}`} />
          </div>
        )}

        <div className="relative mt-5 space-y-2.5">
          {primary}
          {secondary}
        </div>
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export const bigBtn =
  'flex w-full items-center justify-center gap-2 rounded-[14px] btn-primary px-5 py-3 text-sm sm:text-base font-bold text-white transition active:scale-[0.98] shadow-md';
export const bigBtnLine =
  'flex w-full items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-5 py-3 text-sm sm:text-base font-bold text-slate-700 transition active:scale-[0.98] hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200';

export { Icon };
