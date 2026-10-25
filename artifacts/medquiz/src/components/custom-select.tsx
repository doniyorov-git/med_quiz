import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HiOutlineChevronDown, HiOutlineCheck, HiOutlineSearch } from 'react-icons/hi';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  icon?: ReactNode;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export function CustomSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Tanlang...',
  searchPlaceholder = 'Qidirish...',
  className = '',
  disabled = false,
  required = false,
  error,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((item) => item.value === value);

  const filtered = options.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      (item.subLabel && item.subLabel.toLowerCase().includes(q))
    );
  });

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
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }

    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="input-label mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {selected && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Tozalash
            </button>
          )}
        </label>
      )}

      {/* Main Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        className={`flex w-full items-center justify-between gap-2.5 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm transition-all focus:outline-none dark:bg-[#1a2234] ${
          error
            ? 'border-rose-500 ring-2 ring-rose-500/20'
            : open
            ? 'border-med-500 ring-2 ring-med-500/20'
            : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selected?.icon && <span className="shrink-0 text-med-600 dark:text-med-400">{selected.icon}</span>}
          <span
            className={`truncate text-sm ${
              selected ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {selected ? selected.label : placeholder}
          </span>
          {selected?.subLabel && (
            <span className="text-[11px] text-slate-400 ml-auto shrink-0 hidden sm:inline">
              {selected.subLabel}
            </span>
          )}
        </div>
        <HiOutlineChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-med-500' : ''
          }`}
        />
      </div>

      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}

      {/* Custom Div Dropdown Menu */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#111827] animate-in fade-in zoom-in-95 duration-100 flex flex-col">
          {/* Search Box if list is larger than 5 */}
          {options.length > 5 && (
            <div className="p-2 border-b border-slate-100 dark:border-white/10">
              <div className="relative flex items-center">
                <HiOutlineSearch className="absolute left-2.5 text-slate-400 text-sm pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#1a2234] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-med-500"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto max-h-56 p-1 space-y-0.5 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">Hech narsa topilmadi</div>
            ) : (
              filtered.map((item) => {
                const isSelected = item.value === value;
                return (
                  <div
                    key={item.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-med-50 text-med-700 font-semibold dark:bg-med-500/20 dark:text-med-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {item.icon && <span className="shrink-0 text-slate-400">{item.icon}</span>}
                      <span className="truncate">{item.label}</span>
                      {item.subLabel && (
                        <span className="text-[10px] text-slate-400 ml-auto shrink-0 hidden sm:inline">
                          {item.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <HiOutlineCheck className="h-4 w-4 shrink-0 text-med-600 dark:text-med-400" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
