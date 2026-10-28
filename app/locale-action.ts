"use server";

import { cookies } from "next/headers";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

export async function setLocaleAction(
  localeOrForm: string | FormData
): Promise<void> {
  const locale =
    typeof localeOrForm === "string"
      ? localeOrForm
      : String(localeOrForm.get("locale") ?? "");
  if (!isLocale(locale)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale as Locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}
