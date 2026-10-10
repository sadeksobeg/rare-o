import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export type TraderDict = Dictionary["trader"];

export function dealStatusLabel(t: TraderDict, status: string): string {
  return t.dealStatus[status] ?? status;
}

export function wholesaleStatusLabel(t: TraderDict, status: string): string {
  return t.wholesaleStatus[status] ?? status;
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
