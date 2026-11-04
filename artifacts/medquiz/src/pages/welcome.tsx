import { useState } from 'react';
import {
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineCheck,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
} from 'react-icons/hi';
import { CustomSelect } from '@/components/custom-select';
import {
  MEDICAL_UNIVERSITIES,
  MEDICAL_FACULTIES,
  STUDY_COURSES,
} from '@/lib/education-data';
import { loginWithGoogle } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { Trophy } from '@/components/result-card';

function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function HeroCollage({ className = '' }: { className?: string }) {
  return (
    <div className={`grid h-[280px] grid-cols-[1.05fr_1fr] grid-rows-2 gap-3 sm:h-[320px] ${className}`}>
      <div className="pop-in relative row-span-2 overflow-hidden rounded-[28px] bg-gradient-to-b from-cyan-400 via-sky-500 to-blue-600 p-4 text-white shadow-lg shadow-sky-500/30">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-lg backdrop-blur-sm">
          <i className="ri-gamepad-fill leading-none" aria-hidden="true" />
        </span>
        <p className="mt-6 font-display text-[34px] font-black leading-[1.02] tracking-tight">
          O‘YNA
          <br />
          TOP
          <br />
          YUT
        </p>
        <i className="ri-stethoscope-fill pointer-events-none absolute -bottom-3 -right-3 text-[110px] leading-none text-white/25" aria-hidden="true" />
        <span className="absolute bottom-3 left-3 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-md">
          <i className="ri-star-fill mr-1 leading-none text-amber-400" aria-hidden="true" />
          Qiziqarli testlar!
        </span>
      </div>
      <div className="pop-in relative overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-500 to-purple-600 p-3.5 text-white shadow-lg shadow-purple-500/30" style={{ animationDelay: '80ms' }}>
        <i className="ri-sword-fill pointer-events-none absolute -right-2 -top-2 text-[84px] leading-none text-white/20" aria-hidden="true" />
        <p className="absolute bottom-3 left-3.5 right-3 text-xs font-bold leading-snug text-white/95">
          Do‘stlaringizni jonli bellashuvga chorlang
        </p>
      </div>
      <div className="pop-in relative flex items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 shadow-lg shadow-emerald-500/20" style={{ animationDelay: '160ms' }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_55%)]" />
        <Trophy size={112} className="trophy-bob relative drop-shadow-[0_10px_12px_rgba(124,55,15,0.35)]" />
      </div>
    </div>
  );
}

