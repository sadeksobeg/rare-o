import {
  brokeragePhaseLabel,
  brokerageStatusLabel,
  getBrokerageStatusMeta,
  type BrokeragePhase,
} from "@/components/brokerage/labels";
import { BROKERAGE_LIFECYCLE, type BrokerageStatus } from "@/lib/brokerage/status";
import { cn } from "@/lib/utils";

/** Happy path including terminal success close */
const RAIL: BrokerageStatus[] = [...BROKERAGE_LIFECYCLE, "CLOSED"];

const PHASE_GROUPS: { phase: BrokeragePhase; statuses: BrokerageStatus[] }[] = [
  { phase: "payment", statuses: ["AWAITING_PAYMENT", "PAYMENT_CONFIRMED"] },
  {
    phase: "inspection",
    statuses: ["ACCEPTED", "INSPECTION_SCHEDULED", "INSPECTED"],
  },
  {
    phase: "fulfillment",
    statuses: ["PURCHASED", "SHIPPED", "DELIVERED"],
  },
  { phase: "closed", statuses: ["CLOSED"] },
];

function railIndex(status: string): number {
  if (status === "NEEDS_INFO" || status === "SUBMITTED") {
    return RAIL.indexOf("AWAITING_PAYMENT");
  }
  if (status === "DECLINED" || status === "CANCELLED") return -1;
  if (status === "REJECTED" || status === "QUOTE_SENT" || status === "APPROVED") {
    return RAIL.indexOf("INSPECTED");
  }
  return RAIL.indexOf(status as BrokerageStatus);
}

export function BrokerageLifecycleRail({
  status,
  locale,
  className,
}: {
  status: string;
  locale: string;
  className?: string;
}) {
  const ar = locale === "ar";
  const meta = getBrokerageStatusMeta(status);
  const stepIdx = railIndex(status);
  const side =
    meta.side === true ||
    status === "NEEDS_INFO" ||
    status === "DECLINED" ||
    status === "REJECTED" ||
    status === "CANCELLED";
  const terminalDone = status === "CLOSED";

  return (
    <div className={cn("space-y-4", className)}>
      {side ? (
        <div
          className={cn(
            "rounded-[var(--ro-r-md)] border px-3 py-2.5 text-sm",
            status === "NEEDS_INFO"
              ? "border-[color-mix(in_srgb,var(--ro-amber-500)_45%,transparent)] bg-[color-mix(in_srgb,var(--ro-amber-100)_45%,transparent)] text-[var(--ro-amber-800)]"
              : "border-[color-mix(in_srgb,var(--ro-danger-700)_30%,transparent)] bg-[color-mix(in_srgb,var(--ro-danger-100)_55%,transparent)] text-[var(--ro-danger-700)]"
          )}
        >
          <span className="font-semibold">
            {status === "NEEDS_INFO"
              ? ar
                ? "خارج المسار الرئيسي — "
                : "Off main path — "
              : ar
                ? "منتهٍ — "
                : "Ended — "}
          </span>
          {brokerageStatusLabel(status, locale)}
          {status === "REJECTED" ? (
            <span className="ms-1 text-[0.8em] opacity-90">
              {ar
                ? "(توقف عند مرحلة العرض)"
                : "(stopped at quote stage)"}
            </span>
          ) : null}
        </div>
      ) : null}

      {terminalDone ? (
        <div className="rounded-[var(--ro-r-md)] border border-[color-mix(in_srgb,var(--ro-success-700)_30%,transparent)] bg-[color-mix(in_srgb,var(--ro-success-100)_60%,transparent)] px-3 py-2.5 text-sm text-[var(--ro-success-700)]">
          <span className="font-semibold">
            {ar ? "مكتمل — " : "Complete — "}
          </span>
          {brokerageStatusLabel(status, locale)}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {PHASE_GROUPS.map((g) => {
          const active = meta.phase === g.phase && !side;
          const groupDone =
            stepIdx >= 0 &&
            g.statuses.every((s) => {
              const i = RAIL.indexOf(s);
              return i >= 0 && i < stepIdx;
            });
          return (
            <span
              key={g.phase}
              className={cn(
                "rounded-full px-2.5 py-1 text-[0.65rem] font-medium",
                active
                  ? "bg-[var(--ro-plum-900)] text-[var(--ro-sand-100)]"
                  : groupDone
                    ? "bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]"
                    : "bg-[var(--ro-sand-200)] text-[var(--ro-ink-500)]"
              )}
            >
              {brokeragePhaseLabel(g.phase, locale)}
            </span>
          );
        })}
      </div>

      <ol className="relative flex items-start gap-0 overflow-x-auto pb-1">
        {RAIL.map((s, i) => {
          const done = stepIdx >= 0 && i <= stepIdx && !side;
          const current =
            (!side && stepIdx === i) ||
            (status === "REJECTED" && s === "QUOTE_SENT") ||
            (status === "NEEDS_INFO" && s === "SUBMITTED");
          const upcoming = stepIdx >= 0 && i === stepIdx + 1 && !side;
          return (
            <li
              key={s}
              className="relative flex min-w-[4.25rem] flex-1 flex-col items-center gap-2 px-0.5"
            >
              {i < RAIL.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[0.55rem] start-1/2 h-px w-full",
                    done && i < stepIdx && !side
                      ? "bg-[var(--ro-plum-700)]"
                      : "bg-[var(--ro-border-subtle)]"
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-[1] grid size-5 place-items-center rounded-full border text-[0.55rem] font-semibold tabular-nums",
                  current
                    ? "border-[var(--ro-plum-700)] bg-[var(--ro-plum-900)] text-[var(--ro-sand-100)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--ro-plum-300)_45%,transparent)]"
                    : upcoming
                      ? "border-[var(--ro-amber-500)] bg-[var(--ro-amber-100)] text-[var(--ro-amber-800)]"
                      : done
                        ? "border-[var(--ro-plum-700)] bg-[var(--ro-plum-300)] text-[var(--ro-plum-900)]"
                        : "border-[var(--ro-border)] bg-[var(--ro-sand-100)] text-[var(--ro-ink-500)]"
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "max-w-[5.25rem] text-center text-[0.62rem] leading-tight",
                  current
                    ? "font-semibold text-ro-ink"
                    : upcoming
                      ? "font-medium text-[var(--ro-amber-800)]"
                      : done
                        ? "text-[var(--ro-ink-700)]"
                        : "text-[var(--ro-ink-500)]"
                )}
              >
                {brokerageStatusLabel(s, locale)}
                {upcoming ? (
                  <span className="mt-0.5 block text-[0.55rem] font-normal opacity-80">
                    {ar ? "التالي" : "Next"}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
