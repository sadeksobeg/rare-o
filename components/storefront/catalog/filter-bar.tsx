"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Sheet } from "@/components/ui/dialog";
import { CATALOG_SORTS, type CatalogSort } from "@/lib/catalog/constants";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatNumber } from "@/lib/i18n/format";
import { plural } from "@/lib/i18n/plural";
import { cn } from "@/lib/utils";

export type FilterBarCategory = { slug: string; name: string };

export type FilterBarValues = {
  type?: string;
  min?: number;
  max?: number;
  sort: CatalogSort;
  q?: string;
};

const controlClass =
  "h-11 rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper px-3.5 text-sm text-ro-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-[border-color,box-shadow] duration-200 hover:border-[color-mix(in_srgb,var(--ro-plum-700)_35%,var(--ro-border))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]";

const sortLabelKey: Record<
  CatalogSort,
  "sortNew" | "sortPriceAsc" | "sortPriceDesc"
> = {
  new: "sortNew",
  "price-asc": "sortPriceAsc",
  "price-desc": "sortPriceDesc",
};

/**
 * S08 — sticky filter bar (desktop) / bottom Sheet (mobile).
 * State lives in the URL; changes use `router.replace(..., { scroll: false })`.
 */
export function FilterBar({
  locale,
  labels,
  piecesLabel,
  categories,
  current,
  total,
  basePath,
}: {
  locale: Locale;
  labels: Dictionary["catalog"];
  piecesLabel: string;
  categories: FilterBarCategory[];
  current: FilterBarValues;
  total: number;
  basePath: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const navigate = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("category");
    next.delete("limit");
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${basePath}?${qs}` : basePath || pathname, {
        scroll: false,
      });
    });
  };

  const typeName = categories.find((c) => c.slug === current.type)?.name;
  const fmt = (n: number) => formatNumber(n, locale);

  const chips: { key: string; label: string; clear: Record<string, null> }[] =
    [];
  if (current.type && typeName) {
    chips.push({ key: "type", label: typeName, clear: { type: null } });
  }
  if (current.min != null) {
    chips.push({
      key: "min",
      label: labels.priceFrom.replace("{value}", fmt(current.min)),
      clear: { min: null },
    });
  }
  if (current.max != null) {
    chips.push({
      key: "max",
      label: labels.priceTo.replace("{value}", fmt(current.max)),
      clear: { max: null },
    });
  }
  if (current.q) {
    chips.push({ key: "q", label: `“${current.q}”`, clear: { q: null } });
  }

  const clearAll = () =>
    navigate({ type: null, min: null, max: null, q: null, sort: null });

  const formKey = `${current.min ?? ""}|${current.max ?? ""}|${current.q ?? ""}`;

  const showResultsLabel = plural(total, locale, labels.showResultsForms);

  const fields = (
    <FilterFields
      formKey={formKey}
      labels={labels}
      categories={categories}
      current={current}
      showResultsLabel={showResultsLabel}
      navigate={navigate}
      onApplied={() => setOpen(false)}
      showMobileApply
      stacked
    />
  );

  return (
    <div
      className="sticky top-[65px] z-30 -mx-4 border-b border-ro-border bg-ro-canvas/95 px-4 py-4 shadow-[0_10px_30px_-24px_rgba(11,8,13,0.35)] backdrop-blur-md"
      aria-busy={pending || undefined}
    >
      <p role="status" aria-live="polite" className="sr-only">
        {labels.resultsUpdated.replace("{n}", fmt(total))}
      </p>

      <div className="flex items-center justify-between gap-3 md:hidden">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-[var(--ro-r-sm)] border border-ro-ink px-4 text-sm font-semibold text-ro-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {labels.filtersTitle}
          {chips.length > 0 ? (
            <span className="tabular-nums text-ro-plum">
              ({fmt(chips.length)})
            </span>
          ) : null}
        </button>
        <span className="text-sm text-ro-muted tabular-nums">
          {fmt(total)} {piecesLabel}
        </span>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={labels.filtersTitle}
        size="md"
      >
        <div className="max-h-[70vh] space-y-4 overflow-y-auto">{fields}</div>
      </Sheet>

      <div className="hidden md:block">
        <FilterFields
          formKey={formKey}
          labels={labels}
          categories={categories}
          current={current}
          showResultsLabel={showResultsLabel}
          navigate={navigate}
          showMobileApply={false}
          stacked={false}
        />
      </div>

      {chips.length > 0 ? (
        <ul
          aria-label={labels.activeFilters}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                aria-label={labels.removeFilter.replace("{label}", chip.label)}
                onClick={() => navigate(chip.clear)}
                className="inline-flex h-8 items-center gap-1.5 rounded-[var(--ro-r-full)] bg-[var(--ro-plum-100)] px-3 text-xs font-medium text-[var(--ro-plum-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
              >
                {chip.label}
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={clearAll}
              className="h-8 px-2 text-xs font-semibold text-ro-text-2 underline underline-offset-4 hover:text-ro-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ro-focus)]"
            >
              {labels.clearAll}
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

function FilterFields({
  formKey,
  labels,
  categories,
  current,
  showResultsLabel,
  navigate,
  onApplied,
  showMobileApply,
  stacked,
}: {
  formKey: string;
  labels: Dictionary["catalog"];
  categories: FilterBarCategory[];
  current: FilterBarValues;
  showResultsLabel: string;
  navigate: (patch: Record<string, string | null>) => void;
  onApplied?: () => void;
  showMobileApply: boolean;
  /** Mobile sheet: single column. Desktop: two rows. */
  stacked: boolean;
}) {
  const typeRow = (
    <div
      role="group"
      aria-label={labels.typeLabel}
      className="flex flex-wrap items-center gap-2"
    >
      <TypeChip active={!current.type} onClick={() => navigate({ type: null })}>
        {labels.allCategories}
      </TypeChip>
      {categories.map((c) => (
        <TypeChip
          key={c.slug}
          active={current.type === c.slug}
          onClick={() => navigate({ type: c.slug })}
        >
          {c.name}
        </TypeChip>
      ))}
    </div>
  );

  const priceSearchRow = (
    <form
      key={formKey}
      className={cn(
        "flex flex-wrap items-end gap-3",
        !stacked && "w-full border-t border-ro-border pt-3"
      )}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const val = (name: string) => String(data.get(name) ?? "").trim();
        navigate({
          q: val("q") || null,
          min: val("min") || null,
          max: val("max") || null,
        });
        onApplied?.();
      }}
    >
      <fieldset className="flex flex-wrap items-end gap-2">
        <legend className="sr-only">{labels.priceLabel}</legend>
        <label className="flex flex-col gap-1 text-xs text-ro-muted">
          <span>
            {labels.priceLabel} · {labels.priceMin}
          </span>
          <span className="relative inline-flex">
            <input
              name="min"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              dir="ltr"
              placeholder="0"
              aria-describedby="ro-catalog-currency-hint"
              defaultValue={current.min ?? ""}
              className={cn(controlClass, "w-32 pe-14 text-start")}
            />
            <span
              className="pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-[10px] font-semibold tracking-wide text-ro-muted"
              aria-hidden
            >
              {labels.priceCurrencyShort}
            </span>
          </span>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ro-muted">
          <span>{labels.priceMax}</span>
          <span className="relative inline-flex">
            <input
              name="max"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              dir="ltr"
              placeholder="—"
              aria-describedby="ro-catalog-currency-hint"
              defaultValue={current.max ?? ""}
              className={cn(controlClass, "w-32 pe-14 text-start")}
            />
            <span
              className="pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-[10px] font-semibold tracking-wide text-ro-muted"
              aria-hidden
            >
              {labels.priceCurrencyShort}
            </span>
          </span>
        </label>
        <p
          id="ro-catalog-currency-hint"
          className="basis-full text-[11px] leading-snug text-ro-muted md:basis-auto md:max-w-[14rem] md:self-center"
        >
          {labels.priceCurrencyHint}
        </p>
      </fieldset>

      <label className="flex flex-col gap-1 text-xs text-ro-muted">
        <span>{labels.searchLabel}</span>
        <input
          name="q"
          type="search"
          defaultValue={current.q ?? ""}
          placeholder={labels.search}
          className={cn(controlClass, "w-full md:w-52")}
        />
      </label>

      <button
        type="submit"
        className="h-11 rounded-[var(--ro-r-sm)] border border-ro-ink px-4 text-sm font-semibold text-ro-ink transition-colors duration-[var(--ro-dur-fast)] hover:bg-ro-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
      >
        {labels.priceApply}
      </button>

      <label className="flex flex-col gap-1 text-xs text-ro-muted md:ms-auto">
        <span>{labels.sortLabel}</span>
        <select
          value={current.sort}
          onChange={(e) =>
            navigate({
              sort: e.target.value === "new" ? null : e.target.value,
            })
          }
          className={cn(controlClass, "md:w-56")}
        >
          {CATALOG_SORTS.map((s) => (
            <option key={s} value={s}>
              {labels[sortLabelKey[s]]}
            </option>
          ))}
        </select>
      </label>
    </form>
  );

  return (
    <div className={cn("flex flex-col gap-3", stacked && "gap-4")}>
      {typeRow}
      {priceSearchRow}
      {showMobileApply ? (
        <button
          type="button"
          onClick={() => onApplied?.()}
          className="h-12 w-full rounded-[var(--ro-r-sm)] bg-ro-ink px-6 text-sm font-semibold text-ro-canvas"
        >
          {showResultsLabel}
        </button>
      ) : null}
    </div>
  );
}

function TypeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-11 rounded-[var(--ro-r-full)] border px-4 text-sm transition-colors duration-[var(--ro-dur-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
        active
          ? "border-ro-ink bg-ro-ink font-semibold text-ro-canvas"
          : "border-[var(--ro-border-control)] text-ro-text-2 hover:border-ro-ink hover:text-ro-ink"
      )}
    >
      {children}
    </button>
  );
}
