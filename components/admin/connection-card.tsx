import { Wifi } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatDate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import type { InboxHealthView } from "@/lib/whatsapp/messaging/inbox";
import type { StatusTone } from "@/lib/ui/status";
import { cn } from "@/lib/utils";

function healthTone(state: string): StatusTone {
  switch (state) {
    case "CONNECTED":
      return "success";
    case "CONNECTING":
    case "RECONNECTING":
      return "progress";
    case "AUTHENTICATION_REQUIRED":
      return "attention";
    case "ERROR":
      return "danger";
    default:
      return "closed";
  }
}

function healthLabel(dict: Dictionary, state: string): string {
  switch (state) {
    case "CONNECTED":
      return dict.inbox.healthConnected;
    case "CONNECTING":
      return dict.inbox.healthConnecting;
    case "RECONNECTING":
      return dict.inbox.healthReconnecting;
    case "AUTHENTICATION_REQUIRED":
      return dict.inbox.healthAuthRequired;
    case "ERROR":
      return dict.inbox.healthError;
    case "DISCONNECTED":
    default:
      return dict.inbox.healthDisconnected;
  }
}

/**
 * A08 / D32a — WhatsApp state, last connected, re-auth link, outbound READ-ONLY.
 * No in-app Switch.
 */
export function ConnectionCard({
  health,
  dict,
  locale,
  className,
}: {
  health: InboxHealthView;
  dict: Dictionary;
  locale: Locale;
  className?: string;
}) {
  const a = dict.admin;
  const lastConnected = health.lastConnectedAt
    ? formatDate(health.lastConnectedAt, locale, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : a.neverConnected;

  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="ro-portal-section-title flex items-center gap-2">
        <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
          <Wifi className="size-4" strokeWidth={1.5} />
        </span>
        {a.connection}
      </h2>
      <div className="ro-portal-card space-y-4 border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip
            tone={healthTone(health.state)}
            label={healthLabel(dict, health.state)}
            size="sm"
          />
        </div>
        <p className="text-sm text-ro-text-2">
          <span className="text-ro-muted">{a.lastConnected}: </span>
          <time
            dateTime={health.lastConnectedAt ?? undefined}
            title={health.lastConnectedAt ?? undefined}
          >
            {lastConnected}
          </time>
        </p>
        {/* D32a — read-only outbound from env; never a Switch.
            Full phrase already includes the outbound noun — do not prefix a.outbound. */}
        <p
          className={
            health.outboundEnabled
              ? "text-sm font-medium text-ro-ink"
              : "text-sm font-medium text-ro-plum"
          }
        >
          {health.outboundEnabled
            ? dict.inbox.outboundEnabled
            : dict.inbox.outboundDisabled}
        </p>
        <ButtonLink href="/admin/inbox" variant="secondary" size="sm">
          {a.reauthenticate}
        </ButtonLink>
        <div className="flex flex-wrap gap-2 border-t border-ro-border pt-4">
          <ButtonLink href="/admin/products/new" variant="secondary" size="sm">
            {a.quickProduct}
          </ButtonLink>
          <ButtonLink href="/admin/offers" variant="secondary" size="sm">
            {a.quickOffer}
          </ButtonLink>
          <ButtonLink href="/admin/traders" variant="secondary" size="sm">
            {a.quickTrader}
          </ButtonLink>
          <ButtonLink href="/admin/inbox" variant="secondary" size="sm">
            {a.openInbox}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
