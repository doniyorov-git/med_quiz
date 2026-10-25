import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';
import { useStore } from '@/lib/store';

export function ThemeToggle({ className = '' }: { className?: string; showLabel?: boolean }) {
  const { theme, setTheme } = useStore();
  const isDark = theme === 'dark';

  return (
    <div
      role="group"
      aria-label="Dizayn rejimi"
      data-testid="theme-toggle-container"
      className={`inline-flex items-center gap-1 rounded-[10px] border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-[#1f2937] ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={!isDark}
        data-testid="theme-btn-light"
        className={`flex items-center gap-2 rounded-[8px] px-3.5 py-1.5 text-xs font-semibold transition-all ${
          !isDark
            ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <HiOutlineSun className={`h-4 w-4 ${!isDark ? 'text-amber-500' : ''}`} />
        <span>Kunduzgi</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={isDark}
        data-testid="theme-btn-dark"
        className={`flex items-center gap-2 rounded-[8px] px-3.5 py-1.5 text-xs font-semibold transition-all ${
          isDark
            ? 'bg-[#111827] text-white shadow-xs border border-white/10'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <HiOutlineMoon className={`h-4 w-4 ${isDark ? 'text-med-400' : ''}`} />
        <span>Tungi</span>
      </button>
    </div>
  );
}

export function ThemeSwitch({ className = '', showLabel = true }: { className?: string; showLabel?: boolean }) {
  const { theme, setTheme } = useStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`group flex items-center justify-between w-full px-3 py-2 rounded-[10px] text-xs font-semibold transition-all hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer select-none border border-slate-200/60 dark:border-white/5 ${className}`}
    >
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
        <span className={`flex h-6 w-6 items-center justify-center rounded-[6px] transition-colors ${isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-amber-500/15 text-amber-600'}`}>
          <i className={`${isDark ? 'ri-moon-clear-line' : 'ri-sun-line'} text-sm leading-none`} />
        </span>
        {showLabel && (
          <span className="text-xs font-semibold">{isDark ? 'Tungi rejim' : 'Kunduzgi rejim'}</span>
        )}
      </div>

      <div className={`relative h-5 w-10 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${isDark ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
        <div
          className={`h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
            isDark ? 'translate-x-5 text-emerald-700' : 'translate-x-0 text-amber-500'
          }`}
        >
          <i className={`${isDark ? 'ri-moon-fill' : 'ri-sun-fill'} text-[9px] leading-none`} />
        </div>
      </div>
    </button>
  );
}

