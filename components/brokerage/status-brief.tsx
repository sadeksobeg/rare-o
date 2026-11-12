import {
  brokerageActorLabel,
  brokerageMeaning,
  brokerageNextHint,
  brokeragePhaseLabel,
  getBrokerageStatusMeta,
  type BrokerageAudience,
} from "@/components/brokerage/labels";
import { nextActor } from "@/lib/brokerage/status";
import { cn } from "@/lib/utils";

export function BrokerageStatusBrief({
  status,
  locale,
  audience,
  className,
}: {
  status: string;
  locale: string;
  audience: BrokerageAudience;
  className?: string;
}) {
  const meta = getBrokerageStatusMeta(status);
  const actor = nextActor(status);
  const ar = locale === "ar";

  const tone =
    actor === "admin"
      ? "border-[color:var(--rad-ac)] bg-[color:var(--rad-acs)]"
      : actor === "trader"
        ? "border-[color:var(--rad-warn)] bg-[color:var(--rad-warns)]"
        : "border-[color:var(--rad-bd)] bg-[color:var(--rad-surface2)]";

  return (
    <aside
      className={cn(
        "rounded-[var(--rad-r,14px)] border px-5 py-4 sm:px-6",
        tone,
        className
      )}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p
          className="text-[0.65rem] font-medium uppercase tracking-[0.14em]"
          style={{ color: "var(--rad-tx3)" }}
        >
          {ar ? "أين نحن الآن" : "Where we are"}
        </p>
        <span style={{ color: "var(--rad-bd2)" }} aria-hidden>
          ·
        </span>
        <span className="text-xs font-medium" style={{ color: "var(--rad-ac)" }}>
          {brokeragePhaseLabel(meta.phase, locale)}
        </span>
      </div>

      <p
        className="mt-3 text-sm leading-relaxed"
        style={{ color: "var(--rad-tx)" }}
      >
        {brokerageMeaning(status, locale)}
      </p>

      <div
        className="mt-3 flex flex-wrap items-start gap-3 border-t pt-3"
        style={{ borderColor: "var(--rad-bd)" }}
      >
        <div className="min-w-[7rem]">
          <p className="text-[0.65rem]" style={{ color: "var(--rad-tx3)" }}>
            {ar ? "من ينتظر" : "Waiting on"}
          </p>
          <p
            className="mt-0.5 text-sm font-semibold"
            style={{ color: "var(--rad-tx)" }}
          >
            {brokerageActorLabel(status, locale)}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem]" style={{ color: "var(--rad-tx3)" }}>
            {ar ? "الخطوة التالية" : "Next step"}
          </p>
          <p
            className="mt-0.5 text-sm font-medium leading-snug"
            style={{ color: "var(--rad-tx)" }}
          >
            {brokerageNextHint(status, locale, audience)}
          </p>
        </div>
      </div>
    </aside>
  );
}
