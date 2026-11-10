"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input, SegControl } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

/**
 * Brokerage list chrome: all/stale SegControl + compact trader/city row.
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stale = searchParams.get("stale") === "1" ? "1" : "all";
  const trader = searchParams.get("trader") ?? "";
  const city = searchParams.get("city") ?? "";
  const hasFilters = Boolean(trader || city || searchParams.get("stale"));

  const pushParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "" || v === "all") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <SegControl
        aria-label={tabsLabel}
        className="w-full max-w-full"
        value={stale}
        onChange={(value) => pushParams({ stale: value })}
        items={[
          { value: "all", label: allLabel, count: allCount },
          { value: "1", label: staleLabel, count: staleCount },
        ]}
      />

      <form
        className="flex flex-wrap items-center gap-2"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          pushParams({
            trader: String(data.get("trader") ?? "").trim() || null,
            city: String(data.get("city") ?? "").trim() || null,
          });
        }}
      >
        <Input
          name="trader"
          type="search"
          defaultValue={trader}
          placeholder={traderLabel}
          aria-label={traderLabel}
          autoComplete="off"
          className="min-w-[9rem] max-w-[14rem] flex-1"
        />
        <Input
          name="city"
          type="search"
          defaultValue={city}
          placeholder={cityLabel}
          aria-label={cityLabel}
          autoComplete="off"
          className="min-w-[7rem] max-w-[11rem] flex-1"
        />
        <button type="submit" className="rad-btn rad-gh rad-sm" aria-label={searchLabel}>
          <Search width={16} height={16} strokeWidth={1.5} aria-hidden />
          {searchLabel}
        </button>
        {hasFilters ? (
          <button
            type="button"
            className="rad-btn rad-gh rad-sm"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            {clearLabel}
          </button>
        ) : null}
        {typeof resultCount === "number" ? (
          <p
            role="status"
            aria-live="polite"
            className="ms-auto text-sm tabular-nums"
            style={{ color: "var(--rad-tx3)" }}
          >
            <span style={{ color: "var(--rad-tx)", fontWeight: 600 }}>
              {resultCount}
            </span>
            {resultLabel ? <span className="ms-1">{resultLabel}</span> : null}
          </p>
        ) : null}
      </form>
    </div>
  );
}
