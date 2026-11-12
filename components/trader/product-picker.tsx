"use client";

import { QtyStepper } from "@/components/storefront/qty-stepper";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { Input } from "@/components/ui-kit/field";
import { fmt, type TraderDict } from "@/lib/ui/trader-labels";
import { WHOLESALE_QTY_TECHNICAL_MAX } from "@/lib/wholesale/constants";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { ImageOff, X } from "lucide-react";
import { useMemo, useState } from "react";

export type PickerProduct = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  categorySlug?: string | null;
  categoryNameEn?: string | null;
  categoryNameAr?: string | null;
  imagePath?: string | null;
};

const SINGLE_PREVIEW = 6;

/** T05 — eligible products; QtyStepper; search + category chips; no prices. */
export function ProductPicker({
  products,
  qtyById,
  onQtyChange,
  labels: t,
  locale,
  className,
  variant = "qty",
}: {
  products: PickerProduct[];
  qtyById: Record<string, number>;
  onQtyChange: (productId: string, qty: number) => void;
  labels: TraderDict;
  locale: Locale;
  className?: string;
  /** `single` picks one catalog piece (deal wizard); `qty` is wholesale. */
  variant?: "qty" | "single";
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [qtyErrors, setQtyErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      const slug = p.categorySlug;
      if (!slug) continue;
      const label =
        locale === "ar"
          ? p.categoryNameAr || p.categoryNameEn || slug
          : p.categoryNameEn || p.categoryNameAr || slug;
      map.set(slug, label);
    }
    return [...map.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], locale === "ar" ? "ar" : "en", {
        sensitivity: "base",
      })
    );
  }, [products, locale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.categorySlug !== category) return false;
      if (!q) return true;
      const name =
        locale === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;
      return (
        name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    });
  }, [products, query, category, locale]);

  const selectedId =
    variant === "single"
      ? Object.entries(qtyById).find(([, q]) => q > 0)?.[0] ?? null
      : null;
  const selected = selectedId
    ? products.find((p) => p.id === selectedId) ?? null
    : null;

  function setQty(id: string, next: number) {
    if (variant === "single") {
      // exclusive selection
      for (const pid of Object.keys(qtyById)) {
        if (pid !== id && (qtyById[pid] ?? 0) > 0) onQtyChange(pid, 0);
      }
    }
    if (next > WHOLESALE_QTY_TECHNICAL_MAX) {
      setQtyErrors((prev) => ({
        ...prev,
        [id]: fmt(t.maxQtyPerPiece, { n: WHOLESALE_QTY_TECHNICAL_MAX }),
      }));
      onQtyChange(id, WHOLESALE_QTY_TECHNICAL_MAX);
      return;
    }
    setQtyErrors((prev) => {
      if (!prev[id]) return prev;
      const nextErr = { ...prev };
      delete nextErr[id];
      return nextErr;
    });
    onQtyChange(id, Math.max(0, next));
  }

  if (products.length === 0) {
    return <EmptyState title={t.wsNoProducts} body={t.wsEmptyBody} />;
  }

  const visible =
    variant === "single" && !expanded && !query.trim()
      ? filtered.slice(0, SINGLE_PREVIEW)
      : filtered;
  const hiddenCount =
    variant === "single" && !expanded && !query.trim()
      ? Math.max(0, filtered.length - SINGLE_PREVIEW)
      : 0;

  return (
    <div className={cn("max-w-full space-y-3 overflow-x-clip", className)}>
      {variant === "single" && selected ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[color:var(--rad-bd2)] bg-[color:var(--rad-surface2)] px-3 py-2">
          <Thumb path={selected.imagePath} compact />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[color:var(--rad-tx)]">
            {locale === "ar"
              ? selected.nameAr || selected.nameEn
              : selected.nameEn || selected.nameAr}
          </span>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-[8px] text-[color:var(--rad-tx2)] hover:bg-[color:var(--rad-surface3)]"
            aria-label={t.wsRemovePiece}
            onClick={() => setQty(selected.id, 0)}
          >
            <X className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      ) : null}

      <label className="block max-w-full space-y-1.5 text-sm">
        <span className="sr-only">{t.wsPickerSearch}</span>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.wsPickerSearch}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
      </label>

      {categories.length > 0 ? (
        <div
          role="group"
          aria-label={t.wsPickerAllCategories}
          className="-mx-0 flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Chip
            active={category === "all"}
            onClick={() => setCategory("all")}
            label={t.wsPickerAllCategories}
          />
          {categories.map(([slug, label]) => (
            <Chip
              key={slug}
              active={category === slug}
              onClick={() => setCategory(slug)}
              label={label}
            />
          ))}
        </div>
      ) : null}

      {variant === "single" ? (
        <ul className="max-h-[min(320px,46vh)] space-y-1 overflow-y-auto overscroll-contain rounded-[10px] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface)] p-1.5">
          {visible.map((p) => {
            const name =
              locale === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;
            const on = (qtyById[p.id] ?? 0) > 0;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setQty(p.id, on ? 0 : 1)}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-3 rounded-[8px] px-2 py-2 text-start transition-colors",
                    on
                      ? "bg-[color:var(--rad-acs)] text-[color:var(--rad-ac)]"
                      : "hover:bg-[color:var(--rad-surface2)]"
                  )}
                >
                  <Thumb path={p.imagePath} compact />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {name}
                    </span>
                    {(() => {
                      const cat =
                        locale === "ar"
                          ? p.categoryNameAr || p.categoryNameEn
                          : p.categoryNameEn || p.categoryNameAr;
                      return cat ? (
                        <span className="block truncate text-xs text-[color:var(--rad-tx3)]">
                          {cat}
                        </span>
                      ) : null;
                    })()}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="ro-picker-grid grid w-full max-w-full grid-cols-2 gap-2 overflow-x-hidden md:grid-cols-3 md:gap-3 lg:grid-cols-4">
          {filtered.map((p) => {
            const name =
              locale === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;
            const qty = qtyById[p.id] ?? 0;
            return (
              <li
                key={p.id}
                className="box-border flex min-w-0 w-full max-w-full flex-col gap-2 overflow-hidden rounded-[var(--rad-r-sm,10px)] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface2)] p-2 sm:gap-3 sm:p-3"
              >
                <div className="aspect-square overflow-hidden rounded-[var(--rad-r-sm,10px)] bg-[color:var(--rad-surface3)]">
                  <Thumb path={p.imagePath} fill />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="line-clamp-2 break-words text-sm font-semibold leading-snug">
                    {name}
                  </p>
                </div>
                {qty < 1 ? (
                  <button
                    type="button"
                    onClick={() => setQty(p.id, 1)}
                    className="min-h-11 w-full border border-ro-line text-sm hover:bg-ro-sunken"
                  >
                    {t.wsAddPiece}
                  </button>
                ) : (
                  <div className="space-y-1">
                    <QtyStepper
                      value={qty}
                      onChange={(n) => setQty(p.id, n)}
                      min={1}
                      max={WHOLESALE_QTY_TECHNICAL_MAX}
                      label={fmt(t.wsQtyFor, { name })}
                      increaseLabel={t.wsQtyIncrease}
                      decreaseLabel={t.wsQtyDecrease}
                      className="w-full justify-between"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(p.id, 0)}
                      className="text-xs text-ro-muted underline-offset-2 hover:underline"
                    >
                      {t.wsRemovePiece}
                    </button>
                    {qtyErrors[p.id] ? (
                      <p
                        className="text-xs text-[var(--ro-danger-700)]"
                        role="alert"
                      >
                        {qtyErrors[p.id]}
                      </p>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hiddenCount > 0 ? (
        <button
          type="button"
          className="text-sm font-semibold text-[color:var(--rad-ac)] hover:underline"
          onClick={() => setExpanded(true)}
        >
          {locale === "ar"
            ? `عرض المزيد (${hiddenCount})`
            : `Show more (${hiddenCount})`}
        </button>
      ) : null}
    </div>
  );
}

function Thumb({
  path,
  compact,
  fill,
}: {
  path?: string | null;
  compact?: boolean;
  fill?: boolean;
}) {
  if (path) {
    // eslint-disable-next-line @next/next/no-img-element -- upload paths vary
    return (
      <img
        src={path}
        alt=""
        className={cn(
          "object-cover",
          compact
            ? "size-10 shrink-0 rounded-[8px]"
            : fill
              ? "size-full"
              : "size-12 rounded-[8px]"
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center bg-[color:var(--rad-surface3)] text-[color:var(--rad-tx3)]",
        compact
          ? "size-10 shrink-0 rounded-[8px]"
          : fill
            ? "size-full"
            : "size-12 rounded-[8px]"
      )}
      aria-hidden
    >
      <ImageOff className={compact || fill ? "size-4" : "size-5"} strokeWidth={1.5} />
    </span>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 border px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "border-[var(--ro-plum-900)] bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]"
          : "border-ro-line text-ro-muted hover:bg-ro-sunken"
      )}
    >
      {label}
    </button>
  );
}
