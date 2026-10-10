"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MaterialField } from "@/components/storefront/material-field";
import { cn, localizedName } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export type ProductCardData = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  retailPrice: { toString(): string } | number | string;
  currency: string;
  imagePath?: string | null;
  categoryLabel?: string;
  availability?: string;
};

export function ProductCard({
  product,
  locale,
  viewLabel,
  availableLabel,
  unavailableLabel,
  className,
  aspect = "portrait",
  tone = "dark",
}: {
  product: ProductCardData;
  locale: Locale;
  viewLabel: string;
  availableLabel?: string;
  unavailableLabel?: string;
  className?: string;
  aspect?: "portrait" | "square" | "landscape";
  tone?: "dark" | "cream" | "purple";
}) {
  const name = localizedName(locale, product.nameAr, product.nameEn, product.slug);
  const price = Number(product.retailPrice).toLocaleString(locale);
  const available = product.availability !== "unavailable";
  const aspectClass =
    aspect === "landscape"
      ? "aspect-[16/10]"
      : aspect === "square"
        ? "aspect-square"
        : "aspect-[4/5]";

  return (
    <article className={cn("group", className)}>
      <Link href={`/product/${product.slug}`} className="block space-y-4">
        <MaterialField
          src={product.imagePath}
          alt={name}
          tone={tone}
          className={cn(aspectClass, "ro-hairline-dark")}
        />
        <div className="space-y-2">
          {product.categoryLabel ? (
            <p className="text-[0.65rem] tracking-[0.24em] text-ro-muted uppercase">
              {product.categoryLabel}
            </p>
          ) : null}
          <h3 className="font-display text-xl tracking-wide text-ro-black transition-colors duration-300 group-hover:text-ro-purple md:text-2xl">
            {name}
          </h3>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-ro-muted">
            <span>
              {price} {product.currency}
            </span>
            {availableLabel || unavailableLabel ? (
              <span className="text-[0.65rem] tracking-[0.16em] uppercase">
                {available ? availableLabel : unavailableLabel}
              </span>
            ) : null}
          </div>
          <p className="ro-hover-shift pt-1 text-[0.65rem] tracking-[0.2em] text-ro-purple uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {viewLabel}
          </p>
        </div>
      </Link>
    </article>
  );
}

export function FeaturedProductLead({
  product,
  locale,
  viewLabel,
  availableLabel,
  unavailableLabel,
  eyebrow,
  className,
}: {
  product: ProductCardData;
  locale: Locale;
  viewLabel: string;
  availableLabel?: string;
  unavailableLabel?: string;
  eyebrow?: string;
  className?: string;
}) {
  const name = localizedName(locale, product.nameAr, product.nameEn, product.slug);
  const price = Number(product.retailPrice).toLocaleString(locale);
  const available = product.availability !== "unavailable";
  const mediaRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });

  const onMove = (e: React.MouseEvent) => {
    const el = mediaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
    });
  };

  return (
    <article className={cn("group", className)}>
      <Link
        href={`/product/${product.slug}`}
        className="grid items-stretch gap-0 lg:grid-cols-12"
      >
        <div
          ref={mediaRef}
          className="relative min-h-[380px] overflow-hidden lg:col-span-8 lg:min-h-[560px]"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => {
            setHover(false);
            setPos({ x: 0.5, y: 0.5 });
          }}
          onMouseMove={onMove}
        >
          <div
            className="absolute inset-[-5%] transition-transform duration-500 ease-out will-change-transform"
            style={{
              transform: `translate3d(${(pos.x - 0.5) * -2.5}%, ${(pos.y - 0.5) * -2.5}%, 0)`,
            }}
          >
            <MaterialField
              src={product.imagePath}
              alt={name}
              tone="dark"
              className="absolute inset-0"
            />
          </div>

          {/* Desktop floating VIEW label — not a custom cursor */}
          <span
            className={cn(
              "pointer-events-none absolute z-20 hidden border border-ro-line-on-dark bg-ro-black/70 px-3 py-1.5 text-[0.6rem] tracking-[0.28em] text-ro-cream uppercase backdrop-blur-sm transition-opacity duration-300 lg:block",
              hover ? "opacity-100" : "opacity-0"
            )}
            style={{
              left: `calc(${pos.x * 100}% + 16px)`,
              top: `calc(${pos.y * 100}% + 16px)`,
            }}
          >
            {viewLabel}
          </span>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ro-black/70 to-transparent p-6 md:p-8 lg:hidden">
            <p className="font-display text-2xl text-ro-cream">{name}</p>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col justify-end gap-6 border border-ro-line border-t-0 bg-ro-cream p-7 transition-[opacity,transform] duration-500 md:p-10 lg:col-span-4 lg:border-s-0 lg:border-t lg:border-e",
            hover && "lg:translate-y-0"
          )}
        >
          {eyebrow ? (
            <p className="text-[0.65rem] tracking-[0.32em] text-ro-purple uppercase">
              {eyebrow}
            </p>
          ) : null}
          {product.categoryLabel ? (
            <p className="text-[0.65rem] tracking-[0.22em] text-ro-muted uppercase opacity-80 transition-opacity duration-300 group-hover:opacity-100">
              {product.categoryLabel}
            </p>
          ) : null}
          <h3 className="font-display text-3xl tracking-wide text-ro-black transition-colors duration-300 group-hover:text-ro-purple md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            {name}
          </h3>
          <div className="space-y-2 border-t border-ro-line pt-5">
            <p className="text-base text-ro-muted md:text-lg">
              {price} {product.currency}
            </p>
            {(availableLabel || unavailableLabel) && (
              <p className="text-[0.65rem] tracking-[0.16em] text-ro-muted uppercase">
                {available ? availableLabel : unavailableLabel}
              </p>
            )}
          </div>
          <p className="text-[0.7rem] tracking-[0.22em] text-ro-purple uppercase">
            {viewLabel}
          </p>
        </div>
      </Link>
    </article>
  );
}
