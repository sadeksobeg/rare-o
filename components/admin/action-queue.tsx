"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Handshake, Package, ShoppingBag } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { spawnPressRipple } from "@/components/motion/press-ripple";
import type { ActionQueueDomain, ActionQueueRow } from "@/lib/admin/dashboard";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatRelative } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { fmt } from "@/lib/ui/trader-labels";
import { cn } from "@/lib/utils";

type Filter = "all" | ActionQueueDomain;

function DomainIcon({ domain }: { domain: ActionQueueDomain }) {
  if (domain === "retail") {
    return <ShoppingBag className="size-3.5" strokeWidth={1.5} aria-hidden />;
  }
  if (domain === "deal") {
    return <Handshake className="size-3.5" strokeWidth={1.5} aria-hidden />;
  }
  return <Package className="size-3.5" strokeWidth={1.5} aria-hidden />;
}

function barClass(domain: ActionQueueDomain) {
  if (domain === "wholesale") return "bg-[var(--ro-amber-500)]";
  if (domain === "deal") return "bg-[var(--ro-plum-900)]";
  return "bg-[var(--ro-ink-950)]";
}

function chipClass(domain: ActionQueueDomain) {
  if (domain === "wholesale") {
    return "bg-[var(--ro-amber-100)] text-[var(--ro-amber-800)]";
  }
  if (domain === "deal") {
    return "bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]";
  }
  return "bg-[var(--ro-sand-300)] text-[var(--ro-ink-600)]";
}

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

/** A06 / D31b — merged nextActor=admin rows, oldest first, max 8 + domain tabs. */
export function ActionQueue({
  rows,
  counts,
  dict,
  locale,
  className,
}: {
  rows: readonly ActionQueueRow[];
  counts: { retail: number; deal: number; wholesale: number };
  dict: Dictionary;
  locale: Locale;
  className?: string;
}) {
  const a = dict.admin;
  const [filter, setFilter] = useState<Filter>("all");
  const total = counts.retail + counts.deal + counts.wholesale;
  const visible = useMemo(() => {
    const filtered =
      filter === "all" ? rows : rows.filter((row) => row.domain === filter);
    return filtered.slice(0, 8);
  }, [filter, rows]);

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: fmt(a.filterAll, { n: total }) },
    { id: "retail", label: a.filterRetail },
    { id: "deal", label: a.filterDeals },
    { id: "wholesale", label: a.filterWholesale },
  ];

  return (
    <section className={cn("space-y-3", className)}>
      <div className="ro-portal-card border p-3 sm:p-3.5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-medium text-ro-ink">
            {a.actionQueue}
          </h2>
          <div
            role="tablist"
            aria-label={a.actionQueue}
            className="flex flex-wrap gap-1.5 text-xs"
          >
            {tabs.map((tab) => {
              const on = tab.id === filter;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 transition-colors duration-[var(--ro-dur-fast)]",
                    on
                      ? "bg-[var(--ro-plum-900)] text-[var(--ro-sand-100)]"
                      : "text-[var(--ro-ink-600)] hover:bg-[var(--ro-sand-200)]"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="border-t border-[color-mix(in_srgb,var(--ro-ink-950)_10%,transparent)] py-4 text-sm font-bold text-[var(--ro-success-700)]">
            {a.actionEmpty}
          </p>
        ) : (
          <div>
            {visible.map((row, i) => {
              const age = asDate(row.ageAt);
              const heading =
                row.domain === "deal" ? row.title.replace(`${row.reference} · `, "") : row.reference;
              const meta = [
                row.domain === "retail" && row.lineCount != null
                  ? fmt(a.piecesCount, { n: row.lineCount })
                  : row.subtitle,
                formatRelative(age, locale),
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Reveal key={`${row.domain}-${row.id}`} delayMs={i * 25}>
                  <Link
                    href={row.href}
                    className="ro-press-ripple grid grid-cols-[3px_auto_minmax(0,1fr)_auto] items-center gap-2.5 border-t border-[color-mix(in_srgb,var(--ro-ink-950)_10%,transparent)] py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--ro-plum-50)_70%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)] sm:gap-2.5"
                    onPointerDown={(e) => {
                      spawnPressRipple(e.currentTarget, e.clientX, e.clientY);
                    }}
                  >
                    <span
                      className={cn("h-7 rounded-[2px]", barClass(row.domain))}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium",
                        chipClass(row.domain)
                      )}
                    >
                      <DomainIcon domain={row.domain} />
                      {row.domain === "retail"
                        ? a.filterRetail
                        : row.domain === "deal"
                          ? a.filterDeals
                          : a.filterWholesale}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ro-ink">
                        {heading}
                      </p>
                      <p className="truncate text-[11px] text-[var(--ro-ink-600)]">
                        {meta}
                      </p>
                    </div>
                    <span className="inline-flex h-8 items-center rounded-[6px] bg-[var(--ro-ink-950)] px-3 text-xs font-medium text-[var(--ro-sand-100)]">
                      {a.actionOpen}
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
