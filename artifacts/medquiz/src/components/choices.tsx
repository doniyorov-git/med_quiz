import { Icon } from '@/components/chrome';
import type { Question } from '@/lib/types';

export function Choices({
  question,
  picks,
  locked,
  onPick,
}: {
  question: Question;
  picks: number[];
  locked: boolean;
  onPick: (index: number) => void;
}) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const multi = options.filter((option) => option?.correct).length > 1;
  return (
    <div className="mt-2.5 sm:mt-4 space-y-1.5 sm:space-y-2.5" role={multi ? 'group' : 'radiogroup'} aria-label="Javoblar">
      {multi && !locked && (
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
          <Icon name="ri-lightbulb-line" className="text-amber-500 text-xs sm:text-sm" /> Bir nechta to‘g‘ri javob bor.
        </p>
      )}
      {options.map((option, index) => {
        const selected = picks.includes(index);
        const showCorrect = locked && option.correct;
        const showWrong = locked && selected && !option.correct;
        const tone = showCorrect ? 'correct' : showWrong ? 'incorrect' : selected ? 'selected' : '';
        return (
          <button
            key={option.id}
            type="button"
            disabled={locked}
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={selected}
            data-testid={`choice-${index}`}
            onClick={() => onPick(index)}
            className={`answer-option ${tone}`}
          >
            <span className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-[8px] font-display text-xs sm:text-sm font-bold shadow-xs transition-colors ${
              showCorrect
                ? 'bg-green-600 text-white'
                : showWrong
                ? 'bg-rose-600 text-white'
                : selected
                ? 'bg-med-500 text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-[#1f2937] dark:text-slate-300'
            }`}>
              {String.fromCharCode(65 + index)}
            </span>
            <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white leading-snug break-words text-left">{option.text}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Ring({ seconds, total }: { seconds: number; total: number }) {
  const radius = 10;
  const circ = 2 * Math.PI * radius;
  const ratio = total <= 0 ? 1 : Math.max(0, seconds) / total;
  return (
    <div className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200/80 bg-white/90 px-2 py-1 shadow-xs dark:border-white/10 dark:bg-[#111827]">
      <svg width="22" height="22" viewBox="0 0 24 24" className={seconds <= 5 ? 'text-rose-500' : 'text-primary'} aria-label={`${seconds} soniya`}>
        <circle cx="12" cy="12" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
        <circle cx="12" cy="12" r={radius} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - ratio)} transform="rotate(-90 12 12)" />
      </svg>
      <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-none">{seconds}s</span>
    </div>
  );
}
