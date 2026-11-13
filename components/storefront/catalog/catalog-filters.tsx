"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet } from "@/components/ui/dialog";
import type { CatalogSort } from "@/lib/catalog/constants";
import type { CatalogBadge } from "@/lib/catalog/badges";
import type { Locale } from "@/lib/i18n/config";
import { formatNumber } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

export type FacetCategory = { slug: string; name: string; count: number };

export type CatalogFilterValues = {
  type?: string;
  min?: number;
  max?: number;
  sort: CatalogSort;
  q?: string;
  availableOnly: boolean;
  badges: CatalogBadge[];
};

type Props = {
  locale: Locale;
  basePath: string;
  categories: FacetCategory[];
  current: CatalogFilterValues;
  bounds: { min: number; max: number } | null;
  availableCount: number;
  badgeCounts: Record<CatalogBadge, number>;
  total: number;
};

const L = (locale: Locale, ar: string, en: string) => (locale === "ar" ? ar : en);

const BADGE_LABEL: Record<CatalogBadge, [string, string]> = {
  new: ["جديد", "New"],
  featured: ["مميّز", "Featured"],
  sale: ["تخفيض", "On sale"],
};

const inputClass =
  "h-11 w-full rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper px-3 text-sm tabular-nums text-ro-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]";

export const SORT_OPTIONS: { value: CatalogSort; ar: string; en: string }[] = [
  { value: "new", ar: "الأحدث", en: "Newest" },
  { value: "price-asc", ar: "السعر: من الأقل", en: "Price: low to high" },
  { value: "price-desc", ar: "السعر: من الأعلى", en: "Price: high to low" },
];

/**
 * Faceted catalog filters. State lives in the URL; every change replaces the
 * history entry without scrolling. Desktop: sticky sidebar. Mobile: sheet.
 */
export function CatalogFilters(props: Props) {
  const { locale, basePath, current, total } = props;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const navigate = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("category");
    next.delete("limit");
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath || pathname, {
      scroll: false,
    });
  };

  const activeCount =
    (current.type ? 1 : 0) +
    (current.min != null || current.max != null ? 1 : 0) +
    (current.q ? 1 : 0) +
    (current.availableOnly ? 1 : 0) +
    current.badges.length;

  const resultsLabel = L(
    locale,
    `عرض ${formatNumber(total, locale)} قطعة`,
    `Show ${formatNumber(total, locale)} pieces`
  );

  return (
    <div>
      {/* mobile trigger */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[var(--ro-r-sm)] border border-ro-ink px-4 text-sm font-semibold text-ro-ink"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {L(locale, "تصفية", "Filters")}
          {activeCount > 0 ? (
            <span className="rounded-full bg-ro-ink px-1.5 text-[11px] tabular-nums text-ro-canvas">
              {formatNumber(activeCount, locale)}
            </span>
          ) : null}
        </button>
        <SortSelect
          locale={locale}
          value={current.sort}
          onChange={(v) => navigate({ sort: v === "new" ? null : v })}
          className="flex-1"
        />
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={L(locale, "تصفية", "Filters")}
        size="md"
      >
        <div className="max-h-[68vh] space-y-6 overflow-y-auto pb-1">
          <Facets {...props} navigate={navigate} idPrefix="m" />
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 h-12 w-full rounded-[var(--ro-r-sm)] bg-ro-ink text-sm font-semibold text-ro-canvas"
        >
          {resultsLabel}
        </button>
      </Sheet>

      {/* desktop sidebar */}
      <aside
        aria-label={L(locale, "تصفية الكتالوج", "Catalog filters")}
        className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pe-2 [scrollbar-width:thin]"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ro-ink">
            {L(locale, "تصفية", "Filters")}
          </h2>
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={() =>
                navigate({
                  type: null,
                  min: null,
                  max: null,
                  q: null,
                  avail: null,
                  flags: null,
                })
              }
              className="text-xs font-medium text-ro-plum underline underline-offset-4"
            >
              {L(locale, "مسح الكل", "Clear all")}
            </button>
          ) : null}
        </div>
        <div className="space-y-7">
          <Facets {...props} navigate={navigate} idPrefix="d" />
        </div>
      </aside>
    </div>
  );
}

