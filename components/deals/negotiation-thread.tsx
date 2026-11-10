import type { ReactNode } from "react";
import {
  Ban,
  CheckCircle2,
  Handshake,
  MessageSquare,
  MessagesSquare,
  RefreshCw,
  Shield,
  Store,
  XCircle,
} from "lucide-react";
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

function actionIcon(action: string): ReactNode {
  switch (action) {
    case "propose":
    case "counter":
      return <RefreshCw className="size-4" strokeWidth={2} aria-hidden />;
    case "continue":
      return <MessageSquare className="size-4" strokeWidth={2} aria-hidden />;
    case "accept":
      return <CheckCircle2 className="size-4" strokeWidth={2} aria-hidden />;
    case "reject":
      return <XCircle className="size-4" strokeWidth={2} aria-hidden />;
    case "close":
      return <Ban className="size-4" strokeWidth={2} aria-hidden />;
    default:
      return <Handshake className="size-4" strokeWidth={2} aria-hidden />;
  }
}

function actorTone(actorRole: string): TimelineEvent["tone"] {
  if (actorRole === "admin") return "admin";
  if (actorRole === "trader") return "trader";
  return "deal";
}

function actorLeading(actorRole: string): ReactNode {
  if (actorRole === "admin") {
    return <Shield className="size-4" strokeWidth={2} aria-hidden />;
  }
  if (actorRole === "trader") {
    return <Store className="size-4" strokeWidth={2} aria-hidden />;
  }
  return actionIcon("continue");
}

/**
 * A19 — NegotiationThread: Timeline of entries + structured action bar
 * (shared by admin AD-05 and trader TR-05).
 * Message / notes render as React text children only (escaped) — never HTML.
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
  currency,
  bare = false,
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
  currency?: string | null;
  /** Skip outer heading + card chrome when wrapped in ui-kit Card. */
  bare?: boolean;
}) {
  const events: TimelineEvent[] = entries.map((e) => {
    const textBits: string[] = [];
    if (e.message) textBits.push(e.message);
    if (e.conditionsNotes) textBits.push(e.conditionsNotes);

    const termsLine =
      e.proposedPrice != null || e.quantity != null
        ? [
            termsLabel,
            e.proposedPrice != null ? money(e.proposedPrice, e.currency) : "",
            e.quantity != null ? `${qtyLabel} ${e.quantity}` : "",
          ]
            .filter(Boolean)
            .join(" · ")
        : null;

    return {
      id: e.id,
      title: labels.dealAction[e.action] ?? e.action,
      actor: labels.actorRole[e.actorRole] ?? e.actorRole,
      relativeTime: formatRelative(e.createdAt, locale),
      absoluteTime: formatDate(e.createdAt, locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      icon: e.actorRole === "admin" || e.actorRole === "trader"
        ? actorLeading(e.actorRole)
        : actionIcon(e.action),
      tone: actorTone(e.actorRole),
      detail:
        textBits.length || termsLine ? (
          <div className="space-y-2">
            {termsLine ? (
              <p className="text-xs font-medium tracking-wide text-[color:var(--rad-tx2)]">
                {termsLine}
              </p>
            ) : null}
            {textBits.length ? (
              <div className="ro-portal-message-panel mt-0">
                {/* Text-only: React escapes any script/markup from seeds or users */}
                {textBits.join("\n")}
              </div>
            ) : null}
          </div>
        ) : undefined,
    };
  });

  const body =
    events.length === 0 ? (
      <p
        className={
          bare
            ? "text-sm"
            : "ro-portal-card border p-4 text-sm font-semibold text-ro-muted"
        }
        style={bare ? { color: "var(--rad-tx3)" } : undefined}
      >
        —
      </p>
    ) : bare ? (
      <Timeline label={title} events={events} />
    ) : (
      <div className="ro-portal-card border p-3 md:p-4">
        <Timeline label={title} events={events} />
      </div>
    );

  return (
    <div className="space-y-6" data-component="negotiation-thread">
      <div className="space-y-3">
        {bare ? null : (
          <h2 className="ro-portal-section-title flex items-center gap-2">
            <span
              className="ro-portal-icon-well size-8 [&>svg]:size-4"
              aria-hidden
            >
              <MessagesSquare className="size-4" strokeWidth={2} />
            </span>
            {title}
          </h2>
        )}
        {body}
      </div>
      {open ? (
        <NegotiationForm
          dealId={dealId}
          mode={mode}
          labels={labels}
          currency={currency}
        />
      ) : null}
    </div>
  );
}
