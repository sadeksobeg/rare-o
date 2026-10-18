import Link from "next/link";
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

function humanizeDetail(detail: string | null | undefined): string | null {
  if (!detail) return null;
  // Strip technical "Mode: propose_price" style notes from feed detail
  if (/^Mode:\s*/i.test(detail.trim())) return null;
  return detail;
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
      detail: (
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
          {detail ? <span>{detail}</span> : null}
          <Link
            href={item.href}
            className="font-semibold text-ro-plum hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
          >
            {a.actionOpen}
          </Link>
        </span>
      ),
    };
  });

  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="font-display text-xl font-semibold text-ro-ink">
        {a.activityFeed}
      </h2>
      {events.length === 0 ? (
        <p className="ro-portal-card border p-4 text-sm text-ro-muted">
          {a.activityEmpty}
        </p>
      ) : (
        <div className="ro-portal-card border p-4 md:p-5">
          <Timeline label={a.activityFeed} events={events} />
        </div>
      )}
    </section>
  );
}
