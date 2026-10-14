"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** P11 — max 3; 5 s auto-dismiss; errors persist with dismiss. */

export type ToastTone = "success" | "info" | "error";

export type ToastInput = {
  message: string;
  tone?: ToastTone;
  actionLabel?: string;
  actionHref?: string;
  /** Milliseconds before auto-dismiss. Errors ignore this (persist). */
  duration?: number;
};

type ToastItem = ToastInput & { id: number };

type ToastContextValue = {
  toast: (input: ToastInput) => number;
  dismiss: (id: number) => void;
};

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 3;

const noopContext: ToastContextValue = {
  toast: () => -1,
  dismiss: () => {},
};

const ToastContext = createContext<ToastContextValue>(noopContext);

function ToastCard({
  item,
  dismissLabel,
  onDismiss,
}: {
  item: ToastItem;
  dismissLabel: string;
  onDismiss: (id: number) => void;
}) {
  const [paused, setPaused] = useState(false);
  const isError = item.tone === "error";
  const duration = item.duration ?? DEFAULT_DURATION;

  useEffect(() => {
    if (isError || paused) return;
    const timer = window.setTimeout(() => onDismiss(item.id), duration);
    return () => window.clearTimeout(timer);
  }, [paused, duration, item.id, onDismiss, isError]);

  return (
    <div
      role={isError ? "alert" : undefined}
      className={cn(
        "pointer-events-auto flex w-full max-w-none items-center gap-3 rounded-[var(--ro-r-sm)] border px-4 py-3 text-sm shadow-[var(--ro-e2)] md:max-w-sm",
        item.tone === "info" && "border-ro-border bg-ro-canvas text-ro-ink",
        item.tone === "error" &&
          "border-[var(--ro-danger-700)] bg-[var(--ro-danger-100)] text-[var(--ro-danger-700)]",
        (!item.tone || item.tone === "success") &&
          "border-ro-ink bg-ro-ink text-ro-canvas"
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <p className="min-w-0 flex-1">{item.message}</p>
      {item.actionLabel && item.actionHref ? (
        <Link
          href={item.actionHref}
          className="shrink-0 font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          onClick={() => onDismiss(item.id)}
        >
          {item.actionLabel}
        </Link>
      ) : null}
      <button
        type="button"
        aria-label={dismissLabel}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--ro-r-full)] opacity-80 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        onClick={() => onDismiss(item.id)}
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function ToastProvider({
  children,
  dismissLabel,
}: {
  children: React.ReactNode;
  dismissLabel: string;
}) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = nextId.current++;
    setItems((prev) => [...prev, { ...input, id }].slice(-MAX_VISIBLE));
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[90] flex flex-col items-stretch gap-2 px-4 md:inset-x-auto md:inset-inline-end-6 md:bottom-6 md:items-end"
      >
        {items.map((item) => (
          <ToastCard
            key={item.id}
            item={item}
            dismissLabel={dismissLabel}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
