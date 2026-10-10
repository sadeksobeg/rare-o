import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getStatusLabel } from "@/lib/ui/status-labels";
import { getStatusSequence } from "@/lib/ui/status";

type StepperDomain = "retail" | "deal" | "wholesale";

/**
 * Thin, read-only progress strip for retail / deal / wholesale status sequences.
 * Presentational only: it never changes status and encodes no business rules.
 * Statuses outside the happy path (cancelled / closed) render as a trailing
 * "ended" step with the sequence left un-highlighted.
 */
export function StatusStepper({
  domain,
  current,
  dict,
  className,
}: {
  domain: StepperDomain;
  current: string;
  dict: Dictionary;
  className?: string;
}) {
  const sequence = getStatusSequence(domain);
  const d = dict.adminUi.detail;
  const index = sequence.indexOf(current);
  const offPath = index === -1;

  type Step = {
    value: string;
    state: "done" | "current" | "upcoming" | "ended";
  };
  const steps: Step[] = sequence.map((value, i) => ({
    value,
    state: offPath
      ? "upcoming"
      : i < index
        ? "done"
        : i === index
          ? "current"
          : "upcoming",
  }));
  if (offPath) steps.push({ value: current, state: "ended" });

  const stateText: Record<Step["state"], string> = {
    done: d.stepDone,
    current: d.stepCurrent,
    upcoming: d.stepUpcoming,
    ended: d.stepEnded,
  };

  return (
    <ol
      aria-label={d.stepperLabel}
      className={cn("flex flex-wrap items-center gap-x-2 gap-y-2", className)}
    >
      {steps.map((step, i) => (
        <li
          key={`${step.value}-${i}`}
          aria-current={step.state === "current" ? "step" : undefined}
          className="flex items-center gap-2"
        >
          {i > 0 ? (
            <span
              aria-hidden
              className={cn(
                "h-px w-4 sm:w-6",
                step.state === "upcoming" || step.state === "ended"
                  ? "bg-ro-line"
                  : "bg-[var(--ro-plum-900)]"
              )}
            />
          ) : null}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--ro-r-sm)] px-2 py-1 text-xs",
              step.state === "current" &&
                "bg-[var(--ro-plum-900)] font-semibold text-ro-canvas",
              step.state === "done" &&
                "bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]",
              step.state === "upcoming" &&
                "border border-ro-line text-ro-muted",
              step.state === "ended" &&
                "bg-[#E6E0EA] font-semibold text-[var(--ro-ink-500)]"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                step.state === "current" && "bg-ro-canvas",
                step.state === "done" && "bg-[var(--ro-plum-900)]",
                step.state === "upcoming" && "bg-[var(--ro-ink-300)]",
                step.state === "ended" && "bg-[var(--ro-ink-500)]"
              )}
            />
            {getStatusLabel(dict, domain, step.value)}
            <span className="sr-only">: {stateText[step.state]}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
