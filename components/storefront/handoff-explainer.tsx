import { Axis, CanvasMotif } from "@/components/brand";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

export function HandoffExplainer({
  dict,
  compact = false,
  className,
}: {
  dict: Dictionary;
  compact?: boolean;
  className?: string;
}) {
  const steps = [
    dict.home.handoffStep1,
    dict.home.handoffStep2,
    dict.home.handoffStep3,
  ];

  if (compact) {
    return (
      <section
        aria-label={dict.home.handoffTitle}
        className={cn(
          "rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-surface/80 p-4 md:p-5",
          className
        )}
      >
        <h2 className="text-sm font-semibold text-ro-ink">
          {dict.home.handoffTitle}
        </h2>
        <ol className="mt-3 space-y-2.5">
          {steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-full border border-ro-border text-xs font-semibold text-ro-plum"
              >
                {i + 1}
              </span>
              <span className="pt-0.5 text-sm leading-snug text-ro-text-2">
                {step}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs leading-relaxed text-ro-muted">
          {dict.request.handoffHint}
        </p>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden px-5 py-16 md:py-24",
        className
      )}
    >
      <CanvasMotif
        className="opacity-[0.05]"
        patternId="ro-handoff-motif"
      />
      <div className="relative z-[1] mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="ro-type-overline text-ro-plum">
            {dict.home.discoveryEyebrow}
          </p>
          <h2 className="ro-type-h2 mt-3 font-display tracking-wide">
            {dict.home.handoffTitle}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ro-text-2 md:text-base">
            {dict.request.handoffHint}
          </p>
          <div className="mt-6 flex justify-center">
            <Axis height={40} withAmberDot className="opacity-45" />
          </div>
        </div>

        <ol className="mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
          {steps.map((step, i) => (
            <li
              key={step}
              className="relative border border-ro-border bg-[color-mix(in_srgb,var(--ro-sand-50)_88%,transparent)] px-5 py-8 text-center shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ro-sand-50)_80%,transparent)]"
            >
              <span
                aria-hidden
                className="mx-auto mb-5 flex size-11 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--ro-plum-900)_35%,transparent)] bg-ro-canvas font-display text-lg text-ro-plum"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm leading-relaxed text-ro-ink md:text-[0.95rem]">
                {step}
              </p>
              {i < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 -end-3 hidden h-px w-6 -translate-y-1/2 bg-[var(--ro-amber-500)] opacity-50 md:block"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
