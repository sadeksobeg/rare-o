"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
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
        "sticky top-0 z-20 space-y-3 rounded-[14px] border border-[color:var(--ro-border-subtle)] bg-[color:color-mix(in_srgb,var(--ro-bg-raised)_92%,transparent)] p-3 shadow-[var(--ro-e2)] backdrop-blur-md sm:p-3.5",
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
      <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-[color:var(--ro-text-muted)]">
        <span>{label}</span>
        <span className="relative block">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--ro-text-muted)]"
            strokeWidth={1.5}
            aria-hidden
          />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder={placeholder}
            className="h-11 w-full rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-sunken)] pe-3 ps-10 text-sm text-[color:var(--ro-text)] outline-none placeholder:text-[color:var(--ro-text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
          />
        </span>
      </label>
      <button
        type="submit"
        className="h-11 rounded-[12px] border border-[color:var(--ro-border)] bg-[color:var(--ro-panel)] px-4 text-sm font-semibold text-[color:var(--ro-text)] transition-[background-color,border-color] hover:bg-[color:var(--ro-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
      >
        {label}
      </button>
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
