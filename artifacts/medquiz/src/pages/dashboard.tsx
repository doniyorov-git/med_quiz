import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineBookmark,
  HiOutlineChartBar,
  HiOutlineFire,
  HiOutlineLightningBolt,
  HiOutlinePlay,
  HiOutlineTrash,
  HiOutlineTrendingUp,
  HiOutlineXCircle,
} from 'react-icons/hi';
import { deleteBank, getMedicalTitle, levelFromXp, recentAccuracy } from '@/lib/model';
import { Icon } from '@/components/chrome';
import { cleanQuestion } from '@/lib/parser';
import { useBanks, useMistakes, useStatsMap, useStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import type { Stats } from '@/lib/types';

const banners = [
  { title: 'Kunlik mashq', text: '5 ta savol — streak uzilmaydi', href: '/banks', cta: 'Boshlash', tone: 'from-med-600 to-emerald-500' },
  { title: 'Battle ochiq', text: 'Do‘stingizni chaqiring va ball oling', href: '/battle', cta: 'Kirish', tone: 'from-rose-500 to-pink-600' },
  { title: 'Yutuqlar', text: 'Yangi nishonlar sizni kutmoqda', href: '/achievements', cta: 'Ko‘rish', tone: 'from-sky-500 to-indigo-500' },
  { title: 'Reyting', text: 'Eng yaxshi natijalar shu yerda', href: '/leaderboard', cta: 'Ochish', tone: 'from-amber-500 to-orange-600' },
  { title: 'Yangi fan', text: 'O‘z .txt savollaringizni qo‘shing', href: '/banks', cta: 'Yuklash', tone: 'from-violet-500 to-fuchsia-600' },
];

function DashBanner() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % banners.length), 3500);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="relative h-36 overflow-hidden rounded-[10px] sm:h-40" data-testid="dash-banner">
      {banners.map((banner, slide) => (
        <Link
          key={banner.title}
          href={banner.href}
          className={`absolute inset-0 flex items-center justify-between gap-4 bg-gradient-to-r px-5 text-white transition-transform duration-500 ease-out sm:px-6 ${banner.tone} ${slide === index ? 'z-10 translate-x-0' : slide < index ? 'pointer-events-none -translate-x-full' : 'pointer-events-none translate-x-full'}`}
          data-testid="link-dash-banner"
        >
          <div className="min-w-0">
            <p className="mt-1 truncate font-display text-xl font-bold sm:text-2xl">{banner.title}</p>
            <p className="mt-1 truncate text-sm text-white/90">{banner.text}</p>
          </div>
          <span className="shrink-0 rounded-[10px] bg-white/20 px-4 py-2 text-sm font-semibold">{banner.cta}</span>
        </Link>
      ))}
      <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
        {banners.map((banner, dot) => (
          <span key={banner.title} className={`h-1.5 rounded-full ${dot === index ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { me } = useStore();
  const banks = useBanks();
  const mistakes = useMistakes();
  const { t } = useI18n();
  const stats = useStatsMap()[me?.id ?? ''];
  const xp = stats?.xp ?? 0;
  const level = levelFromXp(xp);
  const into = xp % 500;
  const average = stats?.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
  const ready = banks.filter((bank) => (bank.questions ?? []).some((question) => cleanQuestion(question)));
  const savedCount = mistakes.filter((m) => m.saved).length;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Restored DashBanner */}
      <DashBanner />

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat
          icon={HiOutlineFire}
          label={t('stats_streak')}
          value={`${stats?.streak ?? 0} kun`}
          tone="text-amber-600 bg-amber-500/15 dark:text-orange-400"
        />
        <Stat
          icon={HiOutlineAcademicCap}
          label={t('stats_quizzes')}
          value={`${stats?.quizzes ?? 0}`}
          tone="text-med-600 bg-med-500/15 dark:text-med-400"
        />
        <Stat
          icon={HiOutlineChartBar}
          label={t('stats_accuracy')}
          value={stats?.answered ? `${average}%` : '—'}
          tone="text-sky-600 bg-sky-500/15 dark:text-sky-400"
        />
        <AccuracyChart history={stats?.history} />
        <ActionStat
          icon={HiOutlineXCircle}
          label={t('stats_mistakes')}
          value={`${mistakes.length} ta`}
          href="/mistakes"
          tone="text-rose-600 bg-rose-500/15 dark:text-rose-400"
          borderTone="hover:border-rose-500/40"
        />
        <ActionStat
          icon={HiOutlineBookmark}
          label={t('stats_saved')}
          value={`${savedCount} ta`}
          href="/mistakes?tab=saved"
          tone="text-emerald-600 bg-emerald-500/15 dark:text-emerald-400"
          borderTone="hover:border-emerald-500/40"
        />
      </div>

      {/* Feature links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/banks" className="group">
          <div className="glass-card-hover h-full p-5 sm:p-6 !rounded-[10px]">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/25 transition-transform duration-300 group-hover:scale-105">
              <HiOutlineLightningBolt className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h3 className="mt-4 font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {t('nav_banks')}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              O‘z .txt savollaringizni yuklang va tahrirlang
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm font-semibold text-violet-600 dark:text-violet-400">
              <span>Boshlash</span>
              <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        <Link href="/battle" className="group" data-testid="link-dashboard-battle">
          <div className="glass-card-hover h-full p-5 sm:p-6 !rounded-[10px]">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[10px] bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-500/25 transition-transform duration-300 group-hover:scale-105">
              <HiOutlinePlay className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h3 className="mt-4 font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Battle
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Havola yoki onlayn taklif bilan bellashing
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400">
              <span>Boshlash</span>
              <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        <Link href="/friends" className="group" data-testid="link-dashboard-friends">
          <div className="glass-card-hover h-full p-5 sm:p-6 !rounded-[10px]">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[10px] bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25 transition-transform duration-300 group-hover:scale-105">
              <Icon name="ri-user-heart-line" className="text-2xl text-white" />
            </div>
            <h3 className="mt-4 font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {t('nav_friends')}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Kursdoshlarni topish va do‘stlar tarmog‘i
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Ochish</span>
              <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>

      {/* Main bottom grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2 !rounded-[10px]">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
              <HiOutlineLightningBolt className="h-5 w-5 text-amber-500 dark:text-gold-400" /> Mashq
            </h2>
            <span className="badge-gold !rounded-[10px]">o‘z savolingiz</span>
          </div>
          {!ready.length ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[10px] bg-med-500/15 text-med-600 dark:text-med-400">
                <HiOutlineLightningBolt className="h-8 w-8" />
              </div>
              <p className="mt-4 font-semibold text-slate-700 dark:text-slate-300">Savollar to‘plami bo‘sh</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Boshlash uchun avval to‘plam yarating yoki yuklang.</p>
              <Link href="/banks" className="btn-primary mt-4 inline-flex items-center gap-2 text-xs font-semibold !rounded-[10px]">
                To‘plam yaratish <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {ready.slice(0, 4).map((bank) => {
                const count = (bank.questions ?? []).filter((q) => cleanQuestion(q)).length;
                return (
                  <div key={bank.id} className="flex flex-col justify-between rounded-[10px] border border-slate-200/80 bg-slate-50/70 p-4 transition-all hover:border-med-500/40 dark:border-white/10 dark:bg-white/[0.02]">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white truncate">{bank.name}</h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{count} ta tayyor savol</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Link
                        href={`/play/${bank.id}`}
                        className="inline-flex items-center gap-1.5 rounded-[8px] bg-med-600 hover:bg-med-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
                      >
                        <HiOutlinePlay className="h-3.5 w-3.5" /> Boshlash
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`«${bank.name}» to‘plamini o‘chirishni tasdiqlaysizmi?`)) {
                            deleteBank(bank.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="O‘chirish"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Level card */}
        <div className="glass-card p-6 !rounded-[10px]">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-900 dark:text-white">Darajangiz</h3>
            <span className="badge-primary !rounded-[8px]">Daraja {level}</span>
          </div>
          <div className="mt-4 text-center py-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-med-500 to-med-600 text-white shadow-lg shadow-med-500/25">
              <span className="font-display text-3xl font-black">{level}</span>
            </div>
            <p className="mt-3 font-display font-bold text-lg text-slate-900 dark:text-white">
              {getMedicalTitle(xp).title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {(xp ?? 0).toLocaleString()} XP to‘plandi
            </p>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-med-500" style={{ width: `${(into / 500) * 100}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Keyingi darajagacha {500 - into} XP qoldi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: IconComponent, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-[10px] border border-slate-200/80 bg-white/90 p-4 shadow-xs dark:border-white/10 dark:bg-[#111827]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-[8px] ${tone}`}>
          <IconComponent className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function ActionStat({
  icon: IconComponent,
  label,
  value,
  href,
  tone,
  borderTone,
}: {
  icon: any;
  label: string;
  value: string;
  href: string;
  tone: string;
  borderTone: string;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[10px] border border-slate-200/80 bg-white/90 p-4 shadow-xs transition-all ${borderTone} dark:border-white/10 dark:bg-[#111827]`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-[8px] transition-transform duration-200 group-hover:scale-110 ${tone}`}>
          <IconComponent className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="font-display text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{value}</p>
        <HiOutlineArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-700 dark:group-hover:text-white" />
      </div>
    </Link>
  );
}

function AccuracyChart({ history }: { history?: Record<string, any> }) {
  const data = recentAccuracy(history);
  return (
    <div className="col-span-2 rounded-[10px] border border-slate-200/80 bg-white/90 p-4 shadow-xs dark:border-white/10 dark:bg-[#111827] lg:col-span-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">So‘nggi 7 kunlik aniqlik dinamikasi</span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-med-600 dark:text-med-400">
          <HiOutlineTrendingUp className="h-3.5 w-3.5" />
          <span>Statistika</span>
        </span>
      </div>
      <div className="mt-3 h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="accuracy-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d683" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00d683" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-[6px] border border-slate-200 bg-white px-2 py-1 text-xs shadow-md dark:border-white/10 dark:bg-[#1f2937]">
                      <p className="font-bold text-slate-900 dark:text-white">{payload[0].value}% aniqlik</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area type="monotone" dataKey="accuracy" stroke="#00d683" strokeWidth={2} fill="url(#accuracy-grad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
