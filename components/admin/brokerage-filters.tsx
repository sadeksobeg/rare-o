"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ListFilterTabs } from "@/components/ui/list-filter-tabs";
import { TextField } from "@/components/ui/text-field";
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
        "sticky top-16 z-20 space-y-3 border-b border-ro-line bg-ro-surface/95 py-3 backdrop-blur",
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
        // Keep ListFilterTabs stale=all sentinel out of the URL.
        if (next.get("stale") === "all") next.delete("stale");
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }}
    >
      <TextField
        name="trader"
        label={traderLabel}
        defaultValue={trader}
        dense
        className="min-w-[10rem] flex-1"
      />
      <TextField
        name="city"
        label={cityLabel}
        defaultValue={city}
        dense
        className="min-w-[8rem] flex-1"
      />
      <Button type="submit" size="sm" variant="secondary" className="h-10">
        {searchLabel}
      </Button>
      {hasFilters ? (
        <Button
          type="button"
          size="sm"
          variant="text"
          className="h-10"
          onClick={() => router.replace(pathname, { scroll: false })}
        >
          {clearLabel}
        </Button>
      ) : null}
      {typeof resultCount === "number" ? (
        <p
          role="status"
          aria-live="polite"
          className="flex h-10 items-center text-sm tabular-nums text-ro-muted"
        >
          <span className="font-semibold text-ro-ink">{resultCount}</span>
          {resultLabel ? <span className="ms-1">{resultLabel}</span> : null}
        </p>
      ) : null}
    </form>
  );
}
