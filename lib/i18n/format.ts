import { TEST_CURRENCY_CODE } from "@/lib/catalog/currency";
import type { Locale } from "@/lib/i18n/config";

const tz = process.env.APP_TIMEZONE || "Asia/Damascus";

export const APP_TIMEZONE = tz;

/** Calendar day `YYYY-MM-DD` in `APP_TIMEZONE`. */
export function formatDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Oldest-first calendar keys ending today (`APP_TIMEZONE`), length `n`. */
export function lastCalendarDayKeys(n: number, from = new Date()): string[] {
  const today = formatDayKey(from);
  const [year, month, day] = today.split("-").map(Number);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const utc = new Date(Date.UTC(year, month - 1, day - i));
    keys.push(utc.toISOString().slice(0, 10));
  }
  return keys;
}

export function hourInAppTimezone(date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "numeric",
    hourCycle: "h23",
  }).format(date);
  return Number.parseInt(hour, 10);
}

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

/**
 * Compact chat-list timestamp (round 3 inbox): today → HH:mm, yesterday →
 * "Yesterday", within the last 6 days → weekday name, older → short date
 * ("5 Nov"). All computed against APP_TIMEZONE so "today"/"yesterday" match
 * the business's own calendar day, not the server's UTC day.
 */
export function formatCompactChatTime(value: Date | string, locale: Locale) {
  const date = typeof value === "string" ? new Date(value) : value;
  const dayKey = formatDayKey(date);
  const todayKey = formatDayKey(new Date());
  const yesterdayKey = formatDayKey(new Date(Date.now() - 86_400_000));
  if (dayKey === todayKey) {
    return formatDate(date, locale, { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  if (dayKey === yesterdayKey) {
    return locale === "ar" ? "أمس" : "Yesterday";
  }
  const daysAgo = Math.round((new Date(todayKey).getTime() - new Date(dayKey).getTime()) / 86_400_000);
  if (daysAgo >= 0 && daysAgo < 6) {
    return formatDate(date, locale, { weekday: "long" });
  }
  return formatDate(date, locale, { day: "numeric", month: "short" });
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
