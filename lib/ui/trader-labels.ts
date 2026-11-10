import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatDate, formatNumber } from "@/lib/i18n/format";

export type TraderDict = Dictionary["trader"];

export function dealStatusLabel(t: TraderDict, status: string): string {
  return t.dealStatus[status] ?? status;
}

export function wholesaleStatusLabel(t: TraderDict, status: string): string {
  return t.wholesaleStatus[status] ?? status;
}

/** Map action error codes / English fallbacks to dictionary copy. */
export function traderActionMessage(t: TraderDict, error: string): string {
  const key = error.trim();
  if (key === "Unauthorized") return t.actionErrorUnauthorized;
  if (
    key === "Not allowed" ||
    key === "REQUEST_NOT_FOUND" ||
    key === "RESPONSE_NOT_ALLOWED" ||
    key === "CANCEL_NOT_ALLOWED"
  ) {
    return t.actionErrorNotAllowed;
  }
  if (
    key === "Invalid response" ||
    key === "Invalid request" ||
    key === "Invalid lines payload" ||
    key === "Invalid quantity" ||
    key === "LINES_REQUIRED" ||
    key === "INVALID_REQUEST_MODE"
  ) {
    return t.actionErrorInvalid;
  }
  if (t.actionError[key]) return t.actionError[key];
  return t.actionErrorGeneric;
}

export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** Same calendar + Latin digits + 24h as admin shared `formatDate`. */
export function formatDateTime(locale: Locale, d: Date): string {
  return formatDate(d, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Consistent `USD 1,800` (code then amount, Latin digits). */
export function formatMoney(
  amount: number | string | { toString(): string },
  currency?: string | null,
  locale: Locale = "en"
): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  const formatted = formatNumber(n, locale, { maximumFractionDigits: 2 });
  const code = currency?.trim();
  return code ? `${code} ${formatted}` : formatted;
}

/**
 * Translate or drop raw `Mode: propose_price` style notes in wholesale history.
 * Returns null when the note is only a raw mode token (hide the line).
 */
export function humanizeWholesaleNote(
  note: string | null | undefined,
  t: TraderDict
): string | null {
  if (!note) return null;
  const trimmed = note.trim();
  const onlyMode = /^Mode:\s*([a-z_]+)\s*$/i.exec(trimmed);
  if (onlyMode) {
    const key = onlyMode[1];
    return t.requestMode[key] ?? null;
  }
  return trimmed.replace(/Mode:\s*([a-z_]+)/gi, (_, key: string) => {
    return t.requestMode[key] ?? key;
  });
}
