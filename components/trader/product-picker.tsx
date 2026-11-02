"use client";

import { QtyStepper } from "@/components/storefront/qty-stepper";
import { EmptyState } from "@/components/ui/empty-state";
import { fmt, type TraderDict } from "@/lib/ui/trader-labels";
import { WHOLESALE_QTY_TECHNICAL_MAX } from "@/lib/wholesale/constants";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
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

/** T05 — eligible products grid; QtyStepper; search + category chips; no prices. */
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
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
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

  function setQty(id: string, next: number) {
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
      const next = { ...prev };
      delete next[id];
      return next;
    });
    onQtyChange(id, Math.max(0, next));
  }

  if (products.length === 0) {
    return (
      <EmptyState title={t.wsNoProducts} body={t.wsEmptyBody} />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <label className="block space-y-1.5 text-sm">
        <span className="sr-only">{t.wsPickerSearch}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.wsPickerSearch}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          className="min-h-11 w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 py-2 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
        />
      </label>

      {categories.length > 0 ? (
        <div
          role="group"
          aria-label={t.wsPickerAllCategories}
          className="flex gap-2 overflow-x-auto pb-1"
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

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => {
          const name =
            locale === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;
          const qty = qtyById[p.id] ?? 0;
          return (
            <li
              key={p.id}
              className="flex flex-col gap-3 border border-ro-line bg-ro-surface p-3"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-[var(--ro-r-sm)] bg-[var(--ro-sand-200)]">
                {p.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element -- upload paths vary; avoid next/image remote config
                  <img
                    src={p.imagePath}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-ro-muted">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold leading-snug">{name}</p>
                {(() => {
                  const cat =
                    locale === "ar"
                      ? p.categoryNameAr || p.categoryNameEn
                      : p.categoryNameEn || p.categoryNameAr;
                  return cat ? (
                    <p className="truncate text-xs text-ro-muted">{cat}</p>
                  ) : null;
                })()}
              </div>
              {qty < 1 ? (
                <button
                  type="button"
                  onClick={() => setQty(p.id, 1)}
                  className="min-h-11 w-full border border-ro-line text-sm hover:bg-ro-sunken"
                >
                  {t.wsAddPiece}
                </button>
              ) : variant === "single" ? (
                <button
                  type="button"
                  onClick={() => setQty(p.id, 0)}
                  className="min-h-11 w-full border border-[var(--ro-plum-900)] bg-[var(--ro-plum-100)] text-sm font-semibold text-[var(--ro-plum-900)]"
                >
                  {t.wsRemovePiece}
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
                    <p className="text-xs text-[var(--ro-danger-700)]" role="alert">
                      {qtyErrors[p.id]}
                    </p>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
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
