import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { HiOutlineAcademicCap, HiOutlineArrowRight, HiOutlineBookmark, HiOutlineChartBar, HiOutlineFire, HiOutlineLightningBolt, HiOutlinePlay, HiOutlineTrash, HiOutlineTrendingUp, HiOutlineXCircle } from 'react-icons/hi';
import { deleteBank, getMedicalTitle, levelFromXp, recentAccuracy } from '@/lib/model';
import { Icon } from '@/components/chrome';
import { cleanQuestion } from '@/lib/parser';
import { useBanks, useMistakes, useStatsMap, useStore } from '@/lib/store';
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
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">Reklama</p>
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
  const stats = useStatsMap()[me?.id ?? ''];
  const xp = stats?.xp ?? 0;
  const level = levelFromXp(xp);
  const into = xp % 500;
  const average = stats?.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
  const ready = banks.filter((bank) => (bank.questions ?? []).some((question) => cleanQuestion(question)));
  const savedCount = mistakes.filter((m) => m.saved).length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <DashBanner />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat icon={HiOutlineFire} label="Streak" value={`${stats?.streak ?? 0} kun`} tone="text-amber-600 bg-amber-500/15 dark:text-orange-400" />
        <Stat icon={HiOutlineAcademicCap} label="Yechilgan testlar" value={`${stats?.quizzes ?? 0}`} tone="text-med-600 bg-med-500/15 dark:text-med-400" />
        <Stat icon={HiOutlineChartBar} label="O‘rtacha aniqlik" value={stats?.answered ? `${average}%` : '—'} tone="text-sky-600 bg-sky-500/15 dark:text-sky-400" />
        <AccuracyChart history={stats?.history} />
        <ActionStat
          icon={HiOutlineXCircle}
          label="Xatolarim"
          value={`${mistakes.length} ta`}
          href="/mistakes"
          tone="text-rose-600 bg-rose-500/15 dark:text-rose-400"
          borderTone="hover:border-rose-500/40"
        />
        <ActionStat
          icon={HiOutlineBookmark}
          label="Saqlanganlar"
          value={`${savedCount} ta`}
          href="/mistakes?tab=saved"
          tone="text-emerald-600 bg-emerald-500/15 dark:text-emerald-400"
          borderTone="hover:border-emerald-500/40"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/banks" className="group">
          <div className="glass-card-hover h-full p-5 sm:p-6">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/25 transition-transform duration-300 group-hover:scale-105">
              <HiOutlineLightningBolt className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h3 className="mt-4 font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">To‘plamlar</h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">O‘z .txt savollaringizni yuklang va tahrirlang</p>
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm font-semibold text-violet-600 dark:text-violet-400">Boshlash <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
          </div>
        </Link>
        <Link href="/battle" className="group" data-testid="link-dashboard-battle">
          <div className="glass-card-hover h-full p-5 sm:p-6">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[10px] bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-500/25 transition-transform duration-300 group-hover:scale-105">
              <HiOutlinePlay className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h3 className="mt-4 font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Battle</h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">Havola yoki onlayn taklif bilan bellashing</p>
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400">Boshlash <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
          </div>
        </Link>
        <Link href="/friends" className="group" data-testid="link-dashboard-friends">
          <div className="glass-card-hover h-full p-5 sm:p-6">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[10px] bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25 transition-transform duration-300 group-hover:scale-105">
              <Icon name="ri-user-heart-line" className="text-2xl text-white" />
            </div>
            <h3 className="mt-4 font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Do‘stlar</h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">Kursdoshlarni topish va Instagram-uslubdagi profillar</p>
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">Ochish <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
          </div>
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
              <HiOutlineLightningBolt className="h-5 w-5 text-amber-500 dark:text-gold-400" /> Mashq
            </h2>
            <span className="badge-gold !rounded-[10px]">o‘z savolingiz</span>
          </div>
          {!ready.length ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[10px] bg-med-500/15 text-med-600 dark:text-med-400">
                <HiOutlineAcademicCap className="h-8 w-8" />
              </div>
              <p className="mt-4 text-slate-500 dark:text-slate-400">Hali savol yo‘q. To‘plamlardan boshlang.</p>
              <Link href="/banks" className="btn-secondary mt-4 inline-flex !rounded-[10px]">Savollarni yuklash</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {ready.slice(0, 4).map((bank) => (
                <div key={bank.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-[#111827]">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{bank.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{(bank.questions ?? []).filter((question) => cleanQuestion(question)).length} ta savol</p>
                  </div>
                  <Link href={`/play/${bank.id}`} className="btn-primary px-4 py-2 text-xs sm:text-sm !rounded-[10px]" data-testid={`link-play-${bank.id}`}>Boshlash</Link>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass-card p-6">
          <h2 className="mb-6 font-display text-lg font-bold text-slate-900 dark:text-white">Daraja va Unvon</h2>
          <div className="text-center">
            <div className="relative mx-auto h-28 w-28">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#00d683" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(into / 500) * 264} 264`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">{level}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">daraja</span>
              </div>
            </div>
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-xs font-semibold border ${getMedicalTitle(xp).color}`}>
                <Icon name={getMedicalTitle(xp).icon} className="text-sm" />
                <span>{getMedicalTitle(xp).title}</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">{into} / 500 XP keyingi darajagacha</p>
            <Link href="/achievements" className="mt-3 inline-flex text-xs font-semibold text-med-600 dark:text-med-400 hover:underline" data-testid="link-achievements">Yutuqlar va unvonlar</Link>
          </div>
        </div>
      </div>
      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-slate-900 dark:text-white">Fanlar</h2>
        {!ready.length ? (
          <div className="glass-card p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Hali fan yo‘q. To‘plamlar sahifasida fan nomini yozib savol yuklang.</p>
            <Link href="/banks" className="btn-secondary mt-4 inline-flex !rounded-[10px]">Savollarni yuklash</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ready.map((bank) => {
              const count = (bank.questions ?? []).filter((question) => cleanQuestion(question)).length;
              return (
                <div key={bank.id} className="glass-card flex h-full flex-col justify-between p-6 hover:border-med-500/30 transition-all hover:shadow-md" data-testid={`card-subject-${bank.id}`}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-med-600 dark:text-med-400">Fan</p>
                    <h3 className="mt-2 font-display text-xl font-bold text-slate-900 dark:text-white">{bank.name}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{count} ta tayyor savol</p>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
                    <Link href={`/play/${bank.id}`} className="btn-primary shrink-0 !rounded-[10px] !px-3.5 !py-2 text-xs font-semibold" data-testid={`link-subject-play-${bank.id}`}>Boshlash</Link>
                    <Link href={`/banks/${bank.id}`} className="btn-secondary shrink-0 !rounded-[10px] !px-3.5 !py-2 text-xs font-medium" data-testid={`link-subject-open-${bank.id}`}>Tahrirlash</Link>
                    <button type="button" className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[10px] p-2 text-xs font-semibold text-slate-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400" data-testid={`button-delete-subject-${bank.id}`} onClick={() => { if (window.confirm(`«${bank.name}» to‘plamini o‘chirishni xohlaysizmi?`)) deleteBank(bank.id); }}>
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function AccuracyChart({ history }: { history: Stats['history'] }) {
  const series = recentAccuracy(history);
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-med-500/15 text-med-600 dark:text-med-400">
        <HiOutlineTrendingUp className="h-5 w-5" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">So‘nggi natijalar</p>
      <div className="mt-1 h-8" aria-label="So‘nggi 7 kun aniqlik">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
            <defs>
              <linearGradient id="dash-accuracy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d683" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#00d683" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              cursor={{ stroke: 'rgba(0,214,131,0.35)', strokeWidth: 1 }}
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12, color: '#e2e8f0' }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value) => [`${value}%`, 'Aniqlik']}
            />
            <Area type="monotone" dataKey="accuracy" stroke="#00d683" strokeWidth={2} fill="url(#dash-accuracy)" dot={false} activeDot={{ r: 3, fill: '#00d683', stroke: '#0f172a' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ icon: Glyph, label, value, tone }: { icon: typeof HiOutlineFire; label: string; value: string; tone: string }) {
  return (
    <div className="glass-card p-5">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] ${tone}`}><Glyph className="h-5 w-5" /></div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function ActionStat({
  icon: Glyph,
  label,
  value,
  href,
  tone,
  borderTone,
}: {
  icon: typeof HiOutlineFire;
  label: string;
  value: string;
  href: string;
  tone: string;
  borderTone: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className={`glass-card p-5 h-full transition-all duration-200 border border-transparent ${borderTone} group-hover:shadow-md flex flex-col justify-between`}>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${tone}`}>
              <Glyph className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors flex items-center gap-1">
              Ko‘rish <HiOutlineArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Link>
  );
}

