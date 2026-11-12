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
import { Card, CardHeader } from "@/components/ui-kit/card";
import { Timeline } from "@/components/ui-kit/detail";
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
      return <RefreshCw className="size-4" strokeWidth={1.5} aria-hidden />;
    case "continue":
      return <MessageSquare className="size-4" strokeWidth={1.5} aria-hidden />;
    case "accept":
      return <CheckCircle2 className="size-4" strokeWidth={1.5} aria-hidden />;
    case "reject":
      return <XCircle className="size-4" strokeWidth={1.5} aria-hidden />;
    case "close":
      return <Ban className="size-4" strokeWidth={1.5} aria-hidden />;
    default:
      return <Handshake className="size-4" strokeWidth={1.5} aria-hidden />;
  }
}

function actorIcon(actorRole: string): ReactNode {
  if (actorRole === "admin") {
    return <Shield className="size-4" strokeWidth={1.5} aria-hidden />;
  }
  if (actorRole === "trader") {
    return <Store className="size-4" strokeWidth={1.5} aria-hidden />;
  }
  return actionIcon("continue");
}

/**
 * NegotiationThread: timeline of entries + structured action bar
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
  bare?: boolean;
}) {
  const events = entries.map((e) => {
    const when = formatRelative(e.createdAt, locale);
    const absolute = formatDate(e.createdAt, locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const actor = labels.actorRole[e.actorRole] ?? e.actorRole;
    const actionTitle = labels.dealAction[e.action] ?? e.action;

    const termBits: string[] = [];
    if (e.proposedPrice != null) termBits.push(money(e.proposedPrice, e.currency));
    if (e.quantity != null) termBits.push(`${qtyLabel} ${e.quantity}`);
    const termsLine =
      termBits.length > 0 ? `${termsLabel} · ${termBits.join(" · ")}` : null;

    const message = e.message?.trim() || null;
    const notes = e.conditionsNotes?.trim() || null;

    const meta = (
      <span className="block min-w-0 space-y-1 whitespace-normal break-words">
        <span className="block text-[color:var(--rad-tx3)]">
          {[actor, when].filter(Boolean).join(" · ")}
        </span>
        {termsLine ? (
          <span className="block text-[color:var(--rad-tx2)]">{termsLine}</span>
        ) : null}
        {message ? (
          <span className="block whitespace-pre-wrap text-[color:var(--rad-tx)]">
            {message}
          </span>
        ) : null}
        {notes ? (
          <span className="block whitespace-pre-wrap text-[color:var(--rad-tx2)]">
            {notes}
          </span>
        ) : null}
        <span className="sr-only"> ({absolute})</span>
      </span>
    );

    return {
      icon:
        e.actorRole === "admin" || e.actorRole === "trader"
          ? actorIcon(e.actorRole)
          : actionIcon(e.action),
      title: actionTitle,
      meta,
    };
  });

  const body =
    events.length === 0 ? (
      <p className="text-sm text-[color:var(--rad-tx3)]">—</p>
    ) : (
      <Timeline events={events} />
    );

  const form = open ? (
    <NegotiationForm
      dealId={dealId}
      mode={mode}
      labels={labels}
      currency={currency}
    />
  ) : null;

  if (bare) {
    return (
      <div className="min-w-0 space-y-6" data-component="negotiation-thread">
        {body}
        {form}
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6" data-component="negotiation-thread">
      <Card padded={false} className="min-w-0 overflow-hidden">
        <CardHeader
          title={
            <span className="inline-flex min-w-0 items-center gap-2">
              <MessagesSquare
                className="size-4 shrink-0"
                strokeWidth={1.5}
                aria-hidden
              />
              <span className="min-w-0 truncate">{title}</span>
            </span>
          }
        />
        <div className="rad-cb2 min-w-0 overflow-x-clip">{body}</div>
      </Card>
      {form}
    </div>
  );
}
