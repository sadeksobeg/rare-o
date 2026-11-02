"use client";

import { Languages } from "lucide-react";
import { setLocaleAction } from "@/app/locale-action";
import type { Locale } from "@/lib/i18n/config";
import { usePortalTheme } from "@/components/portal/portal-theme";
import { cn } from "@/lib/utils";

export function AdminLocaleToggle({
  locale,
  label,
  tone = "auto",
}: {
  locale: Locale;
  label: string;
  /** Prefer `auto` so tone follows portal data-theme. */
  tone?: "on-light" | "on-dark" | "auto";
}) {
  const nextLocale: Locale = locale === "ar" ? "en" : "ar";
  const { theme } = usePortalTheme();
  const onDark =
    tone === "on-dark" || (tone === "auto" && theme === "dark");

  return (
    <form action={setLocaleAction}>
      <input type="hidden" name="locale" value={nextLocale} />
      <button
        type="submit"
        aria-label={label}
        className={cn(
          "inline-flex size-11 min-h-11 items-center justify-center rounded-[var(--ro-r-sm)] border transition-[transform,background-color,border-color,color] duration-[var(--ro-dur-fast)] active:scale-[0.98]",
          onDark
            ? "border-[color-mix(in_srgb,var(--ro-sand-100)_35%,transparent)] bg-[color-mix(in_srgb,var(--ro-sand-100)_10%,transparent)] text-[var(--ro-sand-100)] hover:border-[var(--ro-sand-100)] hover:bg-[color-mix(in_srgb,var(--ro-sand-100)_18%,transparent)]"
            : "border-[color:var(--ro-border)] bg-[color:var(--ro-bg-raised)] text-[color:var(--ro-text)] hover:border-[color:var(--ro-border)] hover:bg-[color-mix(in_srgb,var(--ro-plum-700)_10%,var(--ro-bg-raised))]"
        )}
      >
        <Languages className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        <span className="sr-only">{label}</span>
      </button>
    </form>
  );
}
