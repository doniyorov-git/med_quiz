import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Changing this clears a caught error. Pass the route to recover on navigation. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  const handleClearAndReload = () => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.clear();
        // remove session / presence keys
        const toRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && (k.startsWith('medquiz-v2-p-') || k === 'medquiz-v2-me')) {
            toRemove.push(k);
          }
        }
        toRemove.forEach((k) => window.localStorage.removeItem(k));
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19] p-6 text-slate-800 dark:text-slate-100">
      <div className="max-w-md w-full text-center glass-card p-8 border border-slate-200/80 dark:border-white/10 shadow-xl rounded-2xl">
        <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl font-bold mb-4">
          !
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Xatolik yuz berdi
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Ilovani qayta yuklash orqali davom etishingiz mumkin.
        </p>
        <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-left text-xs text-slate-600 dark:text-slate-300 font-mono break-all max-h-32 overflow-y-auto">
          {error.message || String(error)}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={resetError}
            className="flex-1 rounded-xl bg-med-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-med-500 transition-all shadow-md shadow-med-500/20 active:scale-95"
          >
            Qayta urinish
          </button>
          <button
            type="button"
            onClick={handleClearAndReload}
            className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a2234] px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
          >
            Qayta yuklash
          </button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an error:',
      toError(error),
      info.componentStack,
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
