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

/** P11 — transient, non-blocking notifications announced via an ARIA live region. */

export type ToastTone = "success" | "info";

export type ToastInput = {
  message: string;
  tone?: ToastTone;
  /** Optional inline link (e.g. "View request list"). */
  actionLabel?: string;
  actionHref?: string;
  /** Milliseconds before auto-dismiss. Defaults to 5000. */
  duration?: number;
};

type ToastItem = ToastInput & { id: number };

type ToastContextValue = {
  toast: (input: ToastInput) => number;
  dismiss: (id: number) => void;
};

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 3;

/** Safe fallback so components outside a provider (admin/trader shells) never throw. */
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
  const duration = item.duration ?? DEFAULT_DURATION;

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => onDismiss(item.id), duration);
    return () => window.clearTimeout(timer);
  }, [paused, duration, item.id, onDismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[var(--ro-r-sm)] border px-4 py-3 text-sm shadow-[var(--ro-e2)]",
        item.tone === "info"
          ? "border-ro-border bg-ro-canvas text-ro-ink"
          : "border-ro-ink bg-ro-ink text-ro-canvas"
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
  /** Localized accessible name for the dismiss button. */
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
      {/* Live region stays mounted so screen readers pick up inserted toasts. */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6"
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
