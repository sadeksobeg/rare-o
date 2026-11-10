import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { DetailStep, DetailStepState } from "@/components/ui-kit";
import { getStatusSequence } from "@/lib/ui/status";
import { getStatusLabel } from "@/lib/ui/status-labels";

/** Build detail-pattern stepper steps for a lifecycle domain. */
export function buildDetailSteps(
  domain: "retail" | "deal" | "wholesale",
  current: string,
  dict: Dictionary
): DetailStep[] {
  const sequence = getStatusSequence(domain);
  const index = sequence.indexOf(current);
  const offPath = index === -1;

  const steps: DetailStep[] = sequence.map((value, i) => {
    let state: DetailStepState = "upcoming";
    if (!offPath) {
      if (i < index) state = "done";
      else if (i === index) state = "current";
    }
    return {
      value,
      label: getStatusLabel(dict, domain, value),
      state,
    };
  });

  if (offPath) {
    steps.push({
      value: current,
      label: getStatusLabel(dict, domain, current),
      state: "blocked",
    });
  }

  return steps;
}
