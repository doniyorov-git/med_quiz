import { Link } from 'wouter';
import { Icon, Panel } from '@/components/chrome';
import { FriendsView } from '@/components/friends-view';
import { getFriendsCount } from '@/lib/model';
import { useStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

export function FriendsPage() {
  const { me } = useStore();
  const { t } = useI18n();

  if (!me) return null;

  const count = getFriendsCount(me.id);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="rounded-[10px] border border-slate-200/80 bg-white/90 p-4 sm:p-6 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#111827]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-2">
              <Icon name="ri-user-heart-line" />
              <span>Tibbiyot tarmog‘i</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('friends_title')}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              {t('friends_sub')}
            </p>
          </div>

          {/* Equal-sized buttons side by side */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] border border-slate-200/80 bg-slate-100/80 dark:border-white/10 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold shadow-xs">
              <Icon name="ri-group-line" className="text-base text-emerald-600 dark:text-emerald-400" />
              <span>Do‘stlaringiz: <strong className="font-bold text-slate-900 dark:text-white">{count} ta</strong></span>
            </div>
            <Link
              href="/profile"
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] border border-slate-200/80 bg-slate-100/80 hover:bg-slate-200/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
              title="Profil"
            >
              <Icon name="ri-user-settings-line" className="text-base" />
              <span>Profil</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Friends Component */}
      <Panel className="p-4 sm:p-6 shadow-sm !rounded-[10px]">
        <FriendsView me={me} />
      </Panel>
    </div>
  );
}
