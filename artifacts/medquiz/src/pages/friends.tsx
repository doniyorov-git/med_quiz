import { Link } from 'wouter';
import { Icon, Panel } from '@/components/chrome';
import { FriendsView } from '@/components/friends-view';
import { getFriendsCount } from '@/lib/model';
import { useStore } from '@/lib/store';

export function FriendsPage() {
  const { me } = useStore();

  if (!me) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner / Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-4 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[10px] bg-white/20 text-xs font-semibold backdrop-blur-xs mb-3">
              <Icon name="ri-user-heart-line" />
              <span>Tibbiyot Tarmog‘i</span>
            </div>
            <h1 className="font-display text-xl sm:text-3xl font-bold tracking-tight">
              Kursdoshlar va Do‘stlar
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/85 max-w-xl">
              Tibbiyot talabalari va shifokorlarni @username orqali qidiring, do‘stlik aloqalarini o‘rnating va testlarda birgalikda bellashing.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl px-5 py-3.5 sm:px-7 sm:py-4 border border-white/20 text-center min-w-[110px] sm:min-w-[130px] shadow-sm">
              <p className="text-xs sm:text-sm text-white/90 font-medium">Do‘stlaringiz</p>
              <p className="text-2xl sm:text-3xl font-extrabold mt-0.5">{getFriendsCount(me.id)} ta</p>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-3 sm:px-5 sm:py-4 rounded-xl bg-white text-emerald-800 hover:bg-white/90 text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95"
            >
              <Icon name="ri-user-settings-line" className="text-base text-emerald-600" />
              <span>Profilimga o‘tish</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Friends Component */}
      <Panel className="p-4 sm:p-6 shadow-sm">
        <FriendsView me={me} />
      </Panel>
    </div>
  );
}
