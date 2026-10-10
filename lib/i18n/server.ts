import { cookies } from "next/headers";
import {
  defaultLocale,
  isLocale,
  type Locale,
} from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";

export const LOCALE_COOKIE = "ro_locale";

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  if (value && isLocale(value)) return value;
  return defaultLocale;
}

export async function getRequestDictionary(): Promise<{
  locale: Locale;
  dict: Dictionary;
}> {
  const locale = await getRequestLocale();
  return { locale, dict: getDictionary(locale) };
}
