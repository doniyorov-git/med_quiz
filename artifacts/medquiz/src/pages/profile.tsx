import { useState, useRef } from 'react';
import { Link } from 'wouter';
import { Field, Panel, Icon, fieldClass } from '@/components/chrome';
import { fileToImage } from '@/lib/images';
import { useStatsMap, useStore, useMistakes } from '@/lib/store';
import { useI18n, LANGUAGES } from '@/lib/i18n';
import { buyStreakFreeze } from '@/lib/model';
import { AlertModal } from '@/components/alert-modal';

export function Profile() {
  const { me, updateMe, leave, theme, setTheme } = useStore();
  const stats = useStatsMap()[me?.id ?? ''];
  const mistakes = useMistakes();
  const { lang, changeLanguage } = useI18n();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [shopMessage, setShopMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Settings states: Only actual practical settings (No fake sessions or unvons)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mq_sound_effects') !== 'off' && localStorage.getItem('medquiz-sound') !== 'false';
  });

  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mq_notify_battle') !== 'off' && localStorage.getItem('medquiz-notifications') !== 'false';
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('mq_sound_effects', next ? 'on' : 'off');
    localStorage.setItem('medquiz-sound', next ? 'true' : 'false');
  };

  const toggleNotif = () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    localStorage.setItem('mq_notify_battle', next ? 'on' : 'off');
    localStorage.setItem('medquiz-notifications', next ? 'true' : 'false');
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Rasm hajmi 5MB dan oshmasligi kerak');
      return;
    }
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

  if (!me) return null;

  const xp = stats?.xp ?? me.xp ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* 1. Profile Header Card */}
      <div className="rounded-[16px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
        {/* Decorative Top Banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 relative" />

        {/* Profile Content */}
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 relative">
          {/* Avatar & Edit button row */}
          <div className="flex items-end justify-between -mt-12 sm:-mt-14 mb-4">
            <div className="relative">
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
                className="group relative flex h-20 w-20 sm:h-24 sm:w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white dark:border-[#111827] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md transition-all active:scale-95"
                title="Galereyadan rasm tanlash"
              >
                {me.avatar ? (
                  <img src={me.avatar} alt={me.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="flex flex-col items-center justify-center font-bold text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400">
                    {me.name.slice(0, 2).toUpperCase() || 'MQ'}
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Rasm yuklash"
                className="absolute bottom-0 right-0 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow-md ring-2 ring-white dark:ring-[#111827] transition-all hover:scale-110 active:scale-95"
              >
                <Icon name="ri-camera-fill" className="text-xs text-white" />
              </button>
            </div>

            {/* Edit Profile Button */}
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] border border-slate-200 dark:border-white/10 bg-slate-100/90 hover:bg-slate-200/70 text-xs sm:text-sm font-bold text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Icon name="ri-edit-line" className="text-emerald-600 dark:text-emerald-400 text-base" />
              <span>Tahrirlash</span>
            </button>
          </div>

          {/* User Identity */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{me.name}</h1>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                @{me.username}
              </span>
            </div>

            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {me.university || 'Tibbiyot Universiteti'} {me.faculty ? `· ${me.faculty}` : ''}
            </p>

            {me.bio && (
              <p className="mt-2.5 text-xs italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-[8px] border border-slate-200/60 dark:border-white/5">
                “{me.bio}”
              </p>
            )}

            {uploading && <p className="mt-2 animate-pulse text-xs text-emerald-600 font-bold">Rasm yuklanmoqda...</p>}
            {uploadError && <p className="mt-2 text-xs text-rose-500 font-semibold">{uploadError}</p>}
          </div>

          {/* 4 Metric Stats Grid */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-[12px] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 text-center">
              <Icon name="ri-file-list-3-line" className="text-lg text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="mt-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{stats?.quizzes ?? 0}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Testlar</p>
            </div>

            <div className="p-3 rounded-[12px] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 text-center">
              <Icon name="ri-trophy-line" className="text-lg text-sky-600 dark:text-sky-400 mx-auto" />
              <p className="mt-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{stats?.battleWins ?? 0}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">G‘alabalar</p>
            </div>

            <div className="p-3 rounded-[12px] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 text-center">
              <Icon name="ri-fire-fill" className="text-lg text-amber-500 mx-auto" />
              <p className="mt-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{stats?.streak ?? 0} kun</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Streak</p>
            </div>

            <div className="p-3 rounded-[12px] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 text-center">
              <Icon name="ri-flashlight-fill" className="text-lg text-indigo-500 mx-auto" />
              <p className="mt-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{(xp).toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Ball (XP)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 1.5 MedCoins & Streak Freeze Wallet Banner */}
      <div className="rounded-[16px] border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30">
            <Icon name="ri-copper-coin-fill" className="text-2xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {stats?.coins ?? 20}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                MedCoins
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Streak Freeze: <strong className="text-emerald-600 dark:text-emerald-400">{stats?.streakFreezes ?? 1} ta</strong> faol (kunlik olovni saqlaydi)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShopMessage(null);
            setShopModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
        >
          <Icon name="ri-shopping-bag-3-fill" className="text-base" />
          <span>MedCoins Do‘koni</span>
        </button>
      </div>

      {/* 2. Tezkor Bo‘limlar (Quick Access Tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/mistakes"
          className="p-4 rounded-[14px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111827] hover:border-emerald-500/40 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-rose-500/10 text-rose-600 dark:text-rose-400 text-lg">
              <Icon name="ri-close-circle-line" />
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
              {mistakes.length} ta xato
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
            Xatolarim banki
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Xatolar ustida ishlab bilimlarni mustahkamlash</p>
        </Link>

        <Link
          href="/banks"
          className="p-4 rounded-[14px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111827] hover:border-emerald-500/40 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-lg">
              <Icon name="ri-book-2-line" />
            </span>
            <Icon name="ri-arrow-right-line" className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
            Test to‘plamlari
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Mavjud tibbiy fanlar va yangi test qo‘shish</p>
        </Link>

        <Link
          href="/friends"
          className="p-4 rounded-[14px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111827] hover:border-emerald-500/40 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-sky-500/10 text-sky-600 dark:text-sky-400 text-lg">
              <Icon name="ri-user-heart-line" />
            </span>
            <Icon name="ri-arrow-right-line" className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
            Kursdoshlar va Do‘stlar
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Talabalar bilan bellashish va muloqot</p>
        </Link>

        <Link
          href="/support"
          className="p-4 rounded-[14px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111827] hover:border-emerald-500/40 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-purple-500/10 text-purple-600 dark:text-purple-400 text-lg">
              <Icon name="ri-customer-service-2-line" />
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              24/7 Onlayn
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
            Qo‘llab-quvvatlash
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Jonli yordam chati va texnik ko‘mak</p>
        </Link>
      </div>

      {/* 3. Ilova Sozlamalari (Faqat amaliy parametrlar - No Sessions, No Bloat) */}
      <div className="rounded-[16px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Icon name="ri-settings-3-line" className="text-emerald-600 dark:text-emerald-400" />
            <span>Ilova sozlamalari</span>
          </h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {/* Theme Switcher */}
          <div className="flex items-center justify-between p-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Dizayn rejimi</p>
              <p className="text-xs text-slate-500">Kunduzgi yoki tungi ko‘rinish</p>
            </div>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 h-9 px-3 rounded-[8px] border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Icon name={theme === 'dark' ? 'ri-moon-line' : 'ri-sun-line'} className="text-base text-amber-500" />
              <span>{theme === 'dark' ? 'Tungi rejim' : 'Kunduzgi rejim'}</span>
            </button>
          </div>

          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between p-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Ovozli effektlar</p>
              <p className="text-xs text-slate-500">Test yechish va battle tovushlari</p>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={`flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200/80 dark:border-white/10'
              }`}
            >
              <Icon name={soundEnabled ? 'ri-volume-up-line' : 'ri-volume-mute-line'} className="text-base" />
              <span>{soundEnabled ? 'Yoqilgan' : 'O‘chirilgan'}</span>
            </button>
          </div>

          {/* Battle Notifications Toggle */}
          <div className="flex items-center justify-between p-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Battle chaqiruvlari</p>
              <p className="text-xs text-slate-500">Do‘stlar bellashuvga taklif qilganda xabar berish</p>
            </div>
            <button
              type="button"
              onClick={toggleNotif}
              className={`flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                notifEnabled
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200/80 dark:border-white/10'
              }`}
            >
              <Icon name={notifEnabled ? 'ri-notification-3-line' : 'ri-notification-off-line'} className="text-base" />
              <span>{notifEnabled ? 'Yoqilgan' : 'O‘chirilgan'}</span>
            </button>
          </div>

          {/* Language Selection */}
          <div className="flex items-center justify-between p-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Ilova tili</p>
              <p className="text-xs text-slate-500">Interfeys tili</p>
            </div>
            <div className="flex items-center gap-1">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => changeLanguage(item.code as any)}
                  className={`h-8 px-2.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
                    lang === item.code
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logout Button */}
          <div className="p-4 sm:px-6 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.01]">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tizimdan chiqish</p>
              <p className="text-[11px] text-slate-400">Shu qurilmadagi joriy seansni yakunlash</p>
            </div>
            <button
              type="button"
              onClick={leave}
              className="flex items-center gap-1.5 h-9 px-4 rounded-[8px] border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <Icon name="ri-logout-box-r-line" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-default"
            aria-label="Yopish"
            onClick={() => setEditModalOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Shaxsiy ma‘lumotlarni tahrirlash"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-[16px] sm:rounded-[14px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] shadow-2xl transition-all duration-200 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-5 py-3.5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Icon name="ri-user-settings-line" className="text-base" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Shaxsiy ma‘lumotlarni tahrirlash
                </h3>
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

            {/* Form */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5">
              <Field label="Ism va familiya">
                <input
                  className={fieldClass}
                  value={me.name}
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
              <Field label="Tibbiyot OTM / Muassasa">
                <input
                  className={fieldClass}
                  value={me.university || ''}
                  placeholder="masalan: Toshkent Tibbiyot Akademiyasi"
                  onChange={(event) => updateMe({ university: event.target.value })}
                />
              </Field>
              <Field label="Fakultet / Yo‘nalish">
                <input
                  className={fieldClass}
                  value={me.faculty || ''}
                  placeholder="masalan: Davolash ishi"
                  onChange={(event) => updateMe({ faculty: event.target.value })}
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

              {/* Avatar trigger */}
              <div className="p-3 rounded-[10px] bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-600 dark:text-slate-300 shrink-0">
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
                  className="h-8 px-3 rounded-[8px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1f2937] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Tanlash
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t border-slate-200/80 dark:border-white/10 p-3.5 bg-slate-50/70 dark:bg-white/[0.02] flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-full sm:w-auto h-9 px-5 rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Icon name="ri-check-line" className="text-base" />
                <span>Saqlash va Yopish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MedCoins Do'koni Alert Modali */}
      <AlertModal
        isOpen={shopModalOpen}
        onClose={() => setShopModalOpen(false)}
        icon="ri-shopping-bag-3-fill"
        variant="warning"
        badge="Tez kunda"
        title="MedCoins Do‘koni"
        description={
          <div className="space-y-3 text-center">
            <p className="text-slate-700 dark:text-slate-300">
              Do‘kon tez orada ishga tushiriladi! Hozirda qiziqarli tibbiy mukofotlar, streak muzlatish va noyob profil unvonlari tayyorlanmoqda.
            </p>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold">Mavjud balansingiz:</span>{' '}
              <span className="font-extrabold text-amber-600 dark:text-amber-400">{stats?.coins ?? 20} MedCoins</span>
              <p className="font-normal text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Testlar yechish va battle janglarida yutib yangi MedCoins to‘plashda davom eting!
              </p>
            </div>
          </div>
        }
        cancelText="Tushundim"
      />
    </div>
  );
}
