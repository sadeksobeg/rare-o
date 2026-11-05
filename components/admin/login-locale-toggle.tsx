"use client";

import { Languages } from "lucide-react";
import { setLocaleAction } from "@/app/locale-action";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Login-safe locale toggle — no PortalThemeProvider dependency
 * (avoids webpack/client cycles with portal-theme on auth screens).
 */
export function LoginLocaleToggle({
  locale,
  label,
  className,
}: {
  locale: Locale;
  label: string;
  className?: string;
}) {
  const nextLocale: Locale = locale === "ar" ? "en" : "ar";

  return (
    <form action={setLocaleAction}>
      <input type="hidden" name="locale" value={nextLocale} />
      <button
        type="submit"
        aria-label={label}
        className={cn(
          "inline-flex size-11 min-h-11 items-center justify-center rounded-[var(--ro-r-sm)] border border-[color-mix(in_srgb,var(--ro-sand-100)_35%,transparent)] bg-[color-mix(in_srgb,var(--ro-sand-100)_10%,transparent)] text-[var(--ro-sand-100)] transition-[transform,background-color,border-color,color] duration-[var(--ro-dur-fast)] hover:border-[var(--ro-sand-100)] hover:bg-[color-mix(in_srgb,var(--ro-sand-100)_18%,transparent)] active:scale-[0.98]",
          className
        )}
      >
        <Languages className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        <span className="sr-only">{label}</span>
      </button>
    </form>
  );
}
