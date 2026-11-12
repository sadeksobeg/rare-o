"use client";

import { useEffect, useRef } from "react";
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
  const scrollerRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const frame = requestAnimationFrame(() => {
      const cur = root.querySelector<HTMLElement>("[data-rail-current]");
      if (!cur) return;
      const scroller = root.closest(".rad-br-rail-scroll") as HTMLElement | null;
      if (scroller) {
        const curBox = cur.getBoundingClientRect();
        const scBox = scroller.getBoundingClientRect();
        const delta =
          curBox.left +
          curBox.width / 2 -
          (scBox.left + scBox.width / 2);
        scroller.scrollBy({ left: delta, behavior: "smooth" });
      } else {
        cur.scrollIntoView({
          inline: "center",
          block: "nearest",
          behavior: "smooth",
        });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [status]);

  return (
    <div className={cn("space-y-4", className)}>
      {side ? (
        <div
          className="rounded-[14px] border px-3 py-2.5 text-sm"
          style={{
            borderColor: "var(--rad-warn)",
            background: "var(--rad-warns)",
            color: "var(--rad-warn)",
          }}
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
              className="rounded-full px-2.5 py-1 text-[0.65rem] font-medium"
              style={
                active
                  ? {
                      background: "var(--rad-acf)",
                      color: "#fff",
                    }
                  : groupDone
                    ? {
                        background: "var(--rad-acs)",
                        color: "var(--rad-ac)",
                      }
                    : {
                        background: "var(--rad-surface3)",
                        color: "var(--rad-tx2)",
                      }
              }
            >
              {brokeragePhaseLabel(g.phase, locale)}
            </span>
          );
        })}
      </div>

      <div
        className="rad-br-rail-scroll"
        tabIndex={0}
        role="region"
        aria-label={ar ? "مراحل الوساطة" : "Brokerage lifecycle"}
      >
        <ol
          ref={scrollerRef}
          className="relative flex min-w-max items-start gap-0 pb-1"
        >
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
                data-rail-current={current ? "" : undefined}
                className="relative flex min-w-[4.25rem] flex-1 flex-col items-center gap-2 px-0.5"
              >
                {i < RAIL.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute top-[0.55rem] start-1/2 h-px w-full"
                    style={{
                      background:
                        done && i < stepIdx && !side
                          ? "var(--rad-acf)"
                          : "var(--rad-bd2)",
                    }}
                  />
                ) : null}
                <span
                  className="relative z-[1] grid size-5 place-items-center rounded-full border text-[0.55rem] font-semibold tabular-nums"
                  style={
                    current
                      ? {
                          borderColor: "var(--rad-ac)",
                          background: "var(--rad-acf)",
                          color: "#fff",
                          boxShadow: "0 0 0 4px var(--rad-acs)",
                        }
                      : upcoming
                        ? {
                            borderColor: "var(--rad-warn)",
                            background: "var(--rad-warns)",
                            color: "var(--rad-warn)",
                          }
                        : done
                          ? {
                              borderColor: "var(--rad-acf)",
                              background: "var(--rad-acs)",
                              color: "var(--rad-ac)",
                            }
                          : {
                              borderColor: "var(--rad-bd2)",
                              background: "var(--rad-surface)",
                              color: "var(--rad-tx2)",
                            }
                  }
                >
                  {i + 1}
                </span>
                <span
                  className="max-w-[5.25rem] text-center text-[0.62rem] leading-tight"
                  style={{
                    color: current
                      ? "var(--rad-tx)"
                      : upcoming
                        ? "var(--rad-warn)"
                        : done
                          ? "var(--rad-tx2)"
                          : "var(--rad-tx3)",
                    fontWeight: current || upcoming ? 600 : 500,
                  }}
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
    </div>
  );
}
