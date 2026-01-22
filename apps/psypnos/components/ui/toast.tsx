// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const addToast = useCallback(
    ({ duration = 4000, ...toast }: Omit<Toast, "id">) => {
      setToasts((current) => {
        const id = Date.now() + Math.round(Math.random() * 1000);
        timers.current[id] = setTimeout(() => removeToast(id), duration);
        return [...current, { ...toast, id }];
      });
    },
    [removeToast]
  );

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => {
          const variantClasses =
            toast.variant === "success"
              ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-100"
              : toast.variant === "error"
                ? "border-rose-400/70 bg-rose-500/10 text-rose-100"
                : "border-gold/60 bg-night/80 text-ivory";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto w-80 rounded-lg border px-4 py-3 shadow-lg backdrop-blur transition hover:scale-[1.01] ${variantClasses}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-1 text-sm text-ivory/80">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-sm text-ivory/60 transition hover:text-ivory"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
