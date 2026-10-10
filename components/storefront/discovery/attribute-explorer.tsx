"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageCategory, HomepageProduct } from "@/lib/catalog/homepage";
import { SectionLabel } from "@/components/storefront/section-label";
import { localizedName } from "@/lib/utils";
import { MosaicTile } from "./mosaic-tile";

export function AttributeExplorer({
  dict,
  locale,
  products,
  categories,
}: {
  dict: Dictionary;
  locale: Locale;
  products: HomepageProduct[];
  categories: HomepageCategory[];
}) {
  const [categorySlug, setCategorySlug] = useState<string | "all">("all");
  const [availability, setAvailability] = useState<
    "all" | "available" | "unavailable"
  >("all");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categorySlug !== "all" && p.category.slug !== categorySlug) return false;
      if (availability !== "all" && p.availability !== availability) return false;
      return true;
    });
  }, [products, categorySlug, availability]);

  if (products.length === 0) return null;

  return (
    <section className="border-b border-ro-line bg-ro-cream">
      <div className="mx-auto max-w-[1440px] space-y-8 px-5 py-16 md:px-8 md:py-20 lg:px-12">
        <div className="space-y-4">
          <SectionLabel tone="purple">{dict.home.attributeEyebrow}</SectionLabel>
          <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] tracking-wide">
            {dict.home.attributeTitle}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip
            active={categorySlug === "all"}
            onClick={() => setCategorySlug("all")}
            label={dict.home.attributeAll}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={categorySlug === c.slug}
              onClick={() => setCategorySlug(c.slug)}
              label={localizedName(locale, c.nameAr, c.nameEn, c.slug)}
            />
          ))}
          <span className="mx-2 hidden h-8 w-px bg-ro-line sm:inline-block" />
          <Chip
            active={availability === "all"}
            onClick={() => setAvailability("all")}
            label={dict.home.attributeAll}
          />
          <Chip
            active={availability === "available"}
            onClick={() => setAvailability("available")}
            label={dict.home.filterAvailable}
          />
          <Chip
            active={availability === "unavailable"}
            onClick={() => setAvailability("unavailable")}
            label={dict.home.filterUnavailable}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-ro-muted">{dict.catalog.empty}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {filtered.slice(0, 9).map((p) => (
              <li key={p.id}>
                <MosaicTile product={p} dict={dict} locale={locale} size="md" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
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
      className={`border px-4 py-2 text-[0.65rem] tracking-[0.18em] uppercase transition-colors ${
        active
          ? "border-ro-purple bg-ro-purple text-ro-cream"
          : "border-ro-line text-ro-muted hover:border-ro-purple hover:text-ro-purple"
      }`}
    >
      {label}
    </button>
  );
}
