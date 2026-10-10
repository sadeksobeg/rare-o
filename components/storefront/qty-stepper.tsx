"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact +/- quantity control. Never removes — removal is a separate action. */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  increaseLabel,
  decreaseLabel,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  /** Accessible name for the whole group / the numeric input. */
  label: string;
  increaseLabel: string;
  decreaseLabel: string;
  className?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, Math.trunc(n)));
  const btn =
    "flex size-11 items-center justify-center text-ro-ink transition-colors hover:bg-ro-sunken focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ro-focus)] disabled:pointer-events-none disabled:opacity-40";

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper",
        className
      )}
      dir="ltr"
    >
      <button
        type="button"
        className={btn}
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/\D/g, ""));
          if (Number.isFinite(n) && n > 0) onChange(clamp(n));
        }}
        className="h-11 w-12 border-x border-[var(--ro-border-control)] bg-transparent text-center text-sm tabular-nums outline-none focus-visible:bg-ro-sunken"
      />
      <button
        type="button"
        className={btn}
        aria-label={increaseLabel}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
