import { Box, Ruler } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const t = (locale: Locale, ar: string, en: string) =>
  locale === "ar" ? ar : en;

/**
 * Explains how the billable weight is produced. Shown wherever shipping is
 * quoted. Divisor 5000 is the standard express-courier rule (DHL / FedEx / UPS);
 * the worked example is illustrative, not a measured product spec.
 */
export function VolumetricNote({
  locale,
  className,
  defaultOpen = false,
}: {
  locale: Locale;
  className?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      data-testid="ro-volumetric-note"
      className={cn(
        "group rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper text-start",
        className
      )}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-ro-ink [&::-webkit-details-marker]:hidden">
        <Ruler className="size-4 shrink-0 text-ro-plum" strokeWidth={1.5} aria-hidden />
        <span className="flex-1">
          {t(locale, "كيف نحتسب وزن الشحن؟", "How is shipping weight calculated?")}
        </span>
        <span
          aria-hidden
          className="text-ro-muted transition-transform duration-150 group-open:rotate-180"
        >
          ⌄
        </span>
      </summary>
      <div className="space-y-3 border-t border-[var(--ro-border-control)] px-3.5 py-3 text-[13px] leading-relaxed text-ro-text-2">
        <p>
          {t(
            locale,
            "تسعّر شركات الشحن بالأكبر بين الوزن الفعلي والوزن الحجمي. صندوق العود كبير الحجم، لذلك يُحتسب بوزنه الحجمي.",
            "Carriers charge the greater of actual weight and volumetric weight. An oud case is bulky, so it is charged by volume."
          )}
        </p>
        <p
          dir="ltr"
          className="rounded-[var(--ro-r-sm)] bg-ro-sunken px-3 py-2 text-center text-[13px] font-semibold tabular-nums text-ro-ink"
        >
          {t(
            locale,
            "L × W × H (cm) ÷ 5000 = kg",
            "L × W × H (cm) ÷ 5000 = kg"
          )}
        </p>
        <p className="text-xs text-ro-muted">
          {t(
            locale,
            "الطول × العرض × الارتفاع بالسنتيمتر، مقسوماً على 5000 — المعادلة القياسية لدى شركات الشحن السريع.",
            "Length × width × height in centimetres, divided by 5000 — the standard express-courier rule."
          )}
        </p>
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2">
            <Box className="mt-0.5 size-4 shrink-0 text-ro-plum" strokeWidth={1.5} aria-hidden />
            <span>
              {t(
                locale,
                "كل عودين في صندوق واحد: يُحتسب 25 كغ.",
                "Every two ouds share one case: charged as 25 kg."
              )}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Box className="mt-0.5 size-4 shrink-0 text-ro-muted" strokeWidth={1.5} aria-hidden />
            <span>
              {t(
                locale,
                "العود المنفرد في صندوقه: يُحتسب 20 كغ.",
                "A single oud in its own case: charged as 20 kg."
              )}
            </span>
          </li>
        </ul>
        <p className="text-xs text-ro-muted">
          {t(
            locale,
            "مثال توضيحي: صندوق 100 × 50 × 25 سم = 125,000 ÷ 5000 = 25 كغ.",
            "Illustration: a 100 × 50 × 25 cm case = 125,000 ÷ 5000 = 25 kg."
          )}
        </p>
      </div>
    </details>
  );
}
