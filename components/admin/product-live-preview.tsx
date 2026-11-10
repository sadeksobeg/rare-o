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
  imageSrc,
  className,
}: {
  title: string;
  nameAr: string;
  nameEn: string;
  priceLabel: string;
  statusLabel: string;
  imageHint: string;
  imageSrc?: string | null;
  className?: string;
}) {
  const name = nameAr.trim() || nameEn.trim() || "—";

  return (
    <aside
      className={cn(
        "sticky top-24 self-start rounded-[14px] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface2)] p-4 shadow-[var(--rad-sh,none)]",
        className
      )}
    >
      <h2
        className="text-sm font-semibold"
        style={{ color: "var(--rad-tx)", fontFamily: "var(--rad-font, inherit)" }}
      >
        {title}
      </h2>
      <div className="mt-3 overflow-hidden rounded-[12px] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface3)]">
        <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-[color:var(--rad-surface3)] text-xs text-[color:var(--rad-tx3)]">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="px-3 text-center">{imageHint}</span>
          )}
        </div>
        <div className="space-y-1.5 p-3">
          <p className="font-display text-base font-semibold leading-snug text-[color:var(--rad-tx)]">
            {name}
          </p>
          <p className="text-sm font-semibold tabular-nums text-[color:var(--rad-tx)]">
            <bdi dir="ltr">{priceLabel}</bdi>
          </p>
          <p className="text-xs text-[color:var(--rad-tx3)]">{statusLabel}</p>
        </div>
      </div>
    </aside>
  );
}
