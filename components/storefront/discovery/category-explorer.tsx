import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageCategory } from "@/lib/catalog/homepage";
import { SectionHeader } from "@/components/storefront/home/section-header";
import { localizedName } from "@/lib/utils";
import { href } from "@/lib/href";
import { ArrowRight } from "lucide-react";

export function CategoryExplorer({
  dict,
  locale,
  categories,
}: {
  dict: Dictionary;
  locale: Locale;
  categories: HomepageCategory[];
}) {
  const desc = (slug: string) =>
    slug === "string-instruments"
      ? dict.home.categoryDescInstruments
      : slug === "accessories"
        ? dict.home.categoryDescAccessories
        : dict.home.categoriesCta;

  return (
    <section id="categories">
      <SectionHeader
        eyebrow={dict.home.categoriesEyebrow}
        title={dict.home.categoriesTitle}
        href={href("/catalog", locale)}
        actionLabel={dict.home.viewCollection}
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {categories.map((category, index) => {
          const name = localizedName(
            locale,
            category.nameAr,
            category.nameEn,
            category.slug
          );
          return (
            <li key={category.id}>
              <Link
                href={`${href("/catalog", locale)}?type=${encodeURIComponent(category.slug)}`}
                className="group flex items-center justify-between gap-4 border border-ro-line bg-ro-paper px-4 py-4 transition-colors hover:border-ro-plum"
              >
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-semibold text-ro-plum">
                    {String(index + 1).padStart(2, "0")}
                  </p>
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
