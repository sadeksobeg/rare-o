import {
  CatalogProductCard,
  type CatalogCardProduct,
} from "@/components/storefront/catalog/product-card";
import { Reveal } from "@/components/storefront/motion/reveal";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** Stagger cap — beyond this index, cards reveal together (no long tail wait). */
const STAGGER_MAX_ITEMS = 10;
const STAGGER_STEP_MS = 45;

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
        "grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {products.map((product, i) => (
        <li key={product.id}>
          <Reveal
            variant="scale"
            delayMs={Math.min(i, STAGGER_MAX_ITEMS) * STAGGER_STEP_MS}
          >
            <CatalogProductCard product={product} locale={locale} dict={dict} />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
