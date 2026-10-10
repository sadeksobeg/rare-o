import Link from "next/link";
import { MediaPlane } from "@/components/storefront/media-plane";
import { SectionLabel } from "@/components/storefront/section-label";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { localizedName } from "@/lib/utils";

export type CategoryCardData = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
};

export function HomeCategories({
  dict,
  locale,
  categories,
}: {
  dict: Dictionary;
  locale: Locale;
  categories: CategoryCardData[];
}) {
  const descriptionFor = (slug: string) => {
    if (slug === "string-instruments") return dict.home.categoryDescInstruments;
    if (slug === "accessories") return dict.home.categoryDescAccessories;
    return dict.home.categoriesCta;
  };

  return (
    <section className="border-b border-ro-line bg-ro-cream">
      <div className="mx-auto max-w-[1440px] space-y-14 px-5 py-20 md:px-8 md:py-28 lg:px-12">
        <div className="grid gap-6 md:grid-cols-12">
          <div className="space-y-4 md:col-span-6">
            <SectionLabel tone="purple">{dict.home.categoriesEyebrow}</SectionLabel>
            <h2 className="font-display text-3xl tracking-wide text-ro-black md:text-4xl lg:text-5xl">
              {dict.home.categoriesTitle}
            </h2>
          </div>
          <p className="max-w-md self-end text-sm leading-relaxed text-ro-muted md:col-span-5 md:col-start-8 md:text-base">
            {dict.home.categoriesIntro}
          </p>
        </div>

        <ul className="grid gap-6 lg:grid-cols-2 lg:gap-8">
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
                  href={`/catalog?category=${category.slug}`}
                  className="group relative block overflow-hidden"
                >
                  <MediaPlane
                    aspect="landscape"
                    tone={index === 0 ? "default" : "alt"}
                    className="min-h-[280px] transition-transform duration-700 md:min-h-[360px] group-hover:scale-[1.01]"
                    showMark
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ro-black/75 via-ro-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 space-y-3 p-7 md:p-10">
                    <p className="text-[0.65rem] tracking-[0.28em] text-ro-ivory-muted uppercase transition-transform duration-500 group-hover:-translate-y-1">
                      {dict.home.categoriesCta}
                    </p>
                    <h3 className="font-display text-3xl tracking-wide text-ro-cream transition-transform duration-500 group-hover:-translate-y-1 md:text-4xl">
                      {name}
                    </h3>
                    <p className="max-w-sm text-sm text-ro-ivory-muted opacity-90">
                      {descriptionFor(category.slug)}
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
