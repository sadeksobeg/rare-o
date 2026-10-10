import type { Locale } from "@/lib/i18n/config";

/**
 * Build an internal storefront href. Arabic has no prefix; English uses `/en`.
 * Admin and trader paths are returned unchanged (cookie locale).
 */
export function href(path: string, locale: Locale = "ar"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (
    normalized.startsWith("/admin") ||
    normalized.startsWith("/trader") ||
    normalized.startsWith("/dev")
  ) {
    return normalized;
  }
  if (locale === "en") {
    if (normalized === "/") return "/en";
    return `/en${normalized}`;
  }
  return normalized;
}

export function stripLocalePrefix(pathname: string): {
  locale: Locale;
  path: string;
} {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const rest = pathname === "/en" ? "/" : pathname.slice(3) || "/";
    return { locale: "en", path: rest };
  }
  return { locale: "ar", path: pathname };
}
