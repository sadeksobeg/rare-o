import {
  CatalogProductCard,
  type CatalogCardProduct,
} from "@/components/storefront/catalog/product-card";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** S07 — 2 cols mobile, 3 at ≥ 1024, 4 at ≥ 1280; gap 16 / 24. */
export function ProductGrid({
  products,
  locale,
  dict,
  className,
}: {
  products: CatalogCardProduct[];
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {products.map((product) => (
        <li key={product.id}>
          <CatalogProductCard product={product} locale={locale} dict={dict} />
        </li>
      ))}
    </ul>
  );
}
