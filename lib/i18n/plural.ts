import type { Locale } from "@/lib/i18n/config";

export type PluralForms = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

export function plural(
  count: number,
  locale: Locale,
  forms: PluralForms
): string {
  const rule = new Intl.PluralRules(locale).select(count);
  const template =
    forms[rule as keyof PluralForms] ?? forms.other;
  return template.replace(/\{n\}/g, String(count));
}
