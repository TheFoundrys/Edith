"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone?: "neutral" | "success" | "danger";
};

type ToastContextValue = {
  toast: (input: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((input: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { ...input, id }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-[var(--radius)] border bg-bg-elevated px-4 py-3 shadow-[var(--shadow)]",
              item.tone === "danger" ? "border-fg" : "border-border-strong",
            )}
            role="status"
          >
            <p className="text-sm font-medium text-fg">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 text-xs text-fg-muted">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
