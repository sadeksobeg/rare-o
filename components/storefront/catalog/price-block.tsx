import { TEST_CURRENCY_CODE } from "@/lib/catalog/currency";
import { resolveCompareAt } from "@/lib/catalog/pricing";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
import { formatCurrency } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/** S09 — currency-formatted price; optional real compare-at from admin. */
export function PriceBlock({
  price,
  compareAtPrice,
  currency,
  locale,
  onRequestLabel,
  wasLabel,
  nowLabel,
  onSaleLabel,
  size = "card",
  className,
}: {
  price: number | null | undefined;
  compareAtPrice?: number | string | null;
  currency: string | null | undefined;
  locale: Locale;
  onRequestLabel: string;
  wasLabel?: string;
  nowLabel?: string;
  onSaleLabel?: string;
  size?: "card" | "pdp";
  className?: string;
}) {
  const effectiveCompareAt = isPromoFeaturesEnabled() ? compareAtPrice : null;
  const { retail, compareAt, onSale } = resolveCompareAt(
    price,
    effectiveCompareAt
  );
  const code = currency?.trim();
  const displayCurrency =
    code && code !== TEST_CURRENCY_CODE ? code : null;
  const hasPrice = Number.isFinite(retail) && !!displayCurrency;

  if (!hasPrice) {
    return (
      <p
        className={cn(
          "font-normal text-ro-text-2",
          size === "pdp" ? "text-lg" : "text-sm",
          className
        )}
      >
        {onRequestLabel}
      </p>
    );
  }

  if (onSale && compareAt != null && wasLabel && nowLabel) {
    return (
      <div className={cn("space-y-1", className)}>
        {onSaleLabel ? (
          <p className="ro-type-overline text-ro-plum">{onSaleLabel}</p>
        ) : null}
        <p
          className={cn(
            "flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums",
            size === "pdp" ? "font-display text-2xl md:text-3xl" : "text-sm"
          )}
        >
          <span className="font-semibold text-ro-ink">
            <span className="sr-only">{nowLabel}: </span>
            {formatCurrency(retail, displayCurrency, locale, onRequestLabel)}
          </span>
          <span
            className={cn(
              "text-ro-muted line-through",
              size === "pdp" ? "text-base font-normal md:text-lg" : "text-xs"
            )}
          >
            <span className="sr-only">{wasLabel}: </span>
            {formatCurrency(compareAt, displayCurrency, locale, onRequestLabel)}
          </span>
        </p>
      </div>
    );
  }

  return (
    <p
      className={cn(
        "tabular-nums text-ro-ink",
        size === "pdp"
          ? "font-display text-2xl md:text-3xl"
          : "text-sm font-semibold",
        className
      )}
    >
      {formatCurrency(retail, displayCurrency, locale, onRequestLabel)}
    </p>
  );
}
