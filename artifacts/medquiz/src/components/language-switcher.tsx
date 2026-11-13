import { useState, useRef, useEffect } from 'react';
import { useI18n, LANGUAGES, type Language } from '@/lib/i18n';
import { Icon } from '@/components/chrome';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, changeLanguage, currentLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-[10px] border border-slate-200/80 bg-slate-100/80 hover:bg-slate-200/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
        title="Tilni tanlash / Сменить язык / Change language"
        data-testid="button-language-switcher"
      >
        <span className="text-base leading-none select-none">{currentLanguage.flag}</span>
        <span className="font-bold text-[12px] uppercase tracking-wider">{currentLanguage.code}</span>
        <Icon
          name="ri-arrow-down-s-line"
          className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 rounded-[10px] border border-slate-200/80 bg-white/95 backdrop-blur-md p-1.5 shadow-xl ring-1 ring-black/5 dark:border-white/10 dark:bg-[#111827]/95 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Tilni tanlang
          </div>
          <div className="space-y-0.5 mt-1">
            {LANGUAGES.map((l) => {
              const active = l.id === lang;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    changeLanguage(l.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-med-500/15 text-med-700 dark:text-med-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                  data-testid={`button-lang-${l.id}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base select-none">{l.flag}</span>
                    <span>{l.label}</span>
                  </span>
                  {active && (
                    <Icon name="ri-check-line" className="text-sm text-med-600 dark:text-med-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
