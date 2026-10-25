import { useState } from 'react';
import { Icon, Panel } from '@/components/chrome';
import { getLeaderboardXp, getMedicalTitle, levelFromXp } from '@/lib/model';
import { useStatsMap, useStore } from '@/lib/store';

type Period = 'week' | 'month' | 'all';

export function Leaderboard() {
  const { me } = useStore();
  const map = useStatsMap();
  const [period, setPeriod] = useState<Period>('week');

  const rows = Object.values(map)
    .map((stat) => ({
      ...stat,
      periodXp: getLeaderboardXp(stat, period),
    }))
    .filter((stat) => stat.periodXp > 0 || period === 'all')
    .sort((a, b) => b.periodXp - a.periodXp);

  const top1 = rows[0];
  const top2 = rows[1];
  const top3 = rows[2];

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <Panel className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Icon name="ri-trophy-line" className="text-amber-500 text-2xl" />
              Tibbiyot Yetakchilari
            </h1>
          </div>

          {/* Period Tabs: Hafta top / Oy top / Butun davr top */}
          <div className="inline-flex shrink-0 items-center rounded-[10px] bg-slate-100 dark:bg-[#111827] p-1 border border-slate-200/80 dark:border-white/10 overflow-x-auto max-w-full">
            <button
              type="button"
              className={`rounded-[8px] px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                period === 'week'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setPeriod('week')}
            >
              Hafta top
            </button>
            <button
              type="button"
              className={`rounded-[8px] px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                period === 'month'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setPeriod('month')}
            >
              Oy top
            </button>
            <button
              type="button"
              className={`rounded-[8px] px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                period === 'all'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setPeriod('all')}
            >
              Butun davr top
            </button>
          </div>
        </div>

        {/* Top 3 Podium (when at least 1 user exists) */}
        {rows.length > 0 && (
          <div className="pt-6 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              {/* 2nd Place */}
              {top2 && (
                <div className="order-2 sm:order-1 rounded-[10px] border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 p-4 text-center flex flex-col items-center">
                  <Icon name="ri-medal-fill" className="text-2xl mb-1 text-slate-400" />
                  <div className="h-14 w-14 rounded-[10px] overflow-hidden border border-slate-300 dark:border-white/20 bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                    {top2.avatar ? <img src={top2.avatar} alt="" className="h-full w-full object-cover" /> : top2.name.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white truncate max-w-full">{top2.name}</p>
                  <span className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-semibold border ${getMedicalTitle(top2.xp).color}`}>
                    <Icon name={getMedicalTitle(top2.xp).icon} className="text-xs" />
                    {getMedicalTitle(top2.xp).badge}
                  </span>
                  <p className="mt-2 font-mono text-sm font-bold text-primary">+{(top2.periodXp ?? 0).toLocaleString()} XP</p>
                </div>
              )}

              {/* 1st Place (Winner, elevated) */}
              {top1 && (
                <div className="order-1 sm:order-2 rounded-[10px] border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent dark:bg-slate-800/80 p-5 text-center flex flex-col items-center shadow-lg relative">
                  <span className="absolute -top-3 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-[10px] shadow-sm flex items-center gap-1">
                    <Icon name="ri-vip-crown-fill" /> 1-O‘RIN
                  </span>
                  <Icon name="ri-trophy-fill" className="text-3xl mb-1 text-amber-400" />
                  <div className="h-16 w-16 rounded-[10px] overflow-hidden border-2 border-amber-500/50 bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 ring-4 ring-amber-500/15">
                    {top1.avatar ? <img src={top1.avatar} alt="" className="h-full w-full object-cover" /> : (top1.name || 'M').slice(0, 2).toUpperCase()}
                  </div>
                  <p className="mt-2 text-base font-bold text-slate-900 dark:text-white truncate max-w-full">{top1.name}</p>
                  <span className={`mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold border ${getMedicalTitle(top1.xp ?? 0).color}`}>
                    <Icon name={getMedicalTitle(top1.xp ?? 0).icon} className="text-xs" />
                    {getMedicalTitle(top1.xp ?? 0).badge}
                  </span>
                  <p className="mt-2 font-mono text-base font-black text-amber-500">+{(top1.periodXp ?? 0).toLocaleString()} XP</p>
                </div>
              )}

              {/* 3rd Place */}
              {top3 && (
                <div className="order-3 sm:order-3 rounded-[10px] border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 p-4 text-center flex flex-col items-center">
                  <Icon name="ri-medal-fill" className="text-2xl mb-1 text-amber-600 dark:text-amber-500" />
                  <div className="h-14 w-14 rounded-[10px] overflow-hidden border border-slate-300 dark:border-white/20 bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                    {top3.avatar ? <img src={top3.avatar} alt="" className="h-full w-full object-cover" /> : (top3.name || 'M').slice(0, 2).toUpperCase()}
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white truncate max-w-full">{top3.name}</p>
                  <span className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-semibold border ${getMedicalTitle(top3.xp ?? 0).color}`}>
                    <Icon name={getMedicalTitle(top3.xp ?? 0).icon} className="text-xs" />
                    {getMedicalTitle(top3.xp ?? 0).badge}
                  </span>
                  <p className="mt-2 font-mono text-sm font-bold text-primary">+{(top3.periodXp ?? 0).toLocaleString()} XP</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full List */}
        <div className="mt-6">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            Barcha ishtirokchilar
          </h3>

          {!rows.length ? (
            <p className="py-8 text-center text-sm text-slate-500">Ushbu davrda hali faollik qayd etilmagan.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((row, index) => {
                const isMe = row.userId === me?.id;
                const title = getMedicalTitle(row.xp);
                return (
                  <div
                    key={row.userId}
                    className={`flex items-center gap-3.5 p-3 rounded-[10px] border transition-all ${
                      isMe
                        ? 'bg-primary/10 border-primary/40 text-slate-900 dark:text-white shadow-xs'
                        : 'border-slate-200/70 dark:border-white/5 bg-white/50 dark:bg-slate-800/30'
                    }`}
                    data-testid={`row-rank-${index + 1}`}
                  >
                    <div className="w-7 text-center font-mono text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0 flex items-center justify-center">
                      {index === 0 ? (
                        <Icon name="ri-trophy-fill" className="text-amber-400 text-base" />
                      ) : index === 1 ? (
                        <Icon name="ri-medal-fill" className="text-slate-400 text-base" />
                      ) : index === 2 ? (
                        <Icon name="ri-medal-fill" className="text-amber-600 dark:text-amber-500 text-base" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    <div className="h-9 w-9 rounded-[8px] overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {row.avatar ? (
                        <img src={row.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        row.name.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${isMe ? 'font-bold text-primary' : 'font-medium text-slate-800 dark:text-slate-200'}`}>
                          {row.name}
                        </p>
                        {isMe && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-[6px] bg-primary text-white">
                            Siz
                          </span>
                        )}
                        <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-semibold border ${title.color}`}>
                          <Icon name={title.icon} className="text-xs" />
                          {title.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Icon name="ri-file-list-3-line" /> {row.quizzes ?? 0} ta test
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="ri-fire-fill" className="text-amber-500" /> {row.streak ?? 0} kun streak
                        </span>
                      </p>
                    </div>

                    <span className="text-xs px-2 py-0.5 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium shrink-0">
                      Lv {levelFromXp(row.xp)}
                    </span>

                    <span className="w-24 text-right text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums shrink-0">
                      {(row.periodXp ?? 0).toLocaleString('uz-UZ')} XP
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
