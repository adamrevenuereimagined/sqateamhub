import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
};

type ToastContextValue = {
  show: (kind: ToastKind, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<ToastKind, { icon: typeof CheckCircle2; bar: string; iconColor: string }> = {
  success: { icon: CheckCircle2, bar: 'bg-accent-500', iconColor: 'text-accent-600' },
  error: { icon: AlertCircle, bar: 'bg-red-500', iconColor: 'text-red-600' },
  info: { icon: Info, bar: 'bg-brand-500', iconColor: 'text-brand-600' },
  warning: { icon: AlertTriangle, bar: 'bg-amber-500', iconColor: 'text-amber-600' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, kind, title, description }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    show,
    success: (t, d) => show('success', t, d),
    error: (t, d) => show('error', t, d),
    info: (t, d) => show('info', t, d),
    warning: (t, d) => show('warning', t, d),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none w-[min(380px,calc(100vw-2rem))]"
      >
        {toasts.map((t) => {
          const s = styles[t.kind];
          const Icon = s.icon;
          return (
            <div
              key={t.id}
              className="pointer-events-auto bg-white rounded-xl shadow-card-hover border border-slate-200 overflow-hidden animate-slide-in-right"
            >
              <div className="flex items-start gap-3 p-4">
                <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${s.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                  {t.description && (
                    <p className="text-sm text-slate-600 mt-0.5">{t.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className={`h-1 ${s.bar}`} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
