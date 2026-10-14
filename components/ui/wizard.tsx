"use client";

import { cn } from "@/lib/utils";

export type WizardStep = {
  id: string;
  title: string;
};

/** T04 — step header, progress, back/next chrome. Step bodies are children. */
export function Wizard({
  steps,
  current,
  stepOfLabel,
  backLabel,
  nextLabel,
  onBack,
  onNext,
  nextDisabled,
  hideNext,
  footer,
  children,
  className,
}: {
  steps: readonly WizardStep[];
  current: number;
  /** e.g. "1 of 3" / "1 من 3" */
  stepOfLabel: string;
  backLabel: string;
  nextLabel: string;
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  hideNext?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const total = steps.length;
  const idx = Math.min(Math.max(current, 0), total - 1);
  const progress = ((idx + 1) / total) * 100;
  const title = steps[idx]?.title ?? "";

  return (
    <div className={cn("mx-auto w-full max-w-[45rem] space-y-4", className)}>
      <header className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-ro-muted">
            {stepOfLabel}
          </p>
          <h2 className="font-display text-lg font-semibold leading-none">
            {title}
          </h2>
        </div>
        <div
          className="h-1 overflow-hidden rounded-full bg-ro-sunken"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={idx + 1}
          aria-label={stepOfLabel}
        >
          <div
            className="h-full bg-[var(--ro-plum-900)] transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="min-h-[12rem]">{children}</div>

      <div className="flex flex-wrap items-center gap-3 border-t border-ro-line pt-4">
        {idx > 0 && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="min-h-11 border border-ro-line px-4 text-sm hover:bg-ro-sunken"
          >
            {backLabel}
          </button>
        ) : (
          <span className="flex-1" />
        )}
        <div className="ms-auto flex flex-wrap items-center gap-3">
          {footer}
          {!hideNext && onNext ? (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="min-h-11 bg-ro-purple px-5 text-sm text-ro-ivory disabled:opacity-60"
            >
              {nextLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
