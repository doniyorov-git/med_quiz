import { useState } from 'react';
import { Icon } from '@/components/chrome';
import { getLeaderboardXp, getMedicalTitle, levelFromXp } from '@/lib/model';
import { useStatsMap, useStore } from '@/lib/store';

type Period = 'week' | 'month' | 'all';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'week', label: 'Hafta' },
  { id: 'month', label: 'Oy' },
  { id: 'all', label: 'Butun davr' },
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
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-200 to-amber-100 font-extrabold text-orange-700 shadow-md ring-4 ${ring}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {row.avatar ? <img src={row.avatar} alt="" className="h-full w-full object-cover" /> : (row.name || 'M').slice(0, 2).toUpperCase()}
    </div>
  );
}

function PodiumSlot({ row, place }: { row?: Row; place: 1 | 2 | 3 }) {
  const cfg = {
    1: { h: 'h-36 sm:h-44', col: 'from-orange-400 to-orange-500', face: 76, ring: 'ring-orange-300', num: 'text-white/90', xp: 'text-orange-600' },
    2: { h: 'h-24 sm:h-32', col: 'from-sky-300 to-indigo-300', face: 58, ring: 'ring-sky-200', num: 'text-white/90', xp: 'text-sky-600' },
    3: { h: 'h-20 sm:h-24', col: 'from-amber-300 to-yellow-300', face: 58, ring: 'ring-yellow-200', num: 'text-white/90', xp: 'text-amber-600' },
  }[place];
  if (!row) return <div className={place === 1 ? 'order-2' : place === 2 ? 'order-1' : 'order-3'} />;
  return (
    <div className={`flex min-w-0 flex-col items-center ${place === 1 ? 'order-2' : place === 2 ? 'order-1' : 'order-3'}`}>
      <div className="relative">
        {place === 1 && <Icon name="ri-vip-crown-2-fill" className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl text-amber-400 drop-shadow" />}
        <Face row={row} size={cfg.face} ring={cfg.ring} />
      </div>
      <p className="mt-2 max-w-full truncate px-1 text-xs font-extrabold text-slate-900 sm:text-sm dark:text-white">{row.name}</p>
      <span className={`mt-0.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold shadow-sm sm:text-xs dark:bg-white/10 ${cfg.xp}`}>
        {(row.periodXp ?? 0).toLocaleString('uz-UZ')} XP
      </span>
      <div className={`mt-2 flex w-full items-start justify-center rounded-t-[22px] bg-gradient-to-b ${cfg.col} pt-2 shadow-inner ${cfg.h}`}>
        <span className={`font-display text-4xl font-black sm:text-5xl ${cfg.num}`}>{place}</span>
      </div>
    </div>
  );
}

export function Leaderboard() {
  const { me } = useStore();
  const map = useStatsMap();
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
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reyting</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tibbiyot yetakchilari</p>
        </div>
        {myIndex >= 0 && (
          <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-extrabold text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20">
            Sizning o‘rningiz: #{myIndex + 1}
          </span>
        )}
      </div>

      {/* Period pills */}
      <div className="grid grid-cols-3 gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-orange-100/70 dark:bg-white/5 dark:ring-white/10">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`rounded-full px-3 py-2 text-xs font-bold transition-all ${
              period === p.id ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Podium */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-orange-50 via-amber-50/60 to-white px-4 pb-0 pt-10 ring-1 ring-orange-100/70 dark:from-orange-500/10 dark:via-transparent dark:to-transparent dark:ring-white/10">
        <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
        <div className="pointer-events-none absolute -right-10 top-10 h-40 w-40 rounded-full bg-orange-200/50 blur-3xl dark:bg-orange-500/10" />
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
        <div className="-mt-2 rounded-[28px] bg-white p-3 shadow-[0_18px_40px_-24px_rgba(120,80,30,0.35)] ring-1 ring-orange-100/70 sm:p-4 dark:bg-[#111827] dark:ring-white/10">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 dark:bg-white/15" />
          <div className="space-y-2">
            {(rest.length ? rest : []).map((row, i) => {
              const index = i + 3;
              const isMe = row.userId === me?.id;
              const title = getMedicalTitle(row.xp ?? 0);
              return (
                <div
                  key={row.userId}
                  data-testid={`row-rank-${index + 1}`}
                  className={`flex items-center gap-3 rounded-[20px] p-2.5 pr-3.5 transition ${
                    isMe ? 'bg-orange-50 ring-2 ring-orange-300 dark:bg-orange-500/10 dark:ring-orange-500/40' : 'bg-slate-50/80 dark:bg-white/5'
                  }`}
                >
                  <span className="w-5 shrink-0 text-center text-xs font-extrabold text-slate-400">{index + 1}</span>
                  <Face row={row} size={42} ring="ring-white dark:ring-[#111827]" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-extrabold text-slate-900 dark:text-white">
                      <span className="truncate">{row.name}</span>
                      {isMe && <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">Siz</span>}
                    </p>
                    <p className="flex items-center gap-2 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <span className="truncate">{title.badge}</span>
                      <span className="shrink-0">· Lv {levelFromXp(row.xp ?? 0)}</span>
                      <span className="shrink-0">
                        · <Icon name="ri-fire-fill" className="text-orange-500" /> {row.streak ?? 0}
                      </span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold tabular-nums text-orange-600 shadow-sm dark:bg-white/10 dark:text-orange-300">
                    {(row.periodXp ?? 0).toLocaleString('uz-UZ')}
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