function Facets({
  locale,
  categories,
  current,
  bounds,
  availableCount,
  badgeCounts,
  navigate,
  idPrefix,
}: Props & {
  navigate: (patch: Record<string, string | null>) => void;
  idPrefix: string;
}) {
  const [q, setQ] = useState(current.q ?? "");
  useEffect(() => setQ(current.q ?? ""), [current.q]);

  const toggleBadge = (b: CatalogBadge) => {
    const set = new Set(current.badges);
    if (set.has(b)) set.delete(b);
    else set.add(b);
    navigate({ flags: set.size ? [...set].join(",") : null });
  };

  return (
    <>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ q: q.trim() || null });
        }}
      >
        <label htmlFor={`${idPrefix}-q`} className="sr-only">
          {L(locale, "بحث في الكتالوج", "Search the catalog")}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-ro-muted"
            aria-hidden
          />
          <input
            id={`${idPrefix}-q`}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={L(locale, "ابحث عن عود…", "Search ouds…")}
            className={cn(inputClass, "ps-9")}
          />
        </div>
      </form>

      <FacetGroup title={L(locale, "الفئة", "Category")}>
        <ul className="space-y-0.5">
          <CategoryRow
            active={!current.type}
            label={L(locale, "كل الفئات", "All categories")}
            onClick={() => navigate({ type: null })}
          />
          {categories.map((c) => (
            <CategoryRow
              key={c.slug}
              active={current.type === c.slug}
              label={c.name}
              count={c.count}
              locale={locale}
              disabled={c.count === 0 && current.type !== c.slug}
              onClick={() => navigate({ type: c.slug })}
            />
          ))}
        </ul>
      </FacetGroup>

      {bounds && bounds.max > bounds.min ? (
        <FacetGroup title={L(locale, "السعر (US$)", "Price (US$)")}>
          <PriceRange
            locale={locale}
            bounds={bounds}
            min={current.min}
            max={current.max}
            idPrefix={idPrefix}
            onCommit={(min, max) =>
              navigate({
                min: min != null && min > bounds.min ? String(min) : null,
                max: max != null && max < bounds.max ? String(max) : null,
              })
            }
          />
        </FacetGroup>
      ) : null}

      <FacetGroup title={L(locale, "التوفّر", "Availability")}>
        <CheckRow
          checked={current.availableOnly}
          label={L(locale, "المتوفر الآن فقط", "Available now")}
          count={availableCount}
          locale={locale}
          onChange={() => navigate({ avail: current.availableOnly ? null : "1" })}
        />
      </FacetGroup>

      <FacetGroup title={L(locale, "الوسوم", "Highlights")}>
        {(Object.keys(BADGE_LABEL) as CatalogBadge[]).map((b) => (
          <CheckRow
            key={b}
            checked={current.badges.includes(b)}
            label={L(locale, BADGE_LABEL[b][0], BADGE_LABEL[b][1])}
            count={badgeCounts[b]}
            locale={locale}
            disabled={badgeCounts[b] === 0 && !current.badges.includes(b)}
            onChange={() => toggleBadge(b)}
          />
        ))}
      </FacetGroup>
    </>
  );
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 space-y-2.5 border-0 p-0">
      <legend className="mb-1 text-[13px] font-semibold text-ro-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

function CategoryRow({
  label,
  count,
  active,
  disabled,
  onClick,
  locale,
}: {
  label: string;
  count?: number;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  locale?: Locale;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--ro-r-sm)] px-3 text-start text-sm transition-colors",
          active
            ? "bg-ro-ink font-semibold text-ro-canvas"
            : "text-ro-text-2 hover:bg-ro-sunken",
          disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
        )}
      >
        <span className="truncate">{label}</span>
        {count != null && locale ? (
          <span className={cn("text-xs tabular-nums", active ? "text-ro-canvas/80" : "text-ro-muted")}>
            {formatNumber(count, locale)}
          </span>
        ) : null}
      </button>
    </li>
  );
}

function CheckRow({
  checked,
  label,
  count,
  locale,
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  count: number;
  locale: Locale;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--ro-r-sm)] px-1 text-sm text-ro-text-2",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="size-5 shrink-0 accent-[var(--ro-plum-900)]"
      />
      <span className="flex-1">{label}</span>
      <span className="text-xs tabular-nums text-ro-muted">{formatNumber(count, locale)}</span>
    </label>
  );
}

