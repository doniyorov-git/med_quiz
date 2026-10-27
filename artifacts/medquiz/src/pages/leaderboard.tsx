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
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Tabs */}
      <Panel className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/80 dark:border-white/10 pb-4 sm:pb-5">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Icon name="ri-trophy-line" className="text-amber-500 text-xl sm:text-2xl" />
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
          <div className="pt-4 sm:pt-6 pb-2">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-4 items-end">
              {/* 2nd Place */}
              {top2 ? (
                <div className="order-1 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 p-2 sm:p-4 text-center flex flex-col items-center min-w-0">
                  <Icon name="ri-medal-fill" className="text-lg sm:text-2xl mb-0.5 sm:mb-1 text-slate-400" />
                  <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full overflow-hidden border border-slate-300 dark:border-white/20 bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs sm:text-base text-slate-600 dark:text-slate-300 shadow-xs shrink-0">
                    {top2.avatar ? <img src={top2.avatar} alt="" className="h-full w-full object-cover" /> : top2.name.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-full w-full">{top2.name}</p>
                  <span className={`mt-1 inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold border ${getMedicalTitle(top2.xp).color} truncate max-w-full`}>
                    <Icon name={getMedicalTitle(top2.xp).icon} className="text-[10px] sm:text-xs shrink-0" />
                    <span className="truncate">{getMedicalTitle(top2.xp).badge}</span>
                  </span>
                  <p className="mt-1 sm:mt-1.5 font-mono text-[11px] sm:text-sm font-bold text-primary truncate">+{(top2.periodXp ?? 0).toLocaleString()} XP</p>
                </div>
              ) : (
                <div className="order-1" />
              )}

              {/* 1st Place (Winner, elevated) */}
              {top1 && (
                <div className="order-2 rounded-xl sm:rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent dark:bg-slate-800/80 p-2.5 sm:p-5 text-center flex flex-col items-center shadow-md sm:shadow-lg relative min-w-0 pb-3 sm:pb-6">
                  <span className="absolute -top-2.5 sm:-top-3 bg-amber-500 text-white text-[9px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                    <Icon name="ri-vip-crown-fill" /> 1-O‘RIN
                  </span>
                  <Icon name="ri-trophy-fill" className="text-xl sm:text-3xl mb-0.5 sm:mb-1 text-amber-400" />
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full overflow-hidden border-2 border-amber-500/50 bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm sm:text-lg text-slate-600 dark:text-slate-300 ring-2 sm:ring-4 ring-amber-500/15 shadow-xs shrink-0">
                    {top1.avatar ? <img src={top1.avatar} alt="" className="h-full w-full object-cover" /> : (top1.name || 'M').slice(0, 2).toUpperCase()}
                  </div>
                  <p className="mt-1.5 text-xs sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-full w-full">{top1.name}</p>
                  <span className={`mt-1 inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-semibold border ${getMedicalTitle(top1.xp ?? 0).color} truncate max-w-full`}>
                    <Icon name={getMedicalTitle(top1.xp ?? 0).icon} className="text-[10px] sm:text-xs shrink-0" />
                    <span className="truncate">{getMedicalTitle(top1.xp ?? 0).badge}</span>
                  </span>
                  <p className="mt-1 sm:mt-1.5 font-mono text-xs sm:text-base font-black text-amber-500 truncate">+{(top1.periodXp ?? 0).toLocaleString()} XP</p>
                </div>
              )}

              {/* 3rd Place */}
              {top3 ? (
                <div className="order-3 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 p-2 sm:p-4 text-center flex flex-col items-center min-w-0">
                  <Icon name="ri-medal-fill" className="text-lg sm:text-2xl mb-0.5 sm:mb-1 text-amber-600 dark:text-amber-500" />
                  <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full overflow-hidden border border-slate-300 dark:border-white/20 bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs sm:text-base text-slate-600 dark:text-slate-300 shadow-xs shrink-0">
                    {top3.avatar ? <img src={top3.avatar} alt="" className="h-full w-full object-cover" /> : (top3.name || 'M').slice(0, 2).toUpperCase()}
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-full w-full">{top3.name}</p>
                  <span className={`mt-1 inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold border ${getMedicalTitle(top3.xp ?? 0).color} truncate max-w-full`}>
                    <Icon name={getMedicalTitle(top3.xp ?? 0).icon} className="text-[10px] sm:text-xs shrink-0" />
                    <span className="truncate">{getMedicalTitle(top3.xp ?? 0).badge}</span>
                  </span>
                  <p className="mt-1 sm:mt-1.5 font-mono text-[11px] sm:text-sm font-bold text-primary truncate">+{(top3.periodXp ?? 0).toLocaleString()} XP</p>
                </div>
              ) : (
                <div className="order-3" />
              )}
            </div>
          </div>
        )}

        {/* Full List */}
        <div className="mt-4 sm:mt-6">
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
                    className={`flex items-center gap-2 sm:gap-3.5 p-2 sm:p-3 rounded-xl sm:rounded-[10px] border transition-all ${
                      isMe
                        ? 'bg-primary/10 border-primary/40 text-slate-900 dark:text-white shadow-xs'
                        : 'border-slate-200/70 dark:border-white/5 bg-white/50 dark:bg-slate-800/30'
                    }`}
                    data-testid={`row-rank-${index + 1}`}
                  >
                    <div className="w-5 sm:w-7 text-center font-mono text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0 flex items-center justify-center">
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

                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 shadow-xs">
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
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 sm:gap-1.5 mt-0.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Icon name="ri-file-list-3-line" /> {row.quizzes ?? 0} ta test
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="ri-fire-fill" className="text-amber-500" /> {row.streak ?? 0} kun streak
                        </span>
                      </p>
                    </div>

                    <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium shrink-0">
                      Lv {levelFromXp(row.xp)}
                    </span>

                    <span className="w-[58px] sm:w-24 text-right text-[10px] sm:text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums shrink-0">
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
