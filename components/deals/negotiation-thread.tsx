import { NegotiationForm } from "@/components/deals/negotiation-form";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import type { Locale } from "@/lib/i18n/config";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import type { TraderDict } from "@/lib/ui/trader-labels";

export type NegotiationEntryView = {
  id: string;
  action: string;
  actorRole: string;
  message: string | null;
  proposedPrice: unknown;
  currency: string | null;
  quantity: number | null;
  conditionsNotes: string | null;
  createdAt: Date;
};

/**
 * A19 — NegotiationThread: Timeline of entries + structured action bar
 * (shared by admin AD-05 and trader TR-05).
 */
export function NegotiationThread({
  entries,
  dealId,
  mode,
  open,
  locale,
  labels,
  title,
  money,
  termsLabel,
  qtyLabel,
}: {
  entries: readonly NegotiationEntryView[];
  dealId: string;
  mode: "trader" | "admin";
  open: boolean;
  locale: Locale;
  labels: TraderDict;
  title: string;
  money: (value: unknown, currency: string | null | undefined) => string;
  termsLabel: string;
  qtyLabel: string;
}) {
  const events: TimelineEvent[] = entries.map((e) => {
    const bits: string[] = [];
    if (e.message) bits.push(e.message);
    if (e.proposedPrice != null || e.quantity != null) {
      bits.push(
        [
          termsLabel,
          e.proposedPrice != null ? money(e.proposedPrice, e.currency) : "",
          e.quantity != null ? `${qtyLabel} ${e.quantity}` : "",
        ]
          .filter(Boolean)
          .join(" · ")
      );
    }
    if (e.conditionsNotes) bits.push(e.conditionsNotes);

    return {
      id: e.id,
      title: labels.dealAction[e.action] ?? e.action,
      actor: labels.actorRole[e.actorRole] ?? e.actorRole,
      relativeTime: formatRelative(e.createdAt, locale),
      absoluteTime: formatDate(e.createdAt, locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      detail: bits.length ? (
        <div className="space-y-1 whitespace-pre-wrap">{bits.join("\n")}</div>
      ) : undefined,
    };
  });

  return (
    <div className="space-y-6" data-component="negotiation-thread">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {events.length === 0 ? (
          <p className="text-sm text-ro-muted">—</p>
        ) : (
          <Timeline label={title} events={events} />
        )}
      </div>
      {open ? (
        <NegotiationForm dealId={dealId} mode={mode} labels={labels} />
      ) : null}
    </div>
  );
}
