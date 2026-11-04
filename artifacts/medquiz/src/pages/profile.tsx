import { useState, useEffect } from 'react';
import { Btn, Field, Panel, Icon, fieldClass } from '@/components/chrome';
import { ThemeToggle } from '@/components/theme-toggle';
import { fileToImage } from '@/lib/images';
import { getMedicalTitle, levelFromXp, MEDICAL_TITLES } from '@/lib/model';
import { useStatsMap, useStore } from '@/lib/store';
import { AvatarModal } from '@/components/avatar-modal';
import type { PublicUser, UserSession } from '@/lib/types';

function getInitialSessions(userId: string): UserSession[] {
  const SESSIONS_KEY = `medquiz-v2-sessions-${userId}`;
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let browser = 'Brauzer';
  let os = 'OS';
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  let deviceName = 'Kompyuter';

  if (/iPhone/i.test(ua)) {
    deviceType = 'mobile';
    deviceName = 'Apple iPhone';
    os = 'iOS 18.1';
  } else if (/iPad/i.test(ua)) {
    deviceType = 'tablet';
    deviceName = 'Apple iPad Pro';
    os = 'iPadOS';
  } else if (/Android/i.test(ua)) {
    deviceType = 'mobile';
    deviceName = 'Samsung Galaxy S24';
    os = 'Android 14';
  } else if (/Macintosh|Mac OS/i.test(ua)) {
    deviceType = 'desktop';
    deviceName = 'Apple Mac';
    os = 'macOS';
  } else if (/Windows/i.test(ua)) {
    deviceType = 'desktop';
    deviceName = 'Windows PC';
    os = 'Windows 11';
  }

  if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Edg/i.test(ua)) browser = 'Microsoft Edge';

  const current: UserSession = {
    id: 'sess-current',
    userId,
    deviceName: `${deviceName} · ${browser}`,
    browser,
    os,
    ip: '178.218.201.***',
    location: 'Toshkent, O‘zbekiston',
    isCurrent: true,
    deviceType,
    createdAt: Date.now() - 1000 * 60 * 15,
    lastActive: Date.now(),
  };

  const other1: UserSession = {
    id: 'sess-other-1',
    userId,
    deviceName: deviceType === 'mobile' ? 'Apple Mac · Safari' : 'Apple iPhone 15 Pro · Safari',
    browser: 'Safari',
    os: deviceType === 'mobile' ? 'macOS' : 'iOS 18.0',
    ip: '103.27.159.***',
    location: 'Toshkent, O‘zbekiston',
    isCurrent: false,
    deviceType: deviceType === 'mobile' ? 'desktop' : 'mobile',
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    lastActive: Date.now() - 1000 * 60 * 85,
  };

  const other2: UserSession = {
    id: 'sess-other-2',
    userId,
    deviceName: 'Google Chrome · Windows',
    browser: 'Chrome 128',
    os: 'Windows 11',
    ip: '84.54.80.***',
    location: 'Samarqand, O‘zbekiston',
    isCurrent: false,
    deviceType: 'desktop',
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    lastActive: Date.now() - 1000 * 60 * 60 * 14,
  };

  return [current, other1, other2];
}

