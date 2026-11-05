"use client";

import { cn } from "@/lib/utils";

/** CAT-01 — lightweight storefront card preview driven by form field values. */
export function ProductLivePreview({
  title,
  nameAr,
  nameEn,
  priceLabel,
  statusLabel,
  imageHint,
  className,
}: {
  title: string;
  nameAr: string;
  nameEn: string;
  priceLabel: string;
  statusLabel: string;
  imageHint: string;
  className?: string;
}) {
  const name = nameAr.trim() || nameEn.trim() || "—";

  return (
    <aside
      className={cn(
        "ro-catalog-tile sticky top-20 space-y-3 p-4",
        className
      )}
    >
      <h2 className="font-display text-sm font-semibold text-[color:var(--ro-text)]">
        {title}
      </h2>
      <div className="overflow-hidden rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-sunken)]">
        <div className="ro-catalog-tile-media flex aspect-[4/5] items-center justify-center text-xs text-[color:var(--ro-text-muted)]">
          {imageHint}
        </div>
        <div className="space-y-1.5 p-3">
          <p className="font-display text-base font-semibold leading-snug text-[color:var(--ro-text)]">
            {name}
          </p>
          <p className="text-sm font-semibold tabular-nums text-[color:var(--ro-accent-fg,var(--ro-plum-800))]">
            {priceLabel}
          </p>
          <p className="text-xs text-[color:var(--ro-text-muted)]">
            {statusLabel}
          </p>
        </div>
      </div>
    </aside>
  );
}
