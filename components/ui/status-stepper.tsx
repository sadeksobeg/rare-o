import { Check, Circle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getStatusLabel } from "@/lib/ui/status-labels";
import { getStatusSequence } from "@/lib/ui/status";

type StepperDomain = "retail" | "deal" | "wholesale";

type StepState = "done" | "current" | "upcoming" | "blocked";

/**
 * P18 — horizontal desktop / vertical mobile.
 * States: done / current / upcoming / blocked (off-path terminal).
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

  type Step = { value: string; state: StepState };
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
  if (offPath) steps.push({ value: current, state: "blocked" });

  const stateText: Record<StepState, string> = {
    done: d.stepDone,
    current: d.stepCurrent,
    upcoming: d.stepUpcoming,
    blocked: d.stepEnded,
  };

  return (
    <ol
      aria-label={d.stepperLabel}
      className={cn(
        "flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-x-2 md:gap-y-2",
        className
      )}
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
                "hidden h-px w-4 sm:w-6 md:block",
                step.state === "upcoming" || step.state === "blocked"
                  ? "bg-ro-line"
                  : "bg-[var(--ro-plum-900)]"
              )}
            />
          ) : null}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--ro-r-sm)] px-2.5 py-1.5 text-xs font-semibold transition-transform duration-[var(--ro-dur-fast)]",
              step.state === "current" &&
                "bg-[var(--ro-plum-900)] font-bold text-ro-canvas shadow-[0_8px_20px_-12px_color-mix(in_srgb,var(--ro-plum-900)_70%,transparent)]",
              step.state === "done" &&
                "bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]",
              step.state === "upcoming" &&
                "border border-ro-line text-ro-muted",
              step.state === "blocked" &&
                "bg-[#E6E0EA] font-bold text-[var(--ro-ink-500)]"
            )}
          >
            {step.state === "done" ? (
              <Check className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
            ) : step.state === "blocked" ? (
              <Ban className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
            ) : (
              <Circle
                className={cn(
                  "size-3.5 shrink-0",
                  step.state === "current" && "fill-current"
                )}
                strokeWidth={2}
                aria-hidden
              />
            )}
            {getStatusLabel(dict, domain, step.value)}
            <span className="sr-only">: {stateText[step.state]}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Alias matching Part 02 P18 naming. */
export const Stepper = StatusStepper;
