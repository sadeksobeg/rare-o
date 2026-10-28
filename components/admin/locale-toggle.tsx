import { Languages } from "lucide-react";
import { setLocaleAction } from "@/app/locale-action";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function AdminLocaleToggle({
  locale,
  label,
  tone = "on-light",
}: {
  locale: Locale;
  label: string;
  tone?: "on-light" | "on-dark";
}) {
  const nextLocale: Locale = locale === "ar" ? "en" : "ar";
  const onDark = tone === "on-dark";

  return (
    <form action={setLocaleAction}>
      <input type="hidden" name="locale" value={nextLocale} />
      <button
        type="submit"
        aria-label={label}
        className={cn(
          "inline-flex h-9 min-w-11 items-center justify-center gap-1.5 rounded-[var(--ro-r-sm)] border px-3 text-xs font-semibold tracking-[0.14em] transition-[transform,background-color,border-color,color] duration-[var(--ro-dur-fast)] active:scale-[0.98]",
          onDark
            ? "border-[color-mix(in_srgb,var(--ro-sand-100)_35%,transparent)] bg-[color-mix(in_srgb,var(--ro-sand-100)_10%,transparent)] text-[var(--ro-sand-100)] hover:-translate-y-px hover:border-[var(--ro-sand-100)] hover:bg-[color-mix(in_srgb,var(--ro-sand-100)_18%,transparent)]"
            : "border-[color-mix(in_srgb,var(--ro-plum-900)_30%,transparent)] bg-ro-paper/90 text-[var(--ro-plum-900)] hover:-translate-y-px hover:border-[var(--ro-plum-900)] hover:bg-[var(--ro-sand-50)]"
        )}
      >
        <Languages className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        <span>{label}</span>
      </button>
    </form>
  );
}
