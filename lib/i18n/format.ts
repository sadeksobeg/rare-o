import { TEST_CURRENCY_CODE } from "@/lib/catalog/currency";
import type { Locale } from "@/lib/i18n/config";

const tz = process.env.APP_TIMEZONE || "Asia/Damascus";

function localeTag(locale: Locale) {
  return `${locale}-u-nu-latn`;
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat(localeTag(locale), options).format(value);
}

export function formatCurrency(
  value: number | null | undefined,
  currency: string | null | undefined,
  locale: Locale,
  onRequest: string
) {
  const code = currency?.trim();
  // No currency, or non-display fixture code — never show "TEST" in UI.
  if (value == null || !code || code === TEST_CURRENCY_CODE) return onRequest;
  try {
    return new Intl.NumberFormat(localeTag(locale), {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Unknown / non-ISO code — treat as missing currency for storefront display.
    return onRequest;
  }
}

export function formatDate(
  value: Date | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn-ca-gregory`, {
    timeZone: tz,
    ...options,
  }).format(date);
}

export function formatRelative(value: Date | string, locale: Locale) {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), "day");
  return formatDate(date, locale, { dateStyle: "medium" });
}
