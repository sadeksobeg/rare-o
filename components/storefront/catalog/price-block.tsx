import { formatCurrency } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/** S09 — currency-formatted price; null/absent price reads "price on request". */
export function PriceBlock({
  price,
  currency,
  locale,
  onRequestLabel,
  size = "card",
  className,
}: {
  price: number | null | undefined;
  currency: string | null | undefined;
  locale: Locale;
  onRequestLabel: string;
  size?: "card" | "pdp";
  className?: string;
}) {
  const hasPrice = price != null && !Number.isNaN(price) && !!currency;
  return (
    <p
      className={cn(
        "tabular-nums",
        size === "pdp"
          ? "font-display text-2xl md:text-3xl"
          : "text-sm font-semibold",
        hasPrice ? "text-ro-ink" : "font-normal text-ro-text-2",
        className
      )}
    >
      {formatCurrency(hasPrice ? price : null, currency, locale, onRequestLabel)}
    </p>
  );
}
