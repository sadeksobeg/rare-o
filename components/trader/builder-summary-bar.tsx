"use client";

import { Button } from "@/components/ui/button";
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
        "sticky bottom-20 z-30 -mx-4 border-t border-ro-line bg-ro-paper/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-ro-paper/90 sm:mx-0 md:bottom-0",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className
      )}
    >
      <div className="mx-auto flex max-w-[45rem] items-center justify-end gap-4">
        <p className="text-sm font-medium text-ro-ink">{countLabel}</p>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onReview}
          disabled={disabled}
        >
          {reviewLabel}
        </Button>
      </div>
    </div>
  );
}
