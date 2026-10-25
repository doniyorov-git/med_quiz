import { Icon, Panel } from '@/components/chrome';
import type { Stats } from '@/lib/types';
import { useStatsMap, useStore } from '@/lib/store';

const items: { id: string; title: string; detail: string; icon: string; test: (stats: Stats) => boolean }[] = [
  { id: 'first', title: 'Birinchi qadam', detail: 'Birinchi testni yakunlang', icon: 'ri-flag-line', test: (stats) => stats.quizzes >= 1 },
  { id: 'perfect', title: 'Aniq javob', detail: 'Bir testda hammasi to‘g‘ri', icon: 'ri-focus-2-line', test: (stats) => stats.perfects >= 1 },
  { id: 'speed', title: 'Tezkor', detail: '10 ta tezkor to‘g‘ri javob', icon: 'ri-flashlight-line', test: (stats) => stats.fastCorrect >= 10 },
  { id: 'streak', title: 'Uch kun', detail: '3 kun ketma-ket mashq', icon: 'ri-fire-line', test: (stats) => stats.streak >= 3 },
  { id: 'level', title: 'Yangi daraja', detail: '500 XP to‘plang', icon: 'ri-star-line', test: (stats) => stats.xp >= 500 },
  { id: 'champ', title: 'Chempion', detail: 'Kamida ikki kishilik battle’da birinchi o‘rin', icon: 'ri-trophy-line', test: (stats) => stats.battleWins >= 1 },
];

export function Achievements() {
  const { me } = useStore();
  const stats = useStatsMap()[me?.id ?? ''];

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Yutuqlar va nishonlar</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Mashqlar va yutuqlaringiz orqali yangi nishonlarni oching.
        </p>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const unlocked = !!stats && item.test(stats);
          return (
            <Panel key={item.id} className={`transition-all ${unlocked ? 'border-med-500/30 shadow-xs' : 'opacity-65'}`}>
              <div className="flex items-center justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-[10px] shadow-xs ${unlocked ? 'bg-med-500/15 text-med-600 dark:text-med-400' : 'bg-slate-100 text-slate-400 dark:bg-[#1f2937] dark:text-slate-500'}`}>
                  <Icon name={item.icon} className="text-2xl" />
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-[10px] ${unlocked ? 'badge-primary' : 'bg-slate-100 text-slate-500 dark:bg-[#1f2937] dark:text-slate-400'}`}>
                  {unlocked ? (
                    <span className="flex items-center gap-1"><Icon name="ri-check-line" /> Ochildi</span>
                  ) : (
                    <span className="flex items-center gap-1"><Icon name="ri-lock-line" /> Qulflangan</span>
                  )}
                </span>
              </div>
              <h3 className="mt-4 font-display font-bold text-base text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.detail}</p>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
