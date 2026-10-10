"use client";

import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageProduct } from "@/lib/catalog/homepage";
import { MaterialField } from "@/components/storefront/material-field";
import { cn, localizedName } from "@/lib/utils";
import { useDiscovery } from "./discovery-context";

export function MosaicTile({
  product,
  dict,
  locale,
  size = "md",
}: {
  product: HomepageProduct;
  dict: Dictionary;
  locale: Locale;
  size?: "lg" | "md" | "sm";
}) {
  const { openQuickView, toggleCompare, compareIds } = useDiscovery();
  const name = localizedName(locale, product.nameAr, product.nameEn, product.slug);
  const category = localizedName(
    locale,
    product.category.nameAr,
    product.category.nameEn
  );
  const price = Number(product.retailPrice).toLocaleString(locale);
  const available = product.availability !== "unavailable";
  const comparing = compareIds.includes(product.id);
  const primary = product.images[0]?.path ?? null;
  const secondary = product.images[1]?.path ?? null;

  const aspect =
    size === "lg"
      ? "min-h-[360px] md:min-h-[440px]"
      : size === "sm"
        ? "aspect-square"
        : "aspect-[4/5]";

  return (
    <article className="group relative">
      <div className={cn("relative overflow-hidden bg-ro-surface-dark", aspect)}>
        <MaterialField src={primary} alt={name} tone="dark" className="absolute inset-0" />
        {secondary ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={secondary}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ro-black/55 via-transparent to-transparent opacity-80" />

        <div className="absolute inset-x-0 bottom-0 space-y-1 p-4 md:p-5">
          <p className="text-[0.6rem] tracking-[0.2em] text-ro-ivory-muted uppercase">
            {category}
          </p>
          <h3 className="font-display text-xl text-ro-cream md:text-2xl">
            <Link href={`/product/${product.slug}`}>{name}</Link>
          </h3>
          <p className="text-sm text-ro-ivory-muted">
            {price} {product.currency}
            <span className="ms-2 text-[0.6rem] tracking-[0.14em] uppercase">
              {available ? dict.home.available : dict.home.unavailable}
            </span>
          </p>
        </div>

        <div className="absolute end-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => openQuickView(product.id)}
            className="border border-ro-line-on-dark bg-ro-black/60 px-2.5 py-1.5 text-[0.6rem] tracking-[0.16em] text-ro-cream uppercase backdrop-blur-sm"
          >
            {dict.home.quickView}
          </button>
          <button
            type="button"
            onClick={() => toggleCompare(product.id)}
            className={cn(
              "border border-ro-line-on-dark bg-ro-black/60 px-2.5 py-1.5 text-[0.6rem] tracking-[0.16em] uppercase backdrop-blur-sm",
              comparing ? "text-ro-cream" : "text-ro-ivory-muted"
            )}
          >
            {dict.home.compare}
          </button>
        </div>
      </div>
    </article>
  );
}
