import type { ReactNode } from 'react';
import { Icon } from '@/components/chrome';

/** Glossy gold trophy (pure SVG, no external assets). */
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
      {/* glow */}
      <ellipse cx="80" cy="146" rx="46" ry="7" fill="#7c370f" opacity="0.16" />
      {/* handles */}
      <path d="M38 42 C10 40 8 78 42 86" fill="none" stroke="url(#trGoldDark)" strokeWidth="9" strokeLinecap="round" />
      <path d="M122 42 C150 40 152 78 118 86" fill="none" stroke="url(#trGoldDark)" strokeWidth="9" strokeLinecap="round" />
      {/* cup */}
      <path d="M34 26 H126 C126 70 112 98 80 104 C48 98 34 70 34 26 Z" fill="url(#trGold)" />
      <path d="M34 26 H126 C126 70 112 98 80 104 C48 98 34 70 34 26 Z" fill="url(#trShine)" />
      {/* rim */}
      <rect x="30" y="20" width="100" height="12" rx="6" fill="#ffd34d" />
      <rect x="30" y="20" width="100" height="5" rx="2.5" fill="#fff" opacity="0.5" />
      {/* stem + base */}
      <path d="M70 104 H90 L94 124 H66 Z" fill="url(#trGoldDark)" />
      <rect x="48" y="122" width="64" height="16" rx="6" fill="url(#trGold)" />
      <rect x="56" y="138" width="48" height="8" rx="4" fill="#c76500" />
      {/* star badge */}
      <circle cx="80" cy="58" r="20" fill="#fff6d6" />
      <circle cx="80" cy="58" r="20" fill="none" stroke="#ffb21e" strokeWidth="3" />
      <path d="M80 44 l4.4 9 9.9 1.4 -7.2 7 1.7 9.8 -8.8 -4.7 -8.8 4.7 1.7 -9.8 -7.2 -7 9.9 -1.4 Z" fill="#ff8a00" />
      {/* sparkles */}
      <path d="M18 22 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" fill="#ffd34d" />
      <path d="M140 14 l2 4.6 4.6 2 -4.6 2 -2 4.6 -2 -4.6 -4.6 -2 4.6 -2 Z" fill="#ff9d4d" />
    </svg>
  );
}

/** Coin chip: "2185 coins"-style reward pill. */
export function XpChip({ value, label = 'XP' }: { value: number | string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-extrabold text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 text-[11px] text-white shadow-sm">★</span>
      {value} {label}
    </span>
  );
}

function verdict(percent: number) {
  if (percent === 100) return { title: 'Mukammal natija!', text: 'Barcha savolga xatosiz javob berdingiz. Ajoyib!' };
  if (percent >= 80) return { title: 'Zo‘r natija!', text: 'Bilimingiz mustahkam. Yana bir oz va mukammal bo‘ladi.' };
  if (percent >= 60) return { title: 'Yaxshi urinish!', text: 'Xatolar ustida ishlasangiz natija yanada yaxshilanadi.' };
  return { title: 'Davom eting!', text: 'Xatolaringizni tahlil qilib, qayta urinib ko‘ring. Siz uddalaysiz!' };
}

/**
 * Bottom-sheet style result card (trophy, headline, reward chip, two big buttons).
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
    <div className="pop-in relative mx-auto max-w-md pt-24">
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
        <Trophy size={168} className="trophy-bob drop-shadow-[0_14px_18px_rgba(242,104,12,0.35)]" />
      </div>
      <div className="relative overflow-hidden rounded-[32px] border border-orange-100 bg-white px-5 pb-5 pt-24 text-center shadow-[0_24px_60px_-24px_rgba(242,104,12,0.45)] dark:border-white/10 dark:bg-[#111827]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-200/40 blur-3xl dark:bg-orange-500/10" />
        <h1 className="relative font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{v.title}</h1>
        <p className="relative mx-auto mt-1.5 max-w-xs text-sm text-slate-500 dark:text-slate-400">{v.text}</p>

        <div className="relative mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-[18px] bg-slate-50 px-3 py-3 dark:bg-white/5">
            <p className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              {correct}
              <span className="text-base font-bold text-slate-400">/{total}</span>
            </p>
            <p className="text-[11px] font-semibold text-slate-500">to‘g‘ri javob</p>
          </div>
          <div className="rounded-[18px] bg-orange-50 px-3 py-3 dark:bg-orange-500/10">
            <p className="text-2xl font-extrabold tabular-nums text-orange-600 dark:text-orange-300">{percent}%</p>
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
  'flex w-full items-center justify-center gap-2 rounded-[18px] bg-orange-500 px-5 py-3.5 text-base font-extrabold text-white shadow-[0_12px_24px_-10px_rgba(255,122,31,0.8)] transition active:scale-[0.98] hover:bg-orange-600';
export const bigBtnLine =
  'flex w-full items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-5 py-3.5 text-base font-bold text-slate-800 transition active:scale-[0.98] hover:bg-orange-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100';

export { Icon };
