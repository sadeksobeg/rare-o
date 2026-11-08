"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpLeft,
  Handshake,
  Package,
  ShoppingBag,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ActivityFeedItem } from "@/lib/admin/dashboard";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const PREVIEW = 5;

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

function isFresh(at: Date | string) {
  const t = at instanceof Date ? at.getTime() : new Date(at).getTime();
  return Date.now() - t < 5 * 60 * 1000;
}

/** Dense activity rail — preview latest + expand in place (no page stretch). */
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
  const [expanded, setExpanded] = useState(false);
  const pool = items.slice(0, 10);
  const canToggle = pool.length > PREVIEW;
  const shown = expanded ? pool : pool.slice(0, PREVIEW);

  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="ro-portal-section-title flex items-center gap-2">
        <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
          <Activity className="size-4" strokeWidth={1.5} />
        </span>
        {a.activityFeed}
      </h2>
      {pool.length === 0 ? (
        <p className="ro-portal-card border p-4 text-sm font-semibold text-ro-muted">
          {a.activityEmpty}
        </p>
      ) : (
        <div className="ro-portal-card overflow-hidden border">
          <div className="divide-y divide-[color:var(--pilot-border-subtle,var(--ro-border-subtle))]">
            {shown.map((item) => {
              const label = eventLabel(dict, item.domain, item.eventKey);
              const detail = humanizeDetail(item.detail);
              const fresh = isFresh(item.at);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "group grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-3 py-3 transition-[background-color] duration-[var(--ro-dur-fast)] hover:bg-[color:var(--ro-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pilot-focus,var(--ro-focus))] sm:px-4",
                    fresh && "ro-row-flash"
                  )}
                >
                  <span
                    className="mt-0.5 inline-flex size-8 items-center justify-center rounded-[8px] bg-[color:var(--pilot-accent-bg,var(--ro-accent-well))] text-[color:var(--pilot-accent,var(--ro-accent-fg))]"
                    aria-hidden
                  >
                    {domainIcon(item.domain)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[color:var(--pilot-text,var(--ro-text))]">
                      {item.reference} · {label}
                    </p>
                    <p className="truncate text-[11px] text-[color:var(--pilot-text-muted,var(--ro-text-muted))]">
                      {domainActorLabel(dict, item.domain, item.actor)}
                      {" · "}
                      <time
                        dateTime={
                          item.at instanceof Date
                            ? item.at.toISOString()
                            : String(item.at)
                        }
                        title={formatDate(item.at, locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      >
                        {formatRelative(item.at, locale)}
                      </time>
                    </p>
                    {detail ? (
                      <p className="mt-1 line-clamp-1 text-[11px] text-[color:var(--pilot-text-muted,var(--ro-text-muted))]">
                        {detail}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className="mt-1 inline-flex size-8 items-center justify-center text-[color:var(--pilot-accent,var(--ro-accent-fg))] transition-transform duration-[var(--ro-dur-fast)] group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    aria-hidden
                  >
                    <ArrowUpLeft
                      className="size-3.5 rtl:-scale-x-100"
                      strokeWidth={1.5}
                    />
                  </span>
                </Link>
              );
            })}
          </div>
          {canToggle ? (
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-center gap-1.5 border-t border-[color:var(--pilot-border-subtle,var(--ro-border-subtle))] px-3 text-[12px] font-semibold text-[color:var(--pilot-accent,var(--ro-accent-fg))] transition-[background-color] duration-[var(--ro-dur-fast)] hover:bg-[color:var(--ro-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pilot-focus,var(--ro-focus))]"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <>
                  {a.activityShowLess}
                  <ChevronUp className="size-3.5" strokeWidth={1.5} aria-hidden />
                </>
              ) : (
                <>
                  {a.activityShowMore}
                  <ChevronDown className="size-3.5" strokeWidth={1.5} aria-hidden />
                </>
              )}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
