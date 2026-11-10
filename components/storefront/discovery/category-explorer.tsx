import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageCategory } from "@/lib/catalog/homepage";
import { SectionHeader } from "@/components/storefront/home/section-header";
import { localizedName } from "@/lib/utils";
import { href } from "@/lib/href";
import { ArrowRight } from "lucide-react";
import { CaseIcon } from "@/components/brand/icons/case";
import { OudIcon } from "@/components/brand/icons/oud";
import { ViolinIcon } from "@/components/brand/icons/violin";

export function CategoryExplorer({
  dict,
  locale,
  categories,
}: {
  dict: Dictionary;
  locale: Locale;
  categories: HomepageCategory[];
}) {
  const desc = (slug: string) => {
    switch (slug) {
      case "oud-economy":
        return dict.home.categoryDescEconomy;
      case "oud-mid":
        return dict.home.categoryDescMid;
      case "oud-professional":
        return dict.home.categoryDescProfessional;
      case "oud-vip":
        return dict.home.categoryDescVip;
      case "accessories":
        return dict.home.categoryDescAccessories;
      case "string-instruments":
        return dict.home.categoryDescInstruments;
      default:
        return dict.home.categoriesCta;
    }
  };

  const iconFor = (slug: string) => {
    if (slug.startsWith("oud-")) return OudIcon;
    if (slug === "string-instruments") return ViolinIcon;
    return CaseIcon;
  };

  return (
    <section id="categories">
      <SectionHeader
        eyebrow={dict.home.categoriesEyebrow}
        title={dict.home.categoriesTitle}
        href={href("/catalog", locale)}
        actionLabel={dict.home.viewCollection}
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const name = localizedName(
            locale,
            category.nameAr,
            category.nameEn,
            category.slug
          );
          const Icon = iconFor(category.slug);
          return (
            <li key={category.id}>
              <Link
                href={`${href("/catalog", locale)}?type=${encodeURIComponent(category.slug)}`}
                className="group flex items-center justify-between gap-4 border border-ro-line bg-ro-paper px-4 py-4 transition-colors hover:border-ro-plum"
              >
                <div className="min-w-0">
                  <Icon
                    className="mb-1 size-5 text-ro-plum"
                    aria-hidden
                  />
                  <h3 className="mt-1 font-display text-lg tracking-wide group-hover:text-ro-plum">
                    {name}
                  </h3>
                  <p className="mt-1 text-sm text-ro-text-2">{desc(category.slug)}</p>
                  <p className="mt-2 text-xs text-ro-muted">
                    {category.productCount} {dict.home.pieces}
                  </p>
                </div>
                <ArrowRight
                  className="size-5 shrink-0 text-ro-ink transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
