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
        "sticky top-20 space-y-3 rounded-[var(--ro-r-lg)] border border-ro-line bg-ro-surface p-4",
        className
      )}
    >
      <h2 className="font-display text-sm font-semibold text-ro-ink">{title}</h2>
      <div className="overflow-hidden rounded-[var(--ro-r-md)] border border-[color-mix(in_srgb,var(--ro-plum-900)_12%,transparent)] bg-[var(--ro-sand-100)]">
        <div className="flex aspect-[4/5] items-center justify-center bg-[linear-gradient(160deg,var(--ro-plum-100),var(--ro-sand-200))] text-xs text-ro-muted">
          {imageHint}
        </div>
        <div className="space-y-1 p-3">
          <p className="font-display text-base font-semibold text-ro-ink">
            {name}
          </p>
          <p className="text-sm tabular-nums text-[var(--ro-plum-900)]">
            {priceLabel}
          </p>
          <p className="text-xs text-ro-muted">{statusLabel}</p>
        </div>
      </div>
    </aside>
  );
}
