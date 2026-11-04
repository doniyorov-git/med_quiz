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
      {/* Top illustration: Lordicon celebration for 100% or SVG trophy */}
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
        {percent >= 80 ? (
          <div
            className="trophy-bob"
            dangerouslySetInnerHTML={{
              __html: `<lord-icon src="https://cdn.lordicon.com/lupuorrc.json" trigger="loop" colors="primary:#10b981,secondary:#f59e0b" style="width:150px;height:150px;display:block;margin:0 auto;filter:drop-shadow(0 12px 20px rgba(16,185,129,0.35));"></lord-icon>`,
            }}
          />
        ) : (
          <Trophy size={160} className="trophy-bob drop-shadow-[0_14px_18px_rgba(16,185,129,0.25)]" />
        )}
      </div>

      <div className="relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white px-5 pb-5 pt-24 text-center shadow-lg dark:border-white/10 dark:bg-[#111827]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

        {percent === 100 && (
          <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs">
            <span>🎉 Mukammal g‘alaba!</span>
          </div>
        )}

        <h1 className="relative font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{v.title}</h1>
        <p className="relative mx-auto mt-1.5 max-w-xs text-sm text-slate-500 dark:text-slate-400">{v.text}</p>

        <div className="relative mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-[14px] bg-slate-50 px-3 py-3 border border-slate-100 dark:border-white/5 dark:bg-white/5">
            <p className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              {correct}
              <span className="text-base font-bold text-slate-400">/{total}</span>
            </p>
            <p className="text-[11px] font-semibold text-slate-500">to‘g‘ri javob</p>
          </div>
          <div className="rounded-[14px] bg-emerald-50 px-3 py-3 border border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-500/10">
            <p className="text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{percent}%</p>
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
