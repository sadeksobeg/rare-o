import { cache } from "react";
import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  isLocale,
  type Locale,
} from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";

export const LOCALE_COOKIE = "ro_locale";

export const getRequestLocale = cache(async (): Promise<Locale> => {
  const h = await headers();
  const fromMiddleware = h.get("x-ro-locale");
  if (fromMiddleware && isLocale(fromMiddleware)) return fromMiddleware;

  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  if (value && isLocale(value)) return value;
  return defaultLocale;
});

export const getRequestDictionary = cache(async (): Promise<{
  locale: Locale;
  dict: Dictionary;
}> => {
  const locale = await getRequestLocale();
  return { locale, dict: getDictionary(locale) };
});
