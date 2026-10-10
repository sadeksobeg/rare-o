import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageCategory } from "@/lib/catalog/homepage";
import { SectionLabel } from "@/components/storefront/section-label";
import { EDITORIAL } from "@/lib/brand/editorial";
import { localizedName } from "@/lib/utils";
import { href } from "@/lib/href";

const categoryImage: Record<string, string> = {
  "string-instruments": EDITORIAL.oudHeritage,
  accessories: EDITORIAL.instrumentDark,
};

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
    <section id="categories" className="border-b border-ro-line bg-ro-surface">
      <div className="mx-auto max-w-[1440px] space-y-10 px-5 py-16 md:px-8 md:py-24 lg:px-12">
        <div className="grid gap-6 md:grid-cols-12">
          <div className="space-y-4 md:col-span-6">
            <SectionLabel tone="purple">{dict.home.categoriesEyebrow}</SectionLabel>
            <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] tracking-wide">
              {dict.home.categoriesTitle}
            </h2>
          </div>
          <p className="max-w-md self-end text-sm text-ro-muted md:col-span-5 md:col-start-8 md:text-base">
            {dict.home.categoriesIntro}
          </p>
        </div>

        <ul className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          {categories.map((category, index) => {
            const name = localizedName(
              locale,
              category.nameAr,
              category.nameEn,
              category.slug
            );
            const large = index === 0;
            const src =
              categoryImage[category.slug] ?? EDITORIAL.oudHeritage;
            return (
              <li
                key={category.id}
                className={large ? "lg:col-span-7" : "lg:col-span-5 lg:mt-16"}
              >
                <Link
                  href={`${href("/catalog", locale)}?category=${encodeURIComponent(category.slug)}`}
                  className="group relative block min-h-[320px] overflow-hidden bg-ro-black text-ro-cream md:min-h-[420px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ro-black/85 via-ro-black/30 to-ro-black/10" />
                  <div className="absolute inset-x-0 bottom-0 space-y-3 p-7 md:p-10">
                    <p className="text-[0.65rem] tracking-[0.28em] text-ro-ivory-muted uppercase">
                      {category.productCount} {dict.home.pieces}
                    </p>
                    <h3
                      className={`font-display tracking-wide transition-transform duration-500 group-hover:-translate-y-1 ${
                        large ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl"
                      }`}
                    >
                      {name}
                    </h3>
                    <p className="max-w-sm text-sm text-ro-ivory-muted">
                      {desc(category.slug)}
                    </p>
                    <p className="text-[0.65rem] tracking-[0.22em] text-ro-cream uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {dict.home.categoriesCta}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
