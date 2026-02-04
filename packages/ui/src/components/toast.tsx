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

import { cn } from "../utils/cn";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-400/70 bg-emerald-500/10 text-emerald-100",
  error: "border-rose-400/70 bg-rose-500/10 text-rose-100",
  warning: "border-amber-400/70 bg-amber-500/10 text-amber-100",
  info: "border-primary/60 bg-secondary/80 text-foreground",
};

export interface ToastProviderProps {
  children: ReactNode;
  /** Position of the toast container */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  /** Custom class names for the container */
  containerClassName?: string;
}

const positionStyles: Record<string, string> = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
};

export function ToastProvider({
  children,
  position = "top-right",
  containerClassName
}: ToastProviderProps) {
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
      <div
        className={cn(
          "pointer-events-none fixed z-50 space-y-3",
          positionStyles[position],
          containerClassName
        )}
      >
        {toasts.map((toast) => {
          const variant = toast.variant || "info";

          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto w-80 rounded-lg border px-4 py-3 shadow-lg backdrop-blur transition hover:scale-[1.01]",
                variantStyles[variant]
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-1 text-sm opacity-80">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-sm opacity-60 transition hover:opacity-100"
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
