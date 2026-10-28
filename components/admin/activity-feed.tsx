import Link from "next/link";
import {
  ArrowUpLeft,
  Handshake,
  Package,
  ShoppingBag,
  Activity,
} from "lucide-react";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import type { ActivityFeedItem } from "@/lib/admin/dashboard";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

function domainActorLabel(
  dict: Dictionary,
  domain: ActivityFeedItem["domain"],
  actor: string
) {
  const type =
    domain === "retail"
      ? dict.inbox.typeRetail
      : domain === "deal"
        ? dict.inbox.typeDeal
        : dict.inbox.typeWholesale;
  const role =
    domain === "retail"
      ? (dict.adminUi.detail.actor[actor] ?? actor)
      : (dict.trader.actorRole[actor as "trader" | "admin"] ?? actor);
  return `${type} · ${role}`;
}

function eventLabel(
  dict: Dictionary,
  domain: ActivityFeedItem["domain"],
  eventKey: string
): string {
  if (domain === "retail") {
    return dict.adminUi.detail.retailEvent[eventKey] ?? eventKey;
  }
  if (domain === "deal") {
    return dict.trader.dealAction[eventKey] ?? eventKey;
  }
  return dict.trader.wholesaleEvent[eventKey] ?? eventKey;
}

/** Safe text-only detail — never interpret as HTML. */
function humanizeDetail(detail: string | null | undefined): string | null {
  if (!detail) return null;
  if (/^Mode:\s*/i.test(detail.trim())) return null;
  return detail;
}

function domainIcon(domain: ActivityFeedItem["domain"]) {
  if (domain === "retail") {
    return <ShoppingBag className="size-4" strokeWidth={1.5} aria-hidden />;
  }
  if (domain === "deal") {
    return <Handshake className="size-4" strokeWidth={1.5} aria-hidden />;
  }
  return <Package className="size-4" strokeWidth={1.5} aria-hidden />;
}

function domainTone(
  domain: ActivityFeedItem["domain"]
): TimelineEvent["tone"] {
  return domain;
}

/** A07 / D31 — Timeline of last 10 domain events, each linking to its record. */
export function ActivityFeed({
  items,
  dict,
  locale,
  className,
}: {
  items: readonly ActivityFeedItem[];
  dict: Dictionary;
  locale: Locale;
  className?: string;
}) {
  const a = dict.admin;

  const events: TimelineEvent[] = items.map((item) => {
    const label = eventLabel(dict, item.domain, item.eventKey);
    const detail = humanizeDetail(item.detail);
    return {
      id: item.id,
      title: `${item.reference} · ${label}`,
      actor: domainActorLabel(dict, item.domain, item.actor),
      relativeTime: formatRelative(item.at, locale),
      absoluteTime: formatDate(item.at, locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      icon: domainIcon(item.domain),
      tone: domainTone(item.domain),
      detail: (
        <span className="inline-flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {detail ? (
            <span className="ro-portal-message-panel mt-0 flex-1">{detail}</span>
          ) : null}
          <Link
            href={item.href}
            className="ro-icon-btn shrink-0 self-start"
            aria-label={`${a.actionOpen} ${item.reference}`}
          >
            <ArrowUpLeft
              className="size-3.5 rtl:-scale-x-100"
              strokeWidth={1.5}
              aria-hidden
            />
            {a.actionOpen}
          </Link>
        </span>
      ),
    };
  });

  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="ro-portal-section-title flex items-center gap-2">
        <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
          <Activity className="size-4" strokeWidth={1.5} />
        </span>
        {a.activityFeed}
      </h2>
      {events.length === 0 ? (
        <p className="ro-portal-card border p-4 text-sm font-semibold text-ro-muted">
          {a.activityEmpty}
        </p>
      ) : (
        <div className="ro-portal-card border p-3 md:p-4">
          <Timeline label={a.activityFeed} events={events} />
        </div>
      )}
    </section>
  );
}
