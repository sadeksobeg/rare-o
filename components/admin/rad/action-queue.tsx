"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleCheck,
  Handshake,
  Package,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { formatRelative } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export type RadQueueDomain = "retail" | "deal" | "wholesale";
export type RadQueueStatus = "new" | "warn" | "info" | "ok";

export type RadQueueRow = {
  id: string;
  domain: RadQueueDomain;
  title: string;
  subtitle: string;
  href: string;
  ageAt: Date;
  status: RadQueueStatus;
};

const DOMAIN_ICON: Record<RadQueueDomain, LucideIcon> = {
  retail: ShoppingBag,
  deal: Handshake,
  wholesale: Package,
};

export function RadActionQueue({
  rows,
  counts,
  title,
  tabAllLabel,
  tabLabels,
  footerTemplate,
  viewAllLabel,
  viewAllHref,
  emptyTitle,
  emptyBody,
  openLabel,
  statusLabels,
  locale,
}: {
  rows: RadQueueRow[];
  counts: { retail: number; deal: number; wholesale: number };
  title: string;
  tabAllLabel: string;
  tabLabels: Record<RadQueueDomain, string>;
  footerTemplate: string;
  viewAllLabel: string;
  viewAllHref: string;
  emptyTitle: string;
  emptyBody: string;
  openLabel: string;
  statusLabels: Record<RadQueueStatus, string>;
  locale: Locale;
}) {
  const [tab, setTab] = useState<"all" | RadQueueDomain>("all");
  const segRef = useRef<HTMLDivElement>(null);
  const total = counts.retail + counts.deal + counts.wholesale;
  const tabs: { key: "all" | RadQueueDomain; label: string; count: number }[] = [
    { key: "all", label: tabAllLabel, count: total },
    { key: "retail", label: tabLabels.retail, count: counts.retail },
    { key: "deal", label: tabLabels.deal, count: counts.deal },
    { key: "wholesale", label: tabLabels.wholesale, count: counts.wholesale },
  ];
  const visible = rows.filter((r) => tab === "all" || r.domain === tab).slice(0, 8);

  useLayoutEffect(() => {
    const root = segRef.current;
    if (!root) return;
    const on = root.querySelector<HTMLElement>("button[data-on='true']");
    const ind = root.querySelector<HTMLElement>(".rad-ind");
    if (!on || !ind) return;
    ind.style.width = `${on.offsetWidth}px`;
    ind.style.transform = `translateX(${on.offsetLeft}px)`;
  }, [tab]);

  return (
    <section className="rad-card rad-rise" style={{ "--rad-s": 5 } as React.CSSProperties}>
      <div className="rad-ch">
        <h2>
          {title} <span className="rad-cnt rad-num">{total}</span>
        </h2>
        <div className="rad-seg" ref={segRef} role="tablist" aria-label={title}>
          <span className="rad-ind" aria-hidden />
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              data-on={tab === t.key ? "true" : undefined}
              className={cn(tab === t.key && "rad-on")}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <em className="rad-num">{t.count}</em>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rad-empty">
          <CircleCheck width={30} height={30} strokeWidth={1.5} aria-hidden />
          <b>{emptyTitle}</b>
          {emptyBody}
        </div>
      ) : (
        <div className="rad-list" role="list">
          {visible.map((row, i) => {
            const Icon = DOMAIN_ICON[row.domain];
            return (
              <Link
                key={row.id}
                href={row.href}
                role="listitem"
                className="rad-row"
                style={{ "--rad-i": i } as React.CSSProperties}
              >
                <span className={cn("rad-chip", `rad-c-${row.domain === "retail" ? "ac" : row.domain === "deal" ? "warn" : "info"}`)}>
                  <Icon width={17} height={17} strokeWidth={1.5} aria-hidden />
                </span>
                <div className="rad-tt">
                  <b>{row.title}</b>
                  <span>
                    <bdi className="rad-ltr rad-num">{row.subtitle}</bdi>
                  </span>
                </div>
                <span className="rad-pw">
                  <span className={cn("rad-pill", `rad-p-${row.status}`)}>
                    {statusLabels[row.status]}
                  </span>
                </span>
                <span className="rad-age">{formatRelative(row.ageAt, locale)}</span>
                <RowOpenButton href={row.href} label={openLabel} />
              </Link>
            );
          })}
        </div>
      )}
      <div className="rad-lf">
        <span>{footerTemplate.replace("{shown}", String(visible.length)).replace("{total}", String(tabs.find((t) => t.key === tab)?.count ?? 0))}</span>
        <Link href={viewAllHref}>{viewAllLabel}</Link>
      </div>
    </section>
  );
}

function RowOpenButton({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rad-btn rad-gh rad-sm rad-go"
      tabIndex={-1}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(href);
      }}
    >
      {label}
    </button>
  );
}
