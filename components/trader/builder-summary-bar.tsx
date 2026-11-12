"use client";

import { cn } from "@/lib/utils";

/** T06 — sticky bottom bar: selection count + review CTA. */
export function BuilderSummaryBar({
  countLabel,
  reviewLabel,
  onReview,
  disabled,
  className,
}: {
  countLabel: string;
  reviewLabel: string;
  onReview: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rad-above-tab sticky z-30 -mx-4 border-t border-[color:var(--rad-bd)] bg-[color-mix(in_srgb,var(--rad-surface)_95%,transparent)] px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--rad-surface)_90%,transparent)] sm:mx-0",
        className
      )}
    >
      <div className="flex w-full items-center justify-between gap-4">
        <p className="min-w-0 flex-1 text-sm font-medium text-[color:var(--rad-tx)]">
          {countLabel}
        </p>
        <button
          type="button"
          className="rad-btn rad-pri shrink-0"
          onClick={onReview}
          disabled={disabled}
        >
          {reviewLabel}
        </button>
      </div>
    </div>
  );
}
