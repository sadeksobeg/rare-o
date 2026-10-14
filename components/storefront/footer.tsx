import Link from "next/link";
import { BrandMark } from "@/components/storefront/brand-mark";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/href";

export function StorefrontFooter({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const year = new Date().getFullYear();
  const isAr = locale === "ar";

  return (
    <footer className="ro-inverse relative overflow-hidden bg-[var(--ro-ink-950)] text-ro-canvas">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 80% 0%, rgba(82,39,124,0.18), transparent 70%), linear-gradient(180deg, #121016 0%, #0b080d 100%)",
        }}
      />

      <div className="relative z-[1] mx-auto max-w-[1440px] px-5 pt-16 md:px-8 md:pt-20 lg:px-12">
        <div className="grid gap-12 border-b border-[color-mix(in_srgb,var(--ro-sand-200)_14%,transparent)] pb-14 md:grid-cols-12 md:gap-10">
          <div className="space-y-5 md:col-span-5">
            <Link
              href={href("/", locale)}
              className="inline-flex items-center gap-4 transition-opacity hover:opacity-90"
            >
              <BrandMark variant="master" tone="on-dark" size="md" />
              <span className="font-display text-2xl tracking-[0.26em] md:text-3xl">
                {dict.brand}
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--ro-ink-200)]">
              {dict.home.footerTagline}
            </p>
          </div>

          <div className="md:col-span-3 md:col-start-7">
            <p className="ro-type-overline mb-5 text-[var(--ro-amber-500)]">
              {dict.home.footerExplore}
            </p>
            <nav
              className="flex flex-col gap-3.5 text-sm text-[var(--ro-ink-200)]"
              aria-label={dict.home.footerExplore}
            >
              {(
                [
                  ["/", dict.nav.home],
                  ["/catalog", dict.nav.catalog],
                  ["/offers", dict.nav.offers],
                  ["/contact", dict.nav.contact],
                  ["/privacy", dict.privacy.title],
                ] as const
              ).map(([path, label]) => (
                <Link
                  key={path}
                  href={href(path, locale)}
                  className="w-fit transition-colors hover:text-ro-canvas"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="md:col-span-3">
            <p className="ro-type-overline mb-5 text-[var(--ro-amber-500)]">
              {isAr ? "اللغة" : "Language"}
            </p>
            <div className="flex flex-col gap-3 text-sm">
              <Link
                href={href("/", "ar")}
                hrefLang="ar"
                lang="ar"
                className={
                  isAr
                    ? "font-medium text-ro-canvas"
                    : "text-[var(--ro-ink-200)] transition-colors hover:text-ro-canvas"
                }
              >
                العربية
              </Link>
              <Link
                href={href("/", "en")}
                hrefLang="en"
                lang="en"
                className={
                  !isAr
                    ? "font-medium text-ro-canvas"
                    : "text-[var(--ro-ink-200)] transition-colors hover:text-ro-canvas"
                }
              >
                English
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 py-6 text-xs text-[var(--ro-plum-300)] md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {dict.brand}. {dict.home.footerRights}
          </p>
        </div>
      </div>
    </footer>
  );
}
