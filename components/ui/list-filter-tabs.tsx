"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type ListFilterTab = {
  id: string;
  label: string;
  count?: number;
};

/** URL-driven underline tabs for trader deal / wholesale lists (TR-03 / TR-07). */
export function ListFilterTabs({
  tabs,
  param = "tab",
  label,
}: {
  tabs: readonly ListFilterTab[];
  param?: string;
  label: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(param) || tabs[0]?.id || "all";

  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto overscroll-x-contain border-b border-ro-border pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        const next = new URLSearchParams(searchParams.toString());
        if (tab.id === "all" || tab.id === tabs[0]?.id) next.delete(param);
        else next.set(param, tab.id);
        const qs = next.toString();
        const href = qs ? `${pathname}?${qs}` : pathname;
        return (
          <Link
            key={tab.id}
            href={href}
            role="tab"
            aria-selected={selected}
            scroll={false}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
              selected
                ? "border-[var(--ro-plum-900)] font-semibold text-ro-ink"
                : "border-transparent text-ro-text-2 hover:text-ro-ink"
            )}
          >
            {tab.label}
            {tab.count != null ? (
              <span className="tabular-nums text-xs text-ro-muted">
                ({tab.count})
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