/** Two native range inputs over one track; commits on release / blur. */
function PriceRange({
  locale,
  bounds,
  min,
  max,
  idPrefix,
  onCommit,
}: {
  locale: Locale;
  bounds: { min: number; max: number };
  min?: number;
  max?: number;
  idPrefix: string;
  onCommit: (min: number | null, max: number | null) => void;
}) {
  const [lo, setLo] = useState(min ?? bounds.min);
  const [hi, setHi] = useState(max ?? bounds.max);
  useEffect(() => setLo(min ?? bounds.min), [min, bounds.min]);
  useEffect(() => setHi(max ?? bounds.max), [max, bounds.max]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const span = Math.max(1, bounds.max - bounds.min);
  const pct = (v: number) => ((v - bounds.min) / span) * 100;
  const step = useMemo(() => (span > 5000 ? 50 : span > 500 ? 10 : 1), [span]);

  const commit = (a: number, b: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onCommit(a, b), 280);
  };
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const clamp = (v: number) => Math.min(bounds.max, Math.max(bounds.min, v));

  return (
    <div className="space-y-3" dir="ltr">
      <div className="relative h-8">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ro-border" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--ro-plum-900)]"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          aria-label={L(locale, "السعر الأدنى", "Minimum price")}
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={lo}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), hi);
            setLo(v);
            commit(v, hi);
          }}
          className="ro-range"
        />
        <input
          type="range"
          aria-label={L(locale, "السعر الأعلى", "Maximum price")}
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={hi}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), lo);
            setHi(v);
            commit(lo, v);
          }}
          className="ro-range"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-[11px] text-ro-muted">
          <span>{L(locale, "من", "From")}</span>
          <input
            id={`${idPrefix}-min`}
            type="number"
            inputMode="numeric"
            value={lo}
            min={bounds.min}
            max={hi}
            onChange={(e) => setLo(clamp(Number(e.target.value) || bounds.min))}
            onBlur={() => onCommit(lo, hi)}
            className={inputClass}
          />
        </label>
        <label className="space-y-1 text-[11px] text-ro-muted">
          <span>{L(locale, "إلى", "To")}</span>
          <input
            id={`${idPrefix}-max`}
            type="number"
            inputMode="numeric"
            value={hi}
            min={lo}
            max={bounds.max}
            onChange={(e) => setHi(clamp(Number(e.target.value) || bounds.max))}
            onBlur={() => onCommit(lo, hi)}
            className={inputClass}
          />
        </label>
      </div>
    </div>
  );
}

export function SortSelect({
  locale,
  value,
  onChange,
  className,
}: {
  locale: Locale;
  value: CatalogSort;
  onChange: (v: CatalogSort) => void;
  className?: string;
}) {
  return (
    <label className={cn("flex items-center gap-2 text-sm text-ro-muted", className)}>
      <span className="sr-only sm:not-sr-only">{L(locale, "الترتيب", "Sort")}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as CatalogSort)}
        className={cn(inputClass, "w-full min-w-40 sm:w-auto")}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {L(locale, o.ar, o.en)}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Active filter chips + desktop sort, rendered above the grid. */
export function CatalogToolbar({
  locale,
  basePath,
  categories,
  current,
  total,
}: {
  locale: Locale;
  basePath: string;
  categories: FacetCategory[];
  current: CatalogFilterValues;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("limit");
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  const chips: { key: string; label: string; clear: Record<string, string | null> }[] = [];
  const typeName = categories.find((c) => c.slug === current.type)?.name;
  if (current.type && typeName) chips.push({ key: "type", label: typeName, clear: { type: null } });
  if (current.min != null)
    chips.push({
      key: "min",
      label: L(locale, `من ${formatNumber(current.min, locale)} US$`, `From US$ ${formatNumber(current.min, locale)}`),
      clear: { min: null },
    });
  if (current.max != null)
    chips.push({
      key: "max",
      label: L(locale, `حتى ${formatNumber(current.max, locale)} US$`, `Up to US$ ${formatNumber(current.max, locale)}`),
      clear: { max: null },
    });
  if (current.availableOnly)
    chips.push({ key: "avail", label: L(locale, "المتوفر الآن", "Available now"), clear: { avail: null } });
  for (const b of current.badges)
    chips.push({
      key: `b-${b}`,
      label: L(locale, BADGE_LABEL[b][0], BADGE_LABEL[b][1]),
      clear: {
        flags: current.badges.filter((x) => x !== b).join(",") || null,
      },
    });
  if (current.q) chips.push({ key: "q", label: `“${current.q}”`, clear: { q: null } });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ro-muted" role="status" aria-live="polite">
          {L(
            locale,
            `${formatNumber(total, locale)} قطعة`,
            `${formatNumber(total, locale)} pieces`
          )}
        </p>
        <SortSelect
          locale={locale}
          value={current.sort}
          onChange={(v) => navigate({ sort: v === "new" ? null : v })}
          className="hidden lg:flex"
        />
      </div>
      {chips.length > 0 ? (
        <ul
          aria-label={L(locale, "عوامل التصفية المفعّلة", "Active filters")}
          className="flex flex-wrap items-center gap-2"
        >
          {chips.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => navigate(c.clear)}
                aria-label={L(locale, `إزالة ${c.label}`, `Remove ${c.label}`)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--ro-plum-100)] px-3.5 text-xs font-medium text-[var(--ro-plum-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ro-focus)]"
              >
                {c.label}
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
