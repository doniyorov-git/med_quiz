import { useEffect, useId, useRef } from 'react';
import { Btn } from '@/components/chrome';

const STEPS = [5, 10, 15, 20, 30];

export function countPresets(max: number): number[] {
  const limit = Math.max(1, Math.floor(max));
  const steps = STEPS.filter((step) => step <= limit);
  if (limit > 1 && !steps.includes(limit) && limit <= 40 && steps.length < 5) steps.push(limit);
  return steps;
}

export function CountPicker({
  value,
  max,
  onChange,
  testId,
  className = '',
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  testId?: string;
  className?: string;
}) {
  const labelId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const limit = Math.max(1, Math.floor(max));
  const current = Math.min(Math.max(1, Math.round(value) || 1), limit);
  const presets = countPresets(limit);
  const fill = limit <= 1 ? 100 : ((current - 1) / (limit - 1)) * 100;

  useEffect(() => {
    if (current !== value) onChange(current);
  }, [current, onChange, value]);

  const choose = (next: number) => onChange(Math.min(limit, Math.max(1, next)));

  const setFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || limit <= 1 || rect.width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    choose(Math.round(1 + ratio * (limit - 1)));
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <p id={labelId} className="text-xs font-semibold text-muted-foreground">Savollar soni</p>
        <span className="min-w-11 rounded-[10px] border border-med-400/30 bg-med-500/15 px-2.5 py-1 text-center font-display text-sm font-semibold tabular-nums text-med-400" data-testid={testId ? `${testId}-value` : undefined}>
          {current}
        </span>
      </div>
      <div
        className="relative mt-3 flex h-11 touch-none items-center px-[11px]"
        onPointerDown={(event) => {
          if (limit <= 1) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setFromClientX(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          setFromClientX(event.clientX);
        }}
      >
        <div ref={trackRef} className="relative h-2 w-full rounded-[10px] bg-slate-200 dark:bg-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
          <div
            className="absolute inset-y-0 left-0 rounded-[10px] bg-med-500"
            style={{ width: `${fill}%` }}
          />
          <div
            role="slider"
            tabIndex={limit <= 1 ? -1 : 0}
            aria-labelledby={labelId}
            aria-valuemin={1}
            aria-valuemax={limit}
            aria-valuenow={current}
            aria-disabled={limit <= 1}
            data-testid={testId}
            className="absolute top-1/2 size-[20px] -translate-x-1/2 -translate-y-1/2 rounded-[6px] border-2 border-white bg-med-600 shadow-md outline-none focus-visible:ring-2 focus-visible:ring-med-400"
            style={{ left: `${fill}%` }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                event.preventDefault();
                choose(current + 1);
              } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                event.preventDefault();
                choose(current - 1);
              } else if (event.key === 'Home') {
                event.preventDefault();
                choose(1);
              } else if (event.key === 'End') {
                event.preventDefault();
                choose(limit);
              }
            }}
          />
        </div>
      </div>
      {presets.length > 1 && (
        <div
          className="mt-3 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(presets.length, 5)}, minmax(0, 1fr))` }}
        >
          {presets.map((preset) => (
            <Btn
              key={preset}
              type="button"
              kind={current === preset ? 'primary' : 'line'}
              className="w-full !px-1 !py-2.5 text-sm"
              aria-pressed={current === preset}
              onClick={() => choose(preset)}
            >
              {preset}
            </Btn>
          ))}
        </div>
      )}
    </div>
  );
}
