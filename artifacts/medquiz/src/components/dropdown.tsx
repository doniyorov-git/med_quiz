import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HiOutlineChevronDown, HiOutlineCheck } from 'react-icons/hi';

export type DropdownOption<T extends string | number> = {
  value: T;
  label: string;
  subLabel?: string;
  icon?: ReactNode;
};

export function Dropdown<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Tanlang...',
  className = '',
  disabled = false,
  testId,
}: {
  label?: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((item) => item.value === value);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    if (open) {
      document.addEventListener('mousedown', onDocClick);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="input-label mb-1.5">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        data-testid={testId}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-3 rounded-[10px] border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm transition-all focus:outline-none focus:ring-2 focus:ring-med-500/20 dark:border-white/10 dark:bg-[#1f2937] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-300 dark:hover:border-white/20'
        } ${open ? 'ring-2 ring-med-500/20 border-med-500/50' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selected?.icon && <span className="shrink-0 text-med-600 dark:text-med-400">{selected.icon}</span>}
          <span className={`truncate ${selected ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
            {selected ? selected.label : placeholder}
          </span>
          {selected?.subLabel && (
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto shrink-0 hidden sm:inline">
              {selected.subLabel}
            </span>
          )}
        </div>
        <HiOutlineChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-med-500' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-[10px] border border-slate-200 bg-white p-1 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#111827] animate-in fade-in zoom-in-95 duration-100"
        >
          {options.length === 0 && (
            <div className="p-3 text-center text-xs text-slate-500">Variantlar yo‘q</div>
          )}
          {options.map((item) => {
            const isSelected = item.value === value;
            return (
              <button
                key={String(item.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2.5 rounded-[8px] px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-med-500/15 font-semibold text-med-700 dark:text-med-300'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.subLabel && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {item.subLabel}
                    </span>
                  )}
                  {isSelected && <HiOutlineCheck className="h-4 w-4 text-med-600 dark:text-med-400" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