export function Welcome() {
  const { last, enter } = useStore();
  const hasValidLast = Boolean(last && last.name);
  const [mode, setMode] = useState<'resume' | 'fresh'>(hasValidLast ? 'resume' : 'fresh');
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 Form fields
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  // Step 2 Form fields (Education)
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [course, setCourse] = useState('');

  // UI state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.success && res.name) {
        const parts = res.name.trim().split(' ');
        const fName = parts[0] || '';
        const lName = parts.slice(1).join(' ') || '';

        setFirstName(fName);
        setLastName(lName);
        if (res.email) setEmail(res.email);
        if (res.avatar) setAvatar(res.avatar);
        if (res.phone) setPhone(res.phone);

        // Move to Step 2 for education details
        setStep(2);
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google orqali kirishda xatolik yuz berdi');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Step 1 submission
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!firstName.trim()) {
      setErrorMessage('Iltimos, ismingizni kiriting');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Iltimos, telefon raqamingizni kiriting');
      return;
    }
    setStep(2);
  };

  // Step 2 final submission
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || firstName.trim() || 'Foydalanuvchi';

    enter({
      name: fullName,
      phone: phone.trim(),
      email: email.trim(),
      university: university.trim(),
      faculty: faculty.trim(),
      course: course.trim(),
      avatar: avatar || null,
    });
  };

  const lastDisplayName = last?.name || 'Talaba';
  const lastInitials = (lastDisplayName || 'MQ').slice(0, 2).toUpperCase();

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19]">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-med-500/20 blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-med-600/15 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,214,131,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,214,131,0.2) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Left side hero branding */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-ocean-800 dark:via-ocean-900 dark:to-ocean-950 transition-colors" />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-med-500 to-med-600 shadow-md shadow-med-500/30 text-white">
              <span className="font-display text-2xl font-bold">M</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">MedQuiz</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tibbiy ta’lim platformasi</p>
            </div>
          </div>

          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-med-500/30 bg-med-500/10 px-3 py-1 text-xs font-semibold text-med-600 dark:text-med-400 mb-6">
              <span className="h-2 w-2 rounded-full bg-med-500 animate-pulse" />
              Onlayn tibbiy testlar va musobaqalar
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight xl:text-5xl text-slate-900 dark:text-white">
              Tibbiyot talabalari uchun
              <span className="text-gradient mt-2 block">aqlli test maydoni</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              O‘z savollaringizni yuklang, do‘stlaringiz bilan jonli battle qiling, reytingda peshqadam bo‘ling va bilimlaringizni sinovdan o‘tkazing.
            </p>

            <HeroCollage className="mt-8 max-w-md" />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span>O‘zbekiston tibbiyot oliygohlari talabalari hamjamiyati</span>
          </div>
        </div>
      </div>

      {/* Right side form card */}
      <div className="relative flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="glass-card w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-white/10">
          {/* Mobile hero */}
          <div className="mb-6 lg:hidden">
            <HeroCollage />
            <h2 className="mt-5 text-center font-display text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
              Bilim va ko‘nikmalarni
              <br />
              o‘ynab oshiring
            </h2>
            <p className="mx-auto mt-1.5 max-w-xs text-center text-xs text-slate-500 dark:text-slate-400">
              Tibbiyot testlari, do‘stlar bilan battle va reyting — hammasi bir joyda.
            </p>
          </div>

          {/* Previous account switch (if exists) */}
          {hasValidLast && last && (
            <div className="mb-6 p-1 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-[#1a2234] border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setMode('resume')}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'resume'
                    ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Oldingi hisob</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('fresh');
                  setStep(1);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'fresh'
                    ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Yangi ro‘yxat</span>
              </button>
            </div>
          )}

          {/* Quick Resume View */}
          {mode === 'resume' && hasValidLast && last ? (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-med-500 to-med-600 p-0.5 shadow-lg shadow-med-500/20 mb-3 flex items-center justify-center overflow-hidden text-2xl font-bold text-white">
                  {last.avatar ? (
                    <img src={last.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    lastInitials
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{lastDisplayName}</h3>
                {last.university && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {last.university} · {last.course || 'Talaba'}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => enter(lastDisplayName, last)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-med-600 to-med-500 py-3 px-4 font-semibold text-white shadow-md shadow-med-500/30 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>{lastDisplayName} sifatida davom etish</span>
                <HiOutlineArrowRight className="text-base" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('fresh');
                  setStep(1);
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Boshqa hisob bilan ro‘yxatdan o‘tish
              </button>
            </div>
          ) : (
            /* Multi-Step Wizard */
            <div>
              {/* Step indicator header */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  <span className={step === 1 ? 'text-med-600 dark:text-med-400 font-bold' : ''}>
                    1. Shaxsiy ma’lumotlar
                  </span>
                  <span className={step === 2 ? 'text-med-600 dark:text-med-400 font-bold' : ''}>
                    2. Ta’lim ma’lumotlari
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                  <div
                    className={`h-full bg-gradient-to-r from-med-500 to-med-600 transition-all duration-300 ${
                      step === 1 ? 'w-1/2' : 'w-full'
                    }`}
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                  <span className="shrink-0 font-bold">!</span>
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {/* STEP 1: Phone, Name, Google Login */}
              {step === 1 && (
                <form onSubmit={handleStep1Next} className="space-y-4">
                  {/* Google Sign-In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-[0.99] transition-all dark:border-white/10 dark:bg-[#1a2234] dark:text-white dark:hover:bg-[#20293d] cursor-pointer"
                  >
                    <GoogleIcon />
                    <span>{isGoogleLoading ? 'Kirilmoqda...' : 'Google orqali davom etish'}</span>
                  </button>

                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-white/10" />
                    </div>
                    <span className="relative bg-white dark:bg-[#111827] px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      yoki telefon raqam bilan
                    </span>
                  </div>

                  {/* Phone Number Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Telefon raqamingiz <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1 text-slate-400 pointer-events-none">
                        <HiOutlinePhone className="text-base" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-white/10 pr-2">
                          +998
                        </span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="90 123 45 67"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-20 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-med-500 focus:outline-none focus:ring-2 focus:ring-med-500/20 dark:border-white/10 dark:bg-[#1a2234] dark:text-white"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Ismingiz <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <HiOutlineUser className="absolute left-3 text-slate-400 text-base pointer-events-none" />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Madina"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-med-500 focus:outline-none focus:ring-2 focus:ring-med-500/20 dark:border-white/10 dark:bg-[#1a2234] dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Familiyangiz
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Rahimova"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-med-500 focus:outline-none focus:ring-2 focus:ring-med-500/20 dark:border-white/10 dark:bg-[#1a2234] dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Step 1 Next Button */}
                  <button
                    type="submit"
                    disabled={!firstName.trim()}
                    className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-med-600 to-med-500 py-2.5 px-4 text-sm font-semibold text-white shadow-md shadow-med-500/30 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Keyingi bosqich</span>
                    <HiOutlineArrowRight className="text-base" />
                  </button>
                </form>
              )}

              {/* STEP 2: University, Faculty, Course (Custom Div Dropdowns) */}
              {step === 2 && (
                <form onSubmit={handleFinalSubmit} className="space-y-4">
                  {/* User greeting chip */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#1a2234] border border-slate-200/80 dark:border-white/10">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-med-500 to-med-600 flex items-center justify-center font-bold text-white overflow-hidden text-sm">
                      {avatar ? (
                        <img src={avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        ((firstName || 'M')[0] + (lastName || '')[0]).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {firstName} {lastName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {phone ? `+998 ${phone}` : email || 'Tibbiyot talabasi'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[11px] font-semibold text-med-600 hover:text-med-500 dark:text-med-400 cursor-pointer"
                    >
                      O‘zgartirish
                    </button>
                  </div>

                  {/* University Custom Div Dropdown */}
                  <CustomSelect
                    label="Oliy ta’lim muassasasi (Institut / Universitet)"
                    placeholder="Tibbiyot oliygohini tanlang..."
                    searchPlaceholder="OTM nomi bo‘yicha qidirish..."
                    options={MEDICAL_UNIVERSITIES}
                    value={university}
                    onChange={(val) => setUniversity(val)}
                  />

                  {/* Faculty Custom Div Dropdown */}
                  <CustomSelect
                    label="Fakultet / Yo‘nalish"
                    placeholder="Fakultetni tanlang..."
                    searchPlaceholder="Fakultet qidirish..."
                    options={MEDICAL_FACULTIES}
                    value={faculty}
                    onChange={(val) => setFaculty(val)}
                  />

                  {/* Course Custom Div Dropdown */}
                  <CustomSelect
                    label="Kurs / Bosqich"
                    placeholder="Kursni tanlang..."
                    searchPlaceholder="Kurs qidirish..."
                    options={STUDY_COURSES}
                    value={course}
                    onChange={(val) => setCourse(val)}
                  />

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99] transition-all dark:border-white/10 dark:bg-[#1a2234] dark:text-slate-300 dark:hover:bg-[#20293d] cursor-pointer"
                    >
                      <HiOutlineArrowLeft className="text-base" />
                      <span>Orqaga</span>
                    </button>

                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-med-600 to-med-500 py-2.5 px-4 text-sm font-semibold text-white shadow-md shadow-med-500/30 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <HiOutlineCheck className="text-base" />
                      <span>Tizimga kirish</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
