"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListFilterTabs, type ListFilterTab } from "@/components/ui/list-filter-tabs";
import { cn } from "@/lib/utils";

/**
 * Admin list chrome: status/attention tabs + search (URL `tab` + `q`).
 * Sticky under the page header; optional result count next to search.
 */
export function AdminTableFilters({
  tabs,
  tabsLabel,
  searchPlaceholder,
  searchLabel,
  resultCount,
  resultLabel,
  className,
}: {
  tabs: readonly ListFilterTab[];
  tabsLabel: string;
  searchPlaceholder: string;
  searchLabel: string;
  /** Rows matching the current filters. */
  resultCount?: number;
  /** Noun shown after the count (e.g. "results"). */
  resultLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 space-y-3 border-b border-ro-line bg-ro-surface/95 py-3 backdrop-blur",
        className
      )}
    >
      <Suspense fallback={null}>
        <ListFilterTabs tabs={tabs} label={tabsLabel} />
      </Suspense>
      <Suspense fallback={null}>
        <AdminSearchField
          placeholder={searchPlaceholder}
          label={searchLabel}
          resultCount={resultCount}
          resultLabel={resultLabel}
        />
      </Suspense>
    </div>
  );
}

export const FilterToolbar = AdminTableFilters;

function AdminSearchField({
  placeholder,
  label,
  resultCount,
  resultLabel,
}: {
  placeholder: string;
  label: string;
  resultCount?: number;
  resultLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const next = new URLSearchParams(searchParams.toString());
        const value = String(data.get("q") ?? "").trim();
        if (value) next.set("q", value);
        else next.delete("q");
        next.delete("page");
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }}
    >
      <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-ro-muted">
        <span>{label}</span>
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder={placeholder}
          className="h-11 rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 text-sm text-ro-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
        />
      </label>
      <button
        type="submit"
        className="h-11 rounded-[var(--ro-r-sm)] border border-ro-ink px-4 text-sm font-semibold text-ro-ink hover:bg-ro-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
      >
        {label}
      </button>
      {typeof resultCount === "number" ? (
        <p
          role="status"
          aria-live="polite"
          className="flex h-11 items-center text-sm tabular-nums text-ro-muted"
        >
          <span className="font-semibold text-ro-ink">{resultCount}</span>
          {resultLabel ? <span className="ms-1">{resultLabel}</span> : null}
        </p>
      ) : null}
    </form>
  );
}
