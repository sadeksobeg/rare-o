import { Axis } from "@/components/brand";
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

  return (
    <section
      className={cn(
        "mx-auto max-w-[880px] px-5",
        compact ? "py-8" : "py-16 md:py-24",
        className
      )}
    >
      <h2
        className={cn(
          "text-center font-display tracking-wide",
          compact ? "text-2xl" : "ro-type-h2"
        )}
      >
        {dict.home.handoffTitle}
      </h2>
      <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-4">
        {steps.map((step, i) => (
          <li key={step} className="relative text-center md:px-4">
            <div className="mb-4 flex justify-center">
              <span className="flex size-10 items-center justify-center rounded-full border border-ro-border font-semibold text-ro-plum">
                {i + 1}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <div className="pointer-events-none absolute top-5 start-[60%] hidden w-[80%] justify-center md:flex">
                <Axis height={1} className="h-px w-full bg-ro-border opacity-80" />
              </div>
            ) : null}
            <p className="text-sm leading-relaxed text-ro-text-2">{step}</p>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-center text-sm text-ro-muted">
        {dict.request.handoffHint}
      </p>
    </section>
  );
}
