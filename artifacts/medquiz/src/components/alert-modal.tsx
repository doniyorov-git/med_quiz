import { useEffect } from 'react';
import { Icon } from '@/components/chrome';

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: React.ReactNode;
  badge?: string;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  badge,
  icon,
  iconColor,
  iconBg,
  variant = 'info',
  confirmText,
  cancelText,
}: AlertModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Default color themes based on variant
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const isSuccess = variant === 'success';

  const defaultIcon = icon || (isDanger ? 'ri-delete-bin-line' : isWarning ? 'ri-error-warning-line' : isSuccess ? 'ri-checkbox-circle-line' : 'ri-information-line');
  const resolvedIconColor = iconColor || (isDanger ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary');
  const resolvedIconBg = iconBg || (isDanger ? 'bg-rose-500/15 border-rose-500/25' : isWarning ? 'bg-amber-500/15 border-amber-500/25' : isSuccess ? 'bg-emerald-500/15 border-emerald-500/25' : 'bg-primary/15 border-primary/25');

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col w-full max-w-sm sm:max-w-md rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] shadow-2xl text-slate-900 dark:text-white overflow-hidden p-6 text-center animate-in zoom-in-95 duration-150">
        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition-colors"
          title="Yopish"
        >
          <Icon name="ri-close-line" className="text-lg" />
        </button>

        {/* Top Centered Icon */}
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${resolvedIconBg} ${resolvedIconColor} mb-4 shadow-xs`}>
          <Icon name={defaultIcon} className="text-2xl sm:text-3xl" />
        </div>

        {/* Optional Badge */}
        {badge && (
          <div className="mb-2">
            <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              {badge}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          {title}
        </h3>

        {/* Description Body */}
        <div className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {description}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          {onConfirm ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                {cancelText || 'Bekor qilish'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 h-10 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition-all active:scale-95 cursor-pointer ${
                  isDanger
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/25'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                }`}
              >
                {confirmText || (isDanger ? 'O‘chirish' : 'Tasdiqlash')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
            >
              {cancelText || 'Tushundim'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
