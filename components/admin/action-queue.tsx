"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Handshake, Package, ShoppingBag } from "lucide-react";
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
    return "bg-[color-mix(in_srgb,var(--ro-amber-500)_22%,transparent)] text-[var(--ro-amber-500)]";
  }
  if (domain === "deal") {
    return "bg-[color-mix(in_srgb,var(--ro-plum-700)_22%,transparent)] text-[var(--ro-plum-300)]";
  }
  return "bg-[color-mix(in_srgb,var(--ro-text)_10%,transparent)] text-[color:var(--ro-text-muted)]";
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
      <div className="ro-portal-card border p-3 sm:p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-[color:var(--ro-text)]">
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
                    "min-h-9 rounded-[var(--ro-r-sm)] px-2.5 py-1 transition-colors duration-[var(--ro-dur-fast)]",
                    on
                      ? "bg-[var(--ro-plum-700)] text-[var(--ro-sand-50)]"
                      : "text-[color:var(--ro-text-muted)] hover:bg-[color-mix(in_srgb,var(--ro-text)_8%,transparent)]"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="border-t border-[color:var(--ro-border-subtle)] py-4 text-sm font-bold text-[var(--ro-success-700)]">
            {a.actionEmpty}
          </p>
        ) : (
          <div>
            {visible.map((row) => {
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
                  <Link
                    key={`${row.domain}-${row.id}`}
                    href={row.href}
                    className="group grid min-h-11 grid-cols-[3px_auto_minmax(0,1fr)_auto] items-center gap-2.5 border-t border-[color:var(--ro-border-subtle)] py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--ro-plum-700)_10%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)] sm:gap-2.5"
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
                      <p className="truncate text-[13px] font-medium text-[color:var(--ro-text)]">
                        {heading}
                      </p>
                      <p className="truncate text-[11px] text-[color:var(--ro-text-muted)]">
                        {meta}
                      </p>
                    </div>
                    <span
                      className="inline-flex size-8 items-center justify-center text-[var(--ro-plum-300)] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                      aria-hidden
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </span>
                  </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
