import { useState } from 'react';
import { Icon } from '@/components/chrome';
import { getLeaderboardXp, getMedicalTitle, levelFromXp } from '@/lib/model';
import { useStatsMap, useStore } from '@/lib/store';
import { useI18n, type TranslationKey } from '@/lib/i18n';

type Period = 'week' | 'month' | 'all';

const PERIODS: { id: Period; labelKey: TranslationKey; fallback: string }[] = [
  { id: 'week', labelKey: 'leaderboard_week', fallback: 'Hafta' },
  { id: 'month', labelKey: 'leaderboard_month', fallback: 'Oy' },
  { id: 'all', labelKey: 'leaderboard_all', fallback: 'Butun davr' },
];

type Row = {
  userId: string;
  name: string;
  avatar?: string | null;
  xp: number;
  periodXp: number;
  quizzes?: number;
  streak?: number;
};

function Face({ row, size, ring }: { row: Row; size: number; ring: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-slate-100 dark:bg-slate-700 font-extrabold text-slate-700 dark:text-slate-200 shadow-md ring-4 ${ring}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {row.avatar ? <img src={row.avatar} alt="" className="h-full w-full object-cover" /> : (row.name || 'M').slice(0, 2).toUpperCase()}
    </div>
  );
}

function PodiumSlot({ row, place }: { row?: Row; place: 1 | 2 | 3 }) {
  const cfg = {
    1: { h: 'h-36 sm:h-44', col: 'from-amber-400 to-amber-500', face: 76, ring: 'ring-amber-300', num: 'text-white/90', xp: 'text-amber-600' },
    2: { h: 'h-24 sm:h-32', col: 'from-slate-300 to-slate-400', face: 58, ring: 'ring-slate-300', num: 'text-white/90', xp: 'text-slate-600' },
    3: { h: 'h-20 sm:h-24', col: 'from-amber-600 to-amber-700', face: 58, ring: 'ring-amber-500', num: 'text-white/90', xp: 'text-amber-700' },
  }[place];
  if (!row) return <div className={place === 1 ? 'order-2' : place === 2 ? 'order-1' : 'order-3'} />;
  return (
    <div className={`flex min-w-0 flex-col items-center ${place === 1 ? 'order-2' : place === 2 ? 'order-1' : 'order-3'}`}>
      <div className="relative">
        {place === 1 && <Icon name="ri-vip-crown-2-fill" className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl text-amber-400 drop-shadow" />}
        <Face row={row} size={cfg.face} ring={cfg.ring} />
      </div>
      <p className="mt-2 max-w-full truncate px-1 text-xs font-extrabold text-slate-900 sm:text-sm dark:text-white">{row.name}</p>
      <span className={`mt-0.5 rounded-[8px] bg-white px-2 py-0.5 text-[10px] font-bold shadow-xs sm:text-xs dark:bg-white/10 ${cfg.xp}`}>
        {(row.periodXp ?? 0).toLocaleString('uz-UZ')} XP
      </span>
      <div className={`mt-2 flex w-full items-start justify-center rounded-t-[10px] bg-gradient-to-b ${cfg.col} pt-2 shadow-inner ${cfg.h}`}>
        <span className={`font-display text-4xl font-black sm:text-5xl ${cfg.num}`}>{place}</span>
      </div>
    </div>
  );
}

export function Leaderboard() {
  const { me } = useStore();
  const map = useStatsMap();
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>('week');

  const rows: Row[] = Object.values(map)
    .map((stat) => ({ ...stat, periodXp: getLeaderboardXp(stat, period) }) as Row)
    .filter((stat) => stat.periodXp > 0 || period === 'all')
    .sort((a, b) => b.periodXp - a.periodXp);

  const rest = rows.slice(3);
  const myIndex = rows.findIndex((r) => r.userId === me?.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('leaderboard_title')}
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('leaderboard_sub')}
          </p>
        </div>
        {myIndex >= 0 && (
          <span className="rounded-[10px] bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
            {t('leaderboard_your_rank', { rank: myIndex + 1 })}
          </span>
        )}
      </div>

      {/* Period tabs (Strictly 10px rounded per request) */}
      <div className="grid grid-cols-3 gap-1 rounded-[10px] bg-white p-1 shadow-xs border border-slate-200/80 dark:bg-white/5 dark:border-white/10">
        {PERIODS.map((p) => {
          const label = t(p.labelKey) || p.fallback;
          const active = period === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-[10px] px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              data-testid={`tab-period-${p.id}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Podium */}
      <div className="relative overflow-hidden rounded-[10px] bg-gradient-to-b from-emerald-50/50 via-slate-50/60 to-white px-4 pb-0 pt-10 ring-1 ring-slate-200/80 dark:from-emerald-950/20 dark:via-transparent dark:to-transparent dark:ring-white/10">
        <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/10" />
        <div className="pointer-events-none absolute -right-10 top-10 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
        {rows.length === 0 ? (
          <p className="relative py-12 text-center text-sm text-slate-500">Ushbu davrda hali faollik qayd etilmagan.</p>
        ) : (
          <div className="relative grid grid-cols-3 items-end gap-2 sm:gap-4">
            <PodiumSlot row={rows[1]} place={2} />
            <PodiumSlot row={rows[0]} place={1} />
            <PodiumSlot row={rows[2]} place={3} />
          </div>
        )}
      </div>

      {/* List sheet */}
      {rows.length > 0 && (
        <div className="-mt-2 rounded-[10px] bg-white p-3 shadow-sm border border-slate-200/80 sm:p-4 dark:bg-[#111827] dark:border-white/10">
          <div className="space-y-2">
            {(rest.length ? rest : []).map((row, i) => {
              const index = i + 3;
              const isMe = row.userId === me?.id;
              const title = getMedicalTitle(row.xp ?? 0);
              return (
                <div
                  key={row.userId}
                  data-testid={`row-rank-${index + 1}`}
                  className={`flex items-center gap-3 rounded-[10px] p-2.5 pr-3.5 transition ${
                    isMe ? 'bg-orange-50 ring-1 ring-orange-300 dark:bg-orange-500/10 dark:ring-orange-500/40' : 'bg-slate-50/80 dark:bg-white/5'
                  }`}
                >
                  <span className="w-5 shrink-0 text-center text-xs font-extrabold text-slate-400">{index + 1}</span>
                  <Face row={row} size={42} ring="ring-white dark:ring-[#111827]" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-extrabold text-slate-900 dark:text-white">
                      <span className="truncate">{row.name}</span>
                      {isMe && <span className="rounded-[6px] bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">Siz</span>}
                    </p>
                    <p className="flex items-center gap-2 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <span className="truncate">{title.badge}</span>
                      <span className="shrink-0">· Lv {levelFromXp(row.xp ?? 0)}</span>
                      <span className="shrink-0">
                        · <Icon name="ri-fire-fill" className="text-amber-500" /> {row.streak ?? 0}
                      </span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-[8px] bg-emerald-50 px-2.5 py-1 text-xs font-extrabold tabular-nums text-emerald-700 shadow-xs dark:bg-emerald-950/40 dark:text-emerald-300">
                    {(row.periodXp ?? 0).toLocaleString('uz-UZ')} XP
                  </span>
                </div>
              );
            })}
            {!rest.length && <p className="py-3 text-center text-xs text-slate-400">Boshqa ishtirokchilar hali yo‘q</p>}
          </div>
        </div>
      )}
    </div>
  );
}
