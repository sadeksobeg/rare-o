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
      <div className="mx-auto flex max-w-[45rem] items-center justify-end gap-4">
        <p className="text-sm font-medium text-[color:var(--rad-tx)]">
          {countLabel}
        </p>
        <button
          type="button"
          className="rad-btn rad-pri"
          onClick={onReview}
          disabled={disabled}
        >
          {reviewLabel}
        </button>
      </div>
    </div>
  );
}
