import { Icon } from '@/components/chrome';
import { useStore } from '@/lib/store';
import type { Me } from '@/lib/types';

interface BlockedAccountScreenProps {
  me: Me;
}

export function BlockedAccountScreen({ me }: BlockedAccountScreenProps) {
  const { leave } = useStore();

  const handleLogout = () => {
    leave();
    window.location.href = '/';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-[#111827] border border-rose-500/30 p-6 text-center shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Yuqori xavfsizlik indikatori */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-lg shadow-rose-500/30">
          <Icon name="ri-shield-cross-fill" className="text-3xl" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-block px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Akkaunt Cheklangan
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Akkauntingiz bloklandi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Hurmatli <span className="font-bold text-slate-800 dark:text-slate-200">{me.name}</span>, sizning akkauntingiz MedQuiz platformasi ma’muriyati tomonidan cheklangan.
          </p>
        </div>

        {/* Bloklash sababi kartasi */}
        <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-3.5 text-left space-y-1 text-xs">
          <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Icon name="ri-information-line" className="text-rose-500 text-sm" />
            <span>Ko‘rsatilgan sabab:</span>
          </p>
          <p className="text-slate-600 dark:text-slate-400 pl-5 italic">
            «{me.blockedReason || 'Platforma xavfsizlik qoidalari yoki ma’muriyat qarori bilan cheklandi'}»
          </p>
          {me.blockedAt && (
            <p className="text-[10px] text-slate-400 pl-5 pt-1">
              Sana: {new Date(me.blockedAt).toLocaleString('uz-UZ')}
            </p>
          )}
        </div>

        {/* Amallar */}
        <div className="space-y-2 pt-2">
          <a
            href="https://t.me/medquiz_uz"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
          >
            <Icon name="ri-telegram-fill" className="text-base" />
            <span>Ma’muriyat bilan bog‘lanish (Telegram)</span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Icon name="ri-logout-box-r-line" className="text-sm" />
            <span>Tizimdan chiqish (Boshqa hisob)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
