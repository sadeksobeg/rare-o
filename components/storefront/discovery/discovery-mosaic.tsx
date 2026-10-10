import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageProduct } from "@/lib/catalog/homepage";
import { SectionLabel } from "@/components/storefront/section-label";
import { MosaicTile } from "./mosaic-tile";

export function DiscoveryMosaic({
  dict,
  locale,
  products,
}: {
  dict: Dictionary;
  locale: Locale;
  products: HomepageProduct[];
}) {
  if (products.length === 0) return null;

  const sizes: Array<"lg" | "md" | "sm"> = ["lg", "md", "sm", "md", "sm", "md"];

  return (
    <section id="available" className="border-b border-ro-line bg-ro-cream">
      <div className="mx-auto max-w-[1440px] space-y-10 px-5 py-16 md:px-8 md:py-24 lg:px-12">
        <div className="space-y-4">
          <SectionLabel tone="purple">{dict.home.mosaicEyebrow}</SectionLabel>
          <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] tracking-wide">
            {dict.home.mosaicTitle}
          </h2>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {products.slice(0, 6).map((product, i) => {
            const size = sizes[i % sizes.length];
            const span =
              size === "lg"
                ? "lg:col-span-7"
                : size === "sm"
                  ? "lg:col-span-3"
                  : "lg:col-span-5";
            return (
              <li key={product.id} className={span}>
                <MosaicTile
                  product={product}
                  dict={dict}
                  locale={locale}
                  size={size}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
