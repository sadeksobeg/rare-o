import type { Locale } from "@/lib/i18n/config";
import { APP_TIMEZONE, formatDayKey } from "@/lib/i18n/format";

function localeTag(locale: Locale) {
  return `${locale}-u-nu-latn`;
}

function parseDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

/** Admin display numbers — always Latin digits (`tabular-nums` in markup). */
export function formatAdminNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat(localeTag(locale), options).format(value);
}

/** Time only, Latin digits (list secondary line). */
export function formatAdminTime(value: Date | string, locale: Locale) {
  const date = parseDate(value);
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function relativeAdmin(value: Date, locale: Locale): string | null {
  const diffSec = Math.round((value.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(localeTag(locale), { numeric: "auto" });
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), "day");
  return null;
}

function absoluteAdminDate(value: Date, locale: Locale, withTime?: boolean) {
  if (withTime) {
    return new Intl.DateTimeFormat(`${locale}-u-nu-latn-ca-gregory`, {
      timeZone: APP_TIMEZONE,
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(value);
  }
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn-ca-gregory`, {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export type AdminDateOpts = {
  /** Include compact time (same absolute family). */
  withTime?: boolean;
  /** Skip relative; always absolute long date. */
  forceAbsolute?: boolean;
};

/**
 * Relative if within the last 7 days (business TZ), else
 * «31 أكتوبر 2026» (Arabic month names, Latin digits).
 */
export function formatAdminDate(
  value: Date | string,
  locale: Locale,
  opts?: AdminDateOpts
) {
  const date = parseDate(value);
  if (!opts?.forceAbsolute) {
    const rel = relativeAdmin(date, locale);
    if (rel) return rel;
  }
  return absoluteAdminDate(date, locale, opts?.withTime);
}

/** Two-line list column: primary label + optional time (Latin). */
export function formatAdminListCreated(value: Date | string, locale: Locale) {
  const date = parseDate(value);
  const dayKey = formatDayKey(date);
  const todayKey = formatDayKey(new Date());
  const yesterdayKey = formatDayKey(new Date(Date.now() - 86_400_000));
  const daysAgo = Math.round(
    (new Date(todayKey).getTime() - new Date(dayKey).getTime()) / 86_400_000
  );

  let primary: string;
  if (dayKey === todayKey) {
    primary = locale === "ar" ? "اليوم" : "Today";
  } else if (dayKey === yesterdayKey) {
    primary = locale === "ar" ? "أمس" : "Yesterday";
  } else if (daysAgo >= 0 && daysAgo < 7) {
    primary = new Intl.DateTimeFormat(localeTag(locale), {
      timeZone: APP_TIMEZONE,
      weekday: "long",
    }).format(date);
  } else {
    primary = new Intl.DateTimeFormat(localeTag(locale), {
      timeZone: APP_TIMEZONE,
      day: "numeric",
      month: "short",
    }).format(date);
  }

  const secondary =
    daysAgo >= 0 && daysAgo < 7 ? formatAdminTime(date, locale) : "";

  return { primary, secondary };
}

/** `5,848 US$` — Latin digits, currency code suffix. */
export function formatAdminMoney(
  amount: number,
  currency: string,
  locale: Locale
) {
  const n = formatAdminNumber(amount, locale, { maximumFractionDigits: 0 });
  const code = (currency || "USD").trim().toUpperCase();
  const suffix = code === "USD" ? "US$" : code;
  return `${n} ${suffix}`;
}

/** Nullable money for admin rows (on-request → caller handles). */
export function formatAdminMoneyOrNull(
  amount: number | null | undefined,
  currency: string | null | undefined,
  locale: Locale
): string | null {
  if (amount == null || !Number.isFinite(Number(amount))) return null;
  const code = currency?.trim();
  if (!code) return null;
  return formatAdminMoney(Number(amount), code, locale);
}
