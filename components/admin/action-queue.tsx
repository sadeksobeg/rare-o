"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Handshake, Package, ShoppingBag } from "lucide-react";
import { DrawIn, RosetteMark } from "@/components/motion/draw-in";
import { portalStagger } from "@/components/motion/presets";
import type { ActionQueueDomain, ActionQueueRow } from "@/lib/admin/dashboard";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatRelative } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { fmt } from "@/lib/ui/trader-labels";
import { cn } from "@/lib/utils";

export type QueueFilter = "all" | ActionQueueDomain;

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

function isFresh(ageAt: Date | string) {
  const age = asDate(ageAt).getTime();
  return Date.now() - age < 5 * 60 * 1000;
}

function filterHref(id: QueueFilter) {
  if (id === "all") return "/admin";
  return `/admin?domain=${id}`;
}

/** Merged nextActor=admin rows — full-row hit, URL filter, j/k, flash for fresh. */
export function ActionQueue({
  rows,
  counts,
  dict,
  locale,
  filter = "all",
  className,
}: {
  rows: readonly ActionQueueRow[];
  counts: { retail: number; deal: number; wholesale: number };
  dict: Dictionary;
  locale: Locale;
  filter?: QueueFilter;
  className?: string;
}) {
  const a = dict.admin;
  const router = useRouter();
  const reduce = useReducedMotion();
  const lite = Boolean(reduce);
  const listRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  const total = counts.retail + counts.deal + counts.wholesale;
  const visible = useMemo(() => {
    const filtered =
      filter === "all" ? rows : rows.filter((row) => row.domain === filter);
    return filtered.slice(0, portalStagger.maxChildren);
  }, [filter, rows]);

  useEffect(() => {
    setFocusIndex(0);
  }, [filter]);

  useEffect(() => {
    const root = listRef.current;
    if (!root) return;

    function onKey(e: KeyboardEvent) {
      if (!root) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!root.contains(document.activeElement) && document.activeElement !== document.body) {
        /* allow j/k when focus is inside section */
        if (!root.closest("section")?.contains(document.activeElement)) return;
      }
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, Math.max(visible.length - 1, 0)));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && visible[focusIndex]) {
        e.preventDefault();
        router.push(visible[focusIndex]!.href);
      }
    }

    const section = root.closest("section");
    section?.addEventListener("keydown", onKey);
    return () => section?.removeEventListener("keydown", onKey);
  }, [focusIndex, router, visible]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-queue-index="${focusIndex}"]`
    );
    el?.focus({ preventScroll: false });
  }, [focusIndex]);

  const tabs: { id: QueueFilter; label: string }[] = [
    { id: "all", label: fmt(a.filterAll, { n: total }) },
    { id: "retail", label: a.filterRetail },
    { id: "deal", label: a.filterDeals },
    { id: "wholesale", label: a.filterWholesale },
  ];

  return (
    <section
      className={cn("space-y-3", className)}
      tabIndex={-1}
      aria-label={a.actionQueue}
    >
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
                <Link
                  key={tab.id}
                  href={filterHref(tab.id)}
                  role="tab"
                  aria-selected={on}
                  scroll={false}
                  className={cn(
                    "inline-flex min-h-9 items-center rounded-[var(--ro-r-sm)] px-2.5 py-1 transition-[background-color,color,transform] duration-[var(--ro-dur-fast)]",
                    on
                      ? "bg-[var(--ro-plum-700)] text-[var(--ro-sand-50)]"
                      : "text-[color:var(--ro-text-muted)] hover:bg-[color-mix(in_srgb,var(--ro-text)_8%,transparent)]"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 border-t border-[color:var(--ro-border-subtle)] py-8 text-center">
            <DrawIn className="size-10 text-[var(--ro-plum-400)]">
              <RosetteMark className="size-10" />
            </DrawIn>
            <p className="text-sm font-semibold text-[var(--ro-success-700)]">
              {a.actionEmpty}
            </p>
            <Link
              href="/admin/products/new"
              className="inline-flex min-h-11 items-center rounded-[var(--ro-r-sm)] bg-[var(--ro-plum-700)] px-4 text-sm font-medium text-[var(--ro-sand-50)] transition-transform duration-[var(--ro-dur-fast)] hover:bg-[var(--ro-plum-900)] active:scale-[0.97]"
            >
              {a.firstUseAction}
            </Link>
          </div>
        ) : (
          <div ref={listRef} className="relative">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((row, index) => {
                const age = asDate(row.ageAt);
                const heading =
                  row.domain === "deal"
                    ? row.title.replace(`${row.reference} · `, "")
                    : row.reference;
                const meta = [
                  row.domain === "retail" && row.lineCount != null
                    ? fmt(a.piecesCount, { n: row.lineCount })
                    : row.subtitle,
                  formatRelative(age, locale),
                ]
                  .filter(Boolean)
                  .join(" · ");
                const fresh = isFresh(row.ageAt);

                return (
                  <m.div
                    key={`${row.domain}-${row.id}`}
                    layout={!lite}
                    initial={lite ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={lite ? undefined : { opacity: 0, y: -6 }}
                    transition={{
                      duration: lite ? 0.12 : 0.24,
                      delay: lite ? 0 : Math.min(index, 7) * 0.035,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      href={row.href}
                      data-queue-index={index}
                      className={cn(
                        "group grid min-h-11 grid-cols-[3px_auto_minmax(0,1fr)_auto] items-center gap-2.5 border-t border-[color:var(--ro-border-subtle)] py-2.5 transition-[background-color,transform] duration-[var(--ro-dur-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
                        "hover:bg-[color-mix(in_srgb,var(--ro-plum-700)_10%,transparent)]",
                        focusIndex === index &&
                          "bg-[color-mix(in_srgb,var(--ro-plum-700)_12%,transparent)]",
                        fresh && "ro-row-flash"
                      )}
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
                        className="inline-flex size-8 items-center justify-center text-[var(--ro-plum-300)] transition-transform duration-[var(--ro-dur-fast)] group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                        aria-hidden
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                    </Link>
                  </m.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