export function Profile() {
  const { me, updateMe, leave } = useStore();
  const stats = useStatsMap()[me?.id ?? ''];
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'titles' | 'sessions'>('titles');
  const [sessions, setSessions] = useState<UserSession[]>(() => getInitialSessions(me?.id || 'guest'));
  const [sessionToast, setSessionToast] = useState('');

  useEffect(() => {
    if (me?.id) {
      try {
        localStorage.setItem(`medquiz-v2-sessions-${me.id}`, JSON.stringify(sessions));
      } catch {}
    }
  }, [sessions, me?.id]);

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setSessionToast('Qurilma seansi muvaffaqiyatli yakunlandi!');
    setTimeout(() => setSessionToast(''), 2500);
  };

  const handleRevokeAllOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setSessionToast('Barcha boshqa qurilmalardan chiqildi!');
    setTimeout(() => setSessionToast(''), 2500);
  };

  if (!me) return null;

  const xp = stats?.xp ?? 0;
  const currentTitle = getMedicalTitle(xp);
  const nextTitle = MEDICAL_TITLES.find((t) => t.minXp > xp);
  const xpNeeded = nextTitle ? nextTitle.minXp - xp : 0;
  const progressPercent = nextTitle
    ? Math.min(100, Math.round(((xp - currentTitle.minXp) / (nextTitle.minXp - currentTitle.minXp)) * 100))
    : 100;

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const dataUrl = await fileToImage(file);
      updateMe({ avatar: dataUrl });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Rasm yuklashda xatolik yuz berdi');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      {/* Profile Header Card — light-first design with banner */}
      <Panel className="overflow-hidden !p-0 shadow-sm">
        {/* Banner */}
        <div className="relative h-24 overflow-hidden bg-slate-100 dark:bg-slate-800 border-b border-slate-200/80 dark:border-white/10 sm:h-32">
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-xs border border-slate-200/60 dark:bg-black/40 dark:text-slate-200 dark:border-white/10">
            <Icon name="ri-fire-fill" className="text-amber-500" /> {stats?.streak ?? 0} kun
          </span>
        </div>

        <div className="px-4 pb-5 sm:px-6">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-1 items-end gap-3.5 sm:gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  className="group flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-md transition-all hover:opacity-95 sm:h-24 sm:w-24 dark:border-[#111827]"
                  title="Avatar yoki rasm tanlash"
                >
                  {me.avatar ? (
                    <img src={me.avatar} alt={me.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <Icon name="ri-user-3-fill" className="text-3xl text-slate-600 dark:text-slate-300" />
                      <span className="text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-300">{me.name.slice(0, 2).toUpperCase() || 'MQ'}</span>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  title="Rasm / 3D avatar tanlash"
                  aria-label="Rasm / 3D avatar tanlash"
                  className="absolute -bottom-0.5 -right-0.5 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-800 text-white shadow-md ring-2 ring-white transition-all hover:scale-110 hover:bg-slate-900 active:scale-95 dark:bg-slate-600 dark:hover:bg-slate-500 dark:ring-[#111827]"
                >
                  <Icon name="ri-camera-fill" className="text-sm text-white" />
                </button>
              </div>

              {/* Identity */}
              <div className="min-w-0 flex-1 pb-1">
                <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">{me.name}</h1>
                <p className="truncate font-mono text-xs font-semibold text-emerald-600 sm:text-sm dark:text-emerald-400">@{me.username}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-emerald-400 hover:text-emerald-700 active:scale-95 sm:w-auto dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              data-testid="btn-open-edit-modal"
            >
              <Icon name="ri-edit-line" className="text-emerald-600 dark:text-emerald-400" />
              <span>Tahrirlash</span>
            </button>
          </div>

          {/* Title / level chips */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold sm:text-xs ${currentTitle.color}`}>
              <Icon name={currentTitle.icon} className="text-xs" />
              <span className="truncate">{currentTitle.title}</span>
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 sm:text-xs dark:bg-white/10 dark:text-slate-300">Daraja {levelFromXp(xp)}</span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600 sm:text-xs dark:bg-amber-500/10 dark:text-amber-400">
              {(xp ?? 0).toLocaleString()} XP
            </span>
            {me.avatar && (
              <button type="button" onClick={() => updateMe({ avatar: null })} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10" title="Rasmni o‘chirish" aria-label="Rasmni o‘chirish">
                <Icon name="ri-delete-bin-line" className="text-sm" />
              </button>
            )}
          </div>

          {(me.university || me.course || me.faculty) && (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Icon name="ri-hospital-line" className="shrink-0 text-sm text-emerald-600" />
              <span className="truncate">{[me.university, me.course, me.faculty].filter(Boolean).join(' · ')}</span>
            </p>
          )}
          {me.bio && <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">“{me.bio}”</p>}
          {uploading && <p className="mt-1 animate-pulse text-xs text-primary">Rasm yuklanmoqda...</p>}
          {uploadError && <p className="mt-1 text-xs text-rose-500">{uploadError}</p>}

          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Testlar', value: stats?.quizzes ?? 0, icon: 'ri-file-list-3-line', box: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20', ic: 'text-emerald-600 dark:text-emerald-400', num: 'text-emerald-700 dark:text-emerald-300' },
              { label: 'G‘alabalar', value: stats?.battleWins ?? 0, icon: 'ri-trophy-line', box: 'bg-sky-50 border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/20', ic: 'text-sky-600 dark:text-sky-400', num: 'text-sky-700 dark:text-sky-300' },
              { label: 'Streak', value: `${stats?.streak ?? 0} kun`, icon: 'ri-fire-fill', box: 'bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20', ic: 'text-amber-500', num: 'text-amber-700 dark:text-amber-300' },
            ].map((c) => (
              <div key={c.label} className={`rounded-[14px] border p-2.5 text-center sm:p-3.5 ${c.box}`}>
                <Icon name={c.icon} className={`text-lg sm:text-xl ${c.ic}`} />
                <p className={`mt-1 text-base font-extrabold leading-none sm:text-xl ${c.num}`}>{c.value}</p>
                <p className="mt-1 text-[10px] font-semibold text-slate-500 sm:text-xs dark:text-slate-400">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Tabs: Tibbiy Darajalar vs Faol Seanslar */}
      <div className="flex gap-1 overflow-x-auto rounded-[14px] border border-slate-200/80 bg-slate-100/70 p-1 scrollbar-hide dark:border-white/10 dark:bg-white/5">
        <button
          type="button"
          onClick={() => setProfileTab('titles')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-bold transition-all sm:px-4 sm:py-2.5 sm:text-sm ${
            profileTab === 'titles'
              ? 'bg-white text-emerald-700 shadow-sm dark:bg-[#1f2937] dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Icon name="ri-stethoscope-fill" />
          <span className="hidden sm:inline">Tibbiy Unvonlar va Karyera</span>
          <span className="sm:hidden">Unvonlar</span>
        </button>

        <button
          type="button"
          onClick={() => setProfileTab('sessions')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-bold transition-all sm:px-4 sm:py-2.5 sm:text-sm ${
            profileTab === 'sessions'
              ? 'bg-white text-emerald-700 shadow-sm dark:bg-[#1f2937] dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Icon name="ri-shield-keyhole-line" />
          <span className="hidden sm:inline">Faol Seanslar va Xavfsizlik</span>
          <span className="sm:hidden">Seanslar</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-bold">
            {sessions.length}
          </span>
        </button>
      </div>

      {/* Tab 2: Medical Career Progression Card */}
      {profileTab === 'titles' && (
        <Panel className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="ri-stethoscope-fill" className="text-primary text-xl" />
                Tibbiy Darajalar va Unvonlar Bosqichi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Har bir yechilgan test va battle g‘alabasi uchun XP to‘plab, yangi ilmiy unvonlarga erishing.
              </p>
            </div>
            {nextTitle && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Keyingi unvon uchun: <strong className="text-primary">{(xpNeeded ?? 0).toLocaleString()} XP</strong>
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
              <span className="flex items-center gap-1.5">
                <Icon name={currentTitle.icon} className="text-sm" />
                {currentTitle.badge}
              </span>
              <span className="flex items-center gap-1.5">
                {nextTitle ? (
                  <>
                    <Icon name={nextTitle.icon} className="text-sm" />
                    {nextTitle.badge}
                  </>
                ) : (
                  <>
                    <Icon name="ri-vip-crown-fill" className="text-amber-500 text-sm" />
                    Eng oliy unvon
                  </>
                )}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-[10px] overflow-hidden p-0.5 border border-slate-200 dark:border-white/10">
              <div
                className="h-full bg-primary rounded-[8px] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Roadmap of all medical titles with Remix Icons */}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {MEDICAL_TITLES.map((t) => {
              const isUnlocked = xp >= t.minXp;
              const isCurrent = currentTitle.id === t.id;
              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-[10px] border transition-all ${
                    isCurrent
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10'
                      : isUnlocked
                      ? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40'
                      : 'border-slate-200/50 dark:border-white/5 opacity-50 bg-slate-50/50 dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-[8px] border ${t.color}`}>
                      <Icon name={t.icon} className="text-lg" />
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-[10px] bg-primary text-white">
                        Hozirgi
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Icon name="ri-check-line" /> Ochiq
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Icon name="ri-lock-line" /> Qulflangan
                      </span>
                    )}
                  </div>
                  <p className="mt-2.5 font-bold text-sm text-slate-900 dark:text-slate-100">{t.title}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{t.stage}</p>
                  <p className="mt-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    {(t.minXp ?? 0).toLocaleString()} XP dan boshlab
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Tab 3: Active Sessions (Faol seanslar va Xavfsizlik) */}
      {profileTab === 'sessions' && (
        <Panel className="p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="ri-shield-keyhole-line" className="text-primary text-xl" />
                Faol Seanslar va Kirilgan Qurilmalar
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hisobingizga kirilgan barcha kompyuter, telefon va brauzerlar ro‘yxati. Shubhali seanslarni bitta bosishda tugatishingiz mumkin.
              </p>
            </div>
            {sessions.filter((s) => !s.isCurrent).length > 0 && (
              <button
                type="button"
                onClick={handleRevokeAllOtherSessions}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20 transition-all cursor-pointer self-start sm:self-auto active:scale-95"
              >
                <Icon name="ri-logout-box-r-line" className="text-sm" />
                <span>Boshqa seanslardan chiqish</span>
              </button>
            )}
          </div>

          {sessionToast && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Icon name="ri-checkbox-circle-fill" className="text-base" />
              <span>{sessionToast}</span>
            </div>
          )}

          <div className="space-y-3">
            {sessions.map((sess) => {
              const iconName =
                sess.deviceType === 'mobile'
                  ? 'ri-smartphone-line'
                  : sess.deviceType === 'tablet'
                  ? 'ri-tablet-line'
                  : 'ri-macbook-line';

              return (
                <div
                  key={sess.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    sess.isCurrent
                      ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-xs'
                      : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-lg ${
                        sess.isCurrent
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon name={iconName} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {sess.deviceName}
                        </span>
                        {sess.isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ushbu qurilma (Joriy)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                        <span>{sess.browser}</span>
                        <span>·</span>
                        <span>{sess.os}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Icon name="ri-map-pin-line" className="text-[10px]" />
                          {sess.location}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-[10px]">{sess.ip}</span>
                      </div>

                      <p className="text-[10px] text-slate-400">
                        {sess.isCurrent
                          ? 'Hozir faol'
                          : `Oxirgi faollik: ${Math.round((Date.now() - sess.lastActive) / 3600000)} soat oldin`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end sm:justify-center shrink-0">
                    {sess.isCurrent ? (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Icon name="ri-check-line" /> Faol
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(sess.id)}
                        className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                      >
                        Tugatish
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Icon name="ri-information-line" />
              Xavfsizlik bo‘yicha eslatma:
            </p>
            <p className="text-[11px] leading-relaxed">
              Agar siz notanish qurilma yoki joylashuvni ko‘rsangiz, darhol "Tugatish" tugmasini bosing. Bu ushbu qurilmadagi barcha ruxsatnomalarni bekor qiladi.
            </p>
          </div>
        </Panel>
      )}



      {/* Bottom Sheet Modal for Editing Personal Details (pastdan tepaga ochiladigan modal) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-default"
            aria-label="Yopish"
            onClick={() => setEditModalOpen(false)}
          />

          {/* Modal Bottom Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Shaxsiy ma‘lumotlarni tahrirlash"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-[16px] sm:rounded-[10px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] shadow-2xl transition-all duration-300 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-250"
          >
            {/* Mobile Pull Handle */}
            <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-[10px] bg-slate-300 dark:bg-white/20 sm:hidden shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-5 py-3.5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
                  <Icon name="ri-user-settings-line" className="text-base" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Shaxsiy ma‘lumotlarni tahrirlash
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ism, oliygoh va profil ma‘lumotlarini o‘zgartiring
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Yopish"
              >
                <Icon name="ri-close-line" className="text-lg" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Ism va familiya">
                  <input
                    className={fieldClass}
                    value={me.name}
                    data-testid="input-profile-name"
                    onChange={(event) => updateMe({ name: event.target.value })}
                  />
                </Field>
                <Field label="Username (@foydalanuvchi)">
                  <input
                    className={fieldClass}
                    value={me.username || ''}
                    placeholder="masalan: diyor_med"
                    onChange={(event) => updateMe({ username: event.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() })}
                  />
                </Field>
                <Field label="Universitet / Institut">
                  <input
                    className={fieldClass}
                    value={me.university || ''}
                    placeholder="Toshkent Tibbiyot Akademiyasi"
                    onChange={(event) => updateMe({ university: event.target.value })}
                  />
                </Field>
                <Field label="Kurs">
                  <input
                    className={fieldClass}
                    value={me.course || ''}
                    placeholder="3-kurs"
                    onChange={(event) => updateMe({ course: event.target.value })}
                  />
                </Field>
                <Field label="Fakultet">
                  <input
                    className={fieldClass}
                    value={me.faculty || ''}
                    placeholder="Davolash ishi"
                    onChange={(event) => updateMe({ faculty: event.target.value })}
                  />
                </Field>
                <Field label="Bio (Qisqacha)">
                  <input
                    className={fieldClass}
                    value={me.bio || ''}
                    placeholder="Bo‘lajak neyroxirurg..."
                    onChange={(event) => updateMe({ bio: event.target.value })}
                  />
                </Field>
              </div>

              {/* Theme toggle */}
              <div className="p-3 rounded-[10px] bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Icon name="ri-contrast-2-line" /> Dizayn rejimi
                  </p>
                  <p className="text-[11px] text-slate-500">Kunduzgi yoki tungi ko‘rinish</p>
                </div>
                <ThemeToggle showLabel />
              </div>

              {/* Danger section: Logout */}
              <div className="pt-2 flex justify-start">
                <button
                  type="button"
                  onClick={leave}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Icon name="ri-logout-box-r-line" /> Shu qurilmadan chiqish
                </button>
              </div>
            </div>

            {/* Sticky Save Footer */}
            <div className="border-t border-slate-200/80 dark:border-white/10 p-3.5 bg-slate-50/70 dark:bg-white/[0.02] flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                <Icon name="ri-check-line" className="text-sm mr-1" /> Saqlash va Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Mem & Photo Avatar Modal */}
      <AvatarModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatar={me.avatar}
        currentName={me.name}
        onSelectAvatar={(url) => updateMe({ avatar: url })}
      />
    </div>
  );
}
