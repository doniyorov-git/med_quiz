import { useState } from 'react';
import {
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineAtSymbol,
} from 'react-icons/hi';
import { loginWithGoogle } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { findAccountByLogin, normalizeUsername, normalizePhone, saveStoredAccount } from '@/lib/auth-storage';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from '@/lib/i18n';
import { defaultUsername } from '@/lib/model';

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

export function Welcome() {
  const { enter } = useStore();
  const { t } = useI18n();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

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
        const rawName = res.name.trim();
        const email = res.email || '';
        const suggestedUsername = email ? email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() : defaultUsername(rawName);

        // Check if account already exists
        const existing = findAccountByLogin(email) || findAccountByLogin(suggestedUsername);

        enter(
          {
            name: rawName,
            username: existing?.username || suggestedUsername,
            email: email,
            phone: res.phone || existing?.phone || '',
            avatar: res.avatar || null,
          },
          existing ? (existing as any) : null
        );
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google orqali kirishda xatolik yuz berdi');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const identifier = loginIdentifier.trim();
    if (!identifier) {
      setErrorMessage(t('auth_phone_or_username') + ' kiritilishi shart');
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMessage(t('auth_password_required'));
      return;
    }

    const found = findAccountByLogin(identifier);
    if (found) {
      if (found.password && found.password !== loginPassword.trim()) {
        setErrorMessage(t('auth_invalid_credentials'));
        return;
      }
      enter(
        {
          name: found.name,
          username: found.username,
          phone: found.phone,
          email: found.email,
          avatar: found.avatar,
        },
        found as any
      );
    } else {
      // If first-time login without prior stored account, allow direct login
      const cleanUser = identifier.startsWith('@')
        ? normalizeUsername(identifier)
        : identifier.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'foydalanuvchi';
      enter({
        name: identifier,
        username: cleanUser,
        phone: identifier.replace(/\D/g, '').length >= 9 ? identifier : '',
        password: loginPassword.trim(),
      });
    }
  };

  // Submit Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const fullName = regFullName.trim();
    if (!fullName) {
      setErrorMessage(t('auth_name_required'));
      return;
    }

    const cleanUsername = normalizeUsername(regUsername);
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage(t('auth_username_required') + ' (kamida 3 ta belgi: harf, raqam yoki _)');
      return;
    }

    const cleanPhone = regPhone.trim();
    if (!cleanPhone) {
      setErrorMessage(t('auth_phone_required'));
      return;
    }

    if (!regPassword.trim() || regPassword.trim().length < 6) {
      setErrorMessage(t('auth_password_required'));
      return;
    }

    // Check if username is already taken
    const existing = findAccountByLogin(cleanUsername);
    if (existing) {
      setErrorMessage(`@${cleanUsername} foydalanuvchi nomi band. Boshqa username tanlang.`);
      return;
    }

    enter({
      name: fullName,
      username: cleanUsername,
      phone: cleanPhone,
      password: regPassword.trim(),
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#0b0f19] p-4 sm:p-6">
      {/* Top right language switch */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      {/* Subtle medical ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-med-500/15 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-med-600/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,214,131,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,214,131,0.2) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Main Auth Card (Strictly 10px rounded, no annoying promo collage) */}
      <div className="relative z-10 w-full max-w-md rounded-[10px] border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#111827]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-gradient-to-br from-med-500 to-med-600 shadow-lg shadow-med-500/30 text-white mb-3">
            <span className="font-display text-2xl font-black">M</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            MedQuiz
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('app_subtitle')}
          </p>
        </div>

        {/* Tab switch: Kirish / Ro‘yxatdan o‘tish */}
        <div className="grid grid-cols-2 gap-1 rounded-[10px] bg-slate-100 p-1 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 mb-5">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
            }}
            className={`py-2 text-xs sm:text-sm font-bold rounded-[8px] transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1f2937] dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            data-testid="tab-login"
          >
            {t('auth_login_tab')}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMessage('');
            }}
            className={`py-2 text-xs sm:text-sm font-bold rounded-[8px] transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1f2937] dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            data-testid="tab-register"
          >
            {t('auth_register_tab')}
          </button>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="mb-4 rounded-[10px] border border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <span className="shrink-0 font-bold">!</span>
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* ===================== TAB 1: LOGIN ===================== */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Phone or Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('auth_phone_or_username')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <HiOutlinePhone className="absolute left-3 text-slate-400 text-base pointer-events-none" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={t('auth_phone_placeholder')}
                  className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-med-500 focus:outline-none focus:ring-1 focus:ring-med-500 dark:border-white/10 dark:bg-[#1a2234] dark:text-white"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('auth_password')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <HiOutlineLockClosed className="absolute left-3 text-slate-400 text-base pointer-events-none" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t('auth_password_placeholder')}
                  className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-med-500 focus:outline-none focus:ring-1 focus:ring-med-500 dark:border-white/10 dark:bg-[#1a2234] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                >
                  {showLoginPassword ? <HiOutlineEyeOff className="text-base" /> : <HiOutlineEye className="text-base" />}
                </button>
              </div>
            </div>

            {/* Submit Login Button */}
            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-med-600 to-med-500 py-2.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-med-500/25 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
              data-testid="button-login-submit"
            >
              <span>{t('auth_login_btn')}</span>
            </button>
          </form>
        )}

        {/* ===================== TAB 2: REGISTER ===================== */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth_full_name')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <HiOutlineUser className="absolute left-3 text-slate-400 text-base pointer-events-none" />
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder={t('auth_full_name_placeholder')}
                  className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-med-500 focus:outline-none focus:ring-1 focus:ring-med-500 dark:border-white/10 dark:bg-[#1a2234] dark:text-white"
                  autoFocus
                />
              </div>
            </div>

            {/* Username (@username) - MANDATORY */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth_username')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 font-bold text-xs select-none pointer-events-none">
                  @
                </span>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                  placeholder={t('auth_username_placeholder')}
                  className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-med-500 focus:outline-none focus:ring-1 focus:ring-med-500 dark:border-white/10 dark:bg-[#1a2234] dark:text-white"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Do‘stlar sizni mana shu @username orqali topishadi.
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth_phone')} <span className="text-rose-500">*</span>
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
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="90 123 45 67"
                  className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-20 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-med-500 focus:outline-none focus:ring-1 focus:ring-med-500 dark:border-white/10 dark:bg-[#1a2234] dark:text-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth_password')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <HiOutlineLockClosed className="absolute left-3 text-slate-400 text-base pointer-events-none" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder={t('auth_password_placeholder')}
                  className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-med-500 focus:outline-none focus:ring-1 focus:ring-med-500 dark:border-white/10 dark:bg-[#1a2234] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                >
                  {showRegPassword ? <HiOutlineEyeOff className="text-base" /> : <HiOutlineEye className="text-base" />}
                </button>
              </div>
            </div>

            {/* Submit Register Button */}
            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-med-600 to-med-500 py-2.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-med-500/25 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
              data-testid="button-register-submit"
            >
              <span>{t('auth_register_btn')}</span>
            </button>
          </form>
        )}

        {/* ===================== GOOGLE SIGN-IN UNDER THE FORM ===================== */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-white/10" />
          </div>
          <span className="relative bg-white dark:bg-[#111827] px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t('auth_or_divider')}
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-2.5 rounded-[10px] border border-slate-200 bg-white py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-[0.99] transition-all dark:border-white/10 dark:bg-[#1a2234] dark:text-white dark:hover:bg-[#20293d] cursor-pointer"
          data-testid="button-google-login"
        >
          <GoogleIcon />
          <span>{isGoogleLoading ? 'Kirilmoqda...' : t('auth_google_continue')}</span>
        </button>
      </div>
    </div>
  );
}
