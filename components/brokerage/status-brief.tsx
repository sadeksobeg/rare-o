import { BrokerageStatusBadge } from "@/components/brokerage/status-badge";
import {
  brokerageActorLabel,
  brokerageMeaning,
  brokerageNextHint,
  brokeragePhaseLabel,
  brokerageStatusLabel,
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
      ? "border-[color-mix(in_srgb,var(--ro-plum-700)_35%,transparent)] bg-[color-mix(in_srgb,var(--ro-plum-50)_55%,var(--ro-sand-50))]"
      : actor === "trader"
        ? "border-[color-mix(in_srgb,var(--ro-amber-500)_40%,transparent)] bg-[color-mix(in_srgb,var(--ro-amber-100)_40%,var(--ro-sand-50))]"
        : "border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)]";

  return (
    <aside
      className={cn(
        "rounded-[var(--ro-r-lg)] border px-5 py-4 sm:px-6",
        tone,
        className
      )}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[var(--ro-ink-500)]">
          {ar ? "أين نحن الآن" : "Where we are"}
        </p>
        <span className="text-[var(--ro-border)]" aria-hidden>
          ·
        </span>
        <span className="text-xs font-medium text-[var(--ro-plum-800)]">
          {brokeragePhaseLabel(meta.phase, locale)}
        </span>
        <BrokerageStatusBadge
          status={status}
          label={brokerageStatusLabel(status, locale)}
          className="ms-auto"
        />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ro-ink">
        {brokerageMeaning(status, locale)}
      </p>

      <div className="mt-3 flex flex-wrap items-start gap-3 border-t border-[color-mix(in_srgb,var(--ro-ink-950)_8%,transparent)] pt-3">
        <div className="min-w-[7rem]">
          <p className="text-[0.65rem] text-[var(--ro-ink-500)]">
            {ar ? "من ينتظر" : "Waiting on"}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ro-ink">
            {brokerageActorLabel(status, locale)}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] text-[var(--ro-ink-500)]">
            {ar ? "الخطوة التالية" : "Next step"}
          </p>
          <p className="mt-0.5 text-sm font-medium leading-snug text-ro-ink">
            {brokerageNextHint(status, locale, audience)}
          </p>
        </div>
      </div>
    </aside>
  );
}
