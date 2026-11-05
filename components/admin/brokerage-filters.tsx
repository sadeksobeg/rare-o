"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ListFilterTabs } from "@/components/ui/list-filter-tabs";
import { cn } from "@/lib/utils";

/**
 * Brokerage list chrome: all/stale tabs + trader/city search
 * (sticky under header — same pattern as AdminTableFilters).
 */
export function BrokerageAdminFilters({
  tabsLabel,
  traderLabel,
  cityLabel,
  searchLabel,
  staleLabel,
  allLabel,
  allCount,
  staleCount,
  resultCount,
  resultLabel,
  clearLabel,
  className,
}: {
  tabsLabel: string;
  traderLabel: string;
  cityLabel: string;
  searchLabel: string;
  staleLabel: string;
  allLabel: string;
  allCount: number;
  staleCount: number;
  resultCount?: number;
  resultLabel?: string;
  clearLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 space-y-3 rounded-[14px] border border-[color:var(--ro-border-subtle)] bg-[color:color-mix(in_srgb,var(--ro-bg-raised)_92%,transparent)] p-3 shadow-[var(--ro-e2)] backdrop-blur-md sm:p-3.5",
        className
      )}
    >
      <Suspense fallback={null}>
        <ListFilterTabs
          param="stale"
          label={tabsLabel}
          tabs={[
            { id: "all", label: allLabel, count: allCount },
            { id: "1", label: staleLabel, count: staleCount },
          ]}
        />
      </Suspense>
      <Suspense fallback={null}>
        <BrokerageSearchFields
          traderLabel={traderLabel}
          cityLabel={cityLabel}
          searchLabel={searchLabel}
          clearLabel={clearLabel}
          resultCount={resultCount}
          resultLabel={resultLabel}
        />
      </Suspense>
    </div>
  );
}

function fieldClass() {
  return "h-11 w-full rounded-[12px] border border-[color:var(--ro-border)] bg-[color:var(--ro-bg-sunken)] px-3 text-sm text-[color:var(--ro-text)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ro-text)_5%,transparent)] outline-none placeholder:text-[color:var(--ro-text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]";
}

function BrokerageSearchFields({
  traderLabel,
  cityLabel,
  searchLabel,
  clearLabel,
  resultCount,
  resultLabel,
}: {
  traderLabel: string;
  cityLabel: string;
  searchLabel: string;
  clearLabel: string;
  resultCount?: number;
  resultLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trader = searchParams.get("trader") ?? "";
  const city = searchParams.get("city") ?? "";
  const hasFilters = Boolean(trader || city || searchParams.get("stale"));

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const next = new URLSearchParams(searchParams.toString());
        const traderValue = String(data.get("trader") ?? "").trim();
        const cityValue = String(data.get("city") ?? "").trim();
        if (traderValue) next.set("trader", traderValue);
        else next.delete("trader");
        if (cityValue) next.set("city", cityValue);
        else next.delete("city");
        if (next.get("stale") === "all") next.delete("stale");
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }}
    >
      <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs text-[color:var(--ro-text-muted)]">
        <span>{traderLabel}</span>
        <input
          name="trader"
          type="search"
          defaultValue={trader}
          className={fieldClass()}
        />
      </label>
      <label className="flex min-w-[8rem] flex-1 flex-col gap-1 text-xs text-[color:var(--ro-text-muted)]">
        <span>{cityLabel}</span>
        <input
          name="city"
          type="search"
          defaultValue={city}
          className={fieldClass()}
        />
      </label>
      <button
        type="submit"
        className="inline-flex h-11 items-center gap-1.5 rounded-[12px] border border-[color:color-mix(in_srgb,var(--ro-accent-fg,var(--ro-plum-700))_35%,var(--ro-border))] bg-[color:color-mix(in_srgb,var(--ro-accent-fg,var(--ro-plum-700))_14%,var(--ro-panel))] px-4 text-sm font-semibold text-[color:var(--ro-accent-fg,var(--ro-plum-800))] transition-[background-color,border-color] hover:bg-[color:color-mix(in_srgb,var(--ro-accent-fg,var(--ro-plum-700))_22%,var(--ro-panel))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
      >
        <Search className="size-4" strokeWidth={1.5} aria-hidden />
        {searchLabel}
      </button>
      {hasFilters ? (
        <button
          type="button"
          className="h-11 rounded-[12px] px-3 text-sm font-medium text-[color:var(--ro-text-2)] underline-offset-2 hover:text-[color:var(--ro-text)] hover:underline"
          onClick={() => router.replace(pathname, { scroll: false })}
        >
          {clearLabel}
        </button>
      ) : null}
      {typeof resultCount === "number" ? (
        <p
          role="status"
          aria-live="polite"
          className="flex h-11 items-center text-sm tabular-nums text-[color:var(--ro-text-muted)]"
        >
          <span className="font-semibold text-[color:var(--ro-text)]">
            {resultCount}
          </span>
          {resultLabel ? <span className="ms-1">{resultLabel}</span> : null}
        </p>
      ) : null}
    </form>
  );
}
