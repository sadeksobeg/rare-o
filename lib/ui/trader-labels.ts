import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

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

export function formatDateTime(locale: Locale, d: Date): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatMoney(
  amount: number | string | { toString(): string },
  currency?: string | null
): string {
  return `${Number(amount)}${currency ? ` ${currency}` : ""}`;
}
