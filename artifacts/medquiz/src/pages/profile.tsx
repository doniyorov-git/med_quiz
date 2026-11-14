import { useState, useEffect, useRef } from 'react';
import { Field, Panel, Icon, fieldClass } from '@/components/chrome';
import { fileToImage } from '@/lib/images';
import { getMedicalTitle, levelFromXp } from '@/lib/model';
import { useStatsMap, useStore } from '@/lib/store';
import { useI18n, LANGUAGES } from '@/lib/i18n';
import { SettingsView } from '@/components/settings-view';
import type { UserSession } from '@/lib/types';

type FontSize = 'normal' | 'large' | 'huge';
type ContrastMode = 'standard' | 'high';

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
  const { me, updateMe, leave, theme, setTheme } = useStore();
  const stats = useStatsMap()[me?.id ?? ''];
  const { lang, changeLanguage } = useI18n();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'settings'>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('tab=settings')) {
      return 'settings';
    }
    return 'profile';
  });
  const [sessions, setSessions] = useState<UserSession[]>(() => getInitialSessions(me?.id || 'guest'));
  const [sessionToast, setSessionToast] = useState('');

  // Settings states
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('medquiz-font-size') as FontSize) || 'normal';
  });

  const [contrast, setContrastState] = useState<ContrastMode>(() => {
    return (localStorage.getItem('medquiz-contrast') as ContrastMode) || 'standard';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('medquiz-sound') !== 'false';
  });

  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    return localStorage.getItem('medquiz-notifications') !== 'false';
  });

  // Apply Font Size
  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('medquiz-font-size', size);
    if (size === 'large') document.documentElement.style.fontSize = '17px';
    else if (size === 'huge') document.documentElement.style.fontSize = '19px';
    else document.documentElement.style.fontSize = '15px';
  };

  // Apply Contrast
  const setContrast = (mode: ContrastMode) => {
    setContrastState(mode);
    localStorage.setItem('medquiz-contrast', mode);
    document.documentElement.classList.toggle('high-contrast', mode === 'high');
  };

  // Apply Sound
  const setSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('medquiz-sound', enabled ? 'true' : 'false');
  };

  // Apply Notifications
  const setNotif = (enabled: boolean) => {
    setNotifEnabled(enabled);
    localStorage.setItem('medquiz-notifications', enabled ? 'true' : 'false');
  };

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

  // Directly handle gallery photo selection
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
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      {/* Top Segmented Controller: Profil VS Sozlamalar */}
      <div className="flex items-center justify-center p-1 rounded-[14px] bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 max-w-sm mx-auto shadow-xs">
        <button
          type="button"
          onClick={() => setProfileTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            profileTab === 'profile'
              ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Icon name="ri-user-3-line" className="text-base" /> Profil
        </button>
        <button
          type="button"
          onClick={() => setProfileTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            profileTab === 'settings'
              ? 'bg-white dark:bg-[#111827] text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Icon name="ri-settings-3-line" className="text-base" /> Sozlamalar
        </button>
      </div>

      {profileTab === 'settings' ? (
        <SettingsView onOpenEditProfile={() => setEditModalOpen(true)} />
      ) : (
        <>
          {/* Profile Header Card */}
          <Panel className="p-4 sm:p-6 shadow-sm !rounded-[10px]">
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-5">
                  {/* Avatar (Direct gallery picker, rounded-[10px], NOT rounded-full) */}
                  <div className="relative shrink-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleAvatarChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group flex h-20 w-20 sm:h-24 sm:w-24 cursor-pointer items-center justify-center overflow-hidden rounded-[10px] border-2 border-slate-200/90 bg-slate-100 text-slate-700 shadow-sm transition-all hover:opacity-95 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 active:scale-95"
                      title="Galereyadan rasm tanlash"
                    >
                      {me.avatar ? (
                        <img src={me.avatar} alt={me.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <Icon name="ri-user-3-fill" className="text-3xl text-slate-500 dark:text-slate-400" />
                          <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400">{me.name.slice(0, 2).toUpperCase() || 'MQ'}</span>
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Galereyadan rasm yuklash"
                      aria-label="Galereyadan rasm yuklash"
                      className="absolute -bottom-1 -right-1 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] bg-primary text-white shadow-md ring-2 ring-white transition-all hover:scale-110 active:scale-95 dark:ring-[#111827]"
                    >
                      <Icon name="ri-camera-fill" className="text-xs text-white" />
                    </button>
                  </div>

                  {/* Identity */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">{me.name}</h1>
                      <span className="inline-flex items-center gap-1 rounded-[8px] bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Icon name="ri-fire-fill" /> {stats?.streak ?? 0} kun
                      </span>
                    </div>
                    <p className="truncate font-mono text-xs font-semibold text-primary sm:text-sm mt-0.5">@{me.username}</p>
                  </div>
                </div>

                {/* Edit Profile Button */}
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 h-10 px-4 rounded-[10px] border border-slate-200/90 bg-slate-100/90 hover:bg-slate-200/70 text-sm font-bold text-slate-800 shadow-xs transition-all active:scale-95 sm:w-auto dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-100"
                  data-testid="btn-open-edit-modal"
                >
                  <Icon name="ri-edit-line" className="text-emerald-600 dark:text-emerald-400" />
                  <span>Tahrirlash</span>
                </button>
              </div>

              {/* Title / Level / Points Badges - Prominently Visible & Bold */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                {/* Medical Title */}
                <div className={`inline-flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-xs sm:text-sm font-extrabold shadow-xs ${currentTitle.color}`}>
                  <Icon name={currentTitle.icon} className="text-base sm:text-lg" />
                  <span>{currentTitle.title}</span>
                </div>

                {/* Level */}
                <div className="inline-flex items-center gap-2 rounded-[10px] border border-slate-200/90 bg-slate-100/90 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-white shadow-xs">
                  <Icon name="ri-medal-line" className="text-base sm:text-lg text-primary" />
                  <span>Daraja {levelFromXp(xp)}</span>
                </div>

                {/* Points (XP) */}
                <div className="inline-flex items-center gap-2 rounded-[10px] border border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-300 shadow-xs">
                  <Icon name="ri-flashlight-fill" className="text-base sm:text-lg text-amber-500" />
                  <span>{(xp ?? 0).toLocaleString()} XP</span>
                </div>

                {me.avatar && (
                  <button
                    type="button"
                    onClick={() => updateMe({ avatar: null })}
                    className="h-10 px-3 rounded-[10px] border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    title="Rasmni o‘chirish"
                  >
                    <Icon name="ri-delete-bin-line" className="text-base" />
                    <span>Rasmni o‘chirish</span>
                  </button>
                )}
              </div>

              {me.bio && <p className="mt-3 text-xs italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 p-2.5 rounded-[8px] border border-slate-200/60 dark:border-white/5">“{me.bio}”</p>}
              {uploading && <p className="mt-2 animate-pulse text-xs text-primary font-bold">Galereyadan rasm yuklanmoqda...</p>}
              {uploadError && <p className="mt-2 text-xs text-rose-500 font-semibold">{uploadError}</p>}

              {/* Quick stats grid */}
              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: 'Testlar', value: stats?.quizzes ?? 0, icon: 'ri-file-list-3-line', box: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20', ic: 'text-emerald-600 dark:text-emerald-400', num: 'text-emerald-700 dark:text-emerald-300' },
                  { label: 'G‘alabalar', value: stats?.battleWins ?? 0, icon: 'ri-trophy-line', box: 'bg-sky-50 border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/20', ic: 'text-sky-600 dark:text-sky-400', num: 'text-sky-700 dark:text-sky-300' },
                  { label: 'Streak', value: `${stats?.streak ?? 0} kun`, icon: 'ri-fire-fill', box: 'bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20', ic: 'text-amber-500', num: 'text-amber-700 dark:text-amber-300' },
                ].map((c) => (
                  <div key={c.label} className={`rounded-[10px] border p-2.5 text-center sm:p-3.5 ${c.box}`}>
                    <Icon name={c.icon} className={`text-lg sm:text-xl ${c.ic}`} />
                    <p className={`mt-1 text-base font-extrabold leading-none sm:text-xl ${c.num}`}>{c.value}</p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-500 sm:text-xs dark:text-slate-400">{c.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Quick link to Settings from Profile */}
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={() => setProfileTab('settings')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[12px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Icon name="ri-settings-3-line" className="text-base text-emerald-600 dark:text-emerald-400" />
              <span>Barcha sozlamalarni ochish (iOS)</span>
            </button>
          </div>
        </>
      )}

      {/* Bottom Sheet Modal for Editing Personal Details */}
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
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-[14px] sm:rounded-[10px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] shadow-2xl transition-all duration-300 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-250"
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
                    Ism, username va bio ma‘lumotlarini o‘zgartiring
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
              <div className="space-y-3">
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
                <Field label="Bio (Qisqacha o‘zingiz haqingizda)">
                  <textarea
                    rows={2}
                    className={`${fieldClass} resize-none`}
                    value={me.bio || ''}
                    placeholder="Bo‘lajak kardiolog..."
                    onChange={(event) => updateMe({ bio: event.target.value })}
                  />
                </Field>

                {/* Direct gallery photo trigger inside modal too */}
                <div className="p-3 rounded-[10px] bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-[8px] overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-600 dark:text-slate-300 shrink-0">
                      {me.avatar ? (
                        <img src={me.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        me.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">Profil rasmi</p>
                      <p className="text-[11px] text-slate-500">Galereyadan o‘z rasmingizni yuklang</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 px-3 rounded-[8px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1f2937] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Galereyadan tanlash
                  </button>
                </div>
              </div>
            </div>

            {/* Sticky Save Footer */}
            <div className="border-t border-slate-200/80 dark:border-white/10 p-3.5 bg-slate-50/70 dark:bg-white/[0.02] flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-full sm:w-auto h-10 px-5 rounded-[10px] bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Icon name="ri-check-line" className="text-base" />
                <span>Saqlash va Yopish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
