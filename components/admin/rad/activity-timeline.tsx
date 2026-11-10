"use client";

import { CircleCheck, Handshake, Package, ShoppingBag, type LucideIcon } from "lucide-react";
import type { ActivityFeedItem } from "@/lib/admin/dashboard";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatRelative } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const DOMAIN_ICON: Record<ActivityFeedItem["domain"], LucideIcon> = {
  retail: ShoppingBag,
  deal: Handshake,
  wholesale: Package,
};

function eventLabel(dict: Dictionary, item: ActivityFeedItem): string {
  if (item.domain === "retail") {
    return dict.adminUi.detail.retailEvent[item.eventKey] ?? item.eventKey;
  }
  if (item.domain === "deal") {
    return dict.trader.dealAction[item.eventKey] ?? item.eventKey;
  }
  return dict.trader.wholesaleEvent[item.eventKey] ?? item.eventKey;
}

export function RadActivityTimeline({
  title,
  items,
  dict,
  locale,
  emptyLabel,
}: {
  title: string;
  items: ActivityFeedItem[];
  dict: Dictionary;
  locale: Locale;
  emptyLabel: string;
}) {
  const visible = items.slice(0, 5);
  return (
    <section className="rad-card rad-act rad-rise" style={{ "--rad-s": 8 } as React.CSSProperties}>
      <div className="rad-ch" style={{ padding: 0 }}>
        <h2>{title}</h2>
      </div>
      {visible.length === 0 ? (
        <div className="rad-empty">
          <CircleCheck width={28} height={28} strokeWidth={1.5} aria-hidden />
          <b>{emptyLabel}</b>
        </div>
      ) : null}
      <div className="rad-tl">
        {visible.map((item, i) => {
          const Icon = DOMAIN_ICON[item.domain];
          return (
            <div
              key={item.id}
              className="rad-ev"
              style={{ "--rad-i": i } as React.CSSProperties}
            >
              <span
                className={cn(
                  "rad-chip",
                  `rad-c-${item.domain === "retail" ? "ac" : item.domain === "deal" ? "warn" : "info"}`
                )}
              >
                <Icon width={15} height={15} strokeWidth={1.5} aria-hidden />
              </span>
              <div>
                <b>
                  <bdi dir="ltr">{item.reference}</bdi> · {eventLabel(dict, item)}
                </b>
                <span>{formatRelative(item.at, locale)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
