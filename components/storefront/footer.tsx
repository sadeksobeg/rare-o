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

  return (
    <footer className="ro-inverse bg-ro-ink text-ro-canvas">
      <div className="mx-auto grid max-w-[1440px] gap-14 px-5 py-16 md:grid-cols-12 md:gap-10 md:px-8 md:py-20 lg:px-12">
        <div className="space-y-6 md:col-span-5">
          <div className="flex items-center gap-4">
            <BrandMark variant="master" tone="on-dark" size="md" />
            <p className="font-display text-2xl tracking-[0.28em] md:text-3xl">
              {dict.brand}
            </p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ro-text-2">
            {dict.home.footerTagline}
          </p>
        </div>

        <div className="md:col-span-3 md:col-start-7">
          <p className="ro-type-overline mb-5 text-ro-text-muted">
            {dict.home.footerExplore}
          </p>
          <nav
            className="flex flex-col gap-3 text-sm text-ro-text-2"
            aria-label="Footer"
          >
            <Link href={href("/", locale)} className="hover:text-ro-canvas">
              {dict.nav.home}
            </Link>
            <Link
              href={href("/catalog", locale)}
              className="hover:text-ro-canvas"
            >
              {dict.nav.catalog}
            </Link>
            <Link
              href={href("/offers", locale)}
              className="hover:text-ro-canvas"
            >
              {dict.nav.offers}
            </Link>
            <Link
              href={href("/contact", locale)}
              className="hover:text-ro-canvas"
            >
              {dict.nav.contact}
            </Link>
            <Link
              href={href("/privacy", locale)}
              className="hover:text-ro-canvas"
            >
              {dict.privacy.title}
            </Link>
          </nav>
        </div>

        <div className="md:col-span-3">
          <p className="ro-type-overline mb-5 text-ro-text-muted">
            {dict.common.language}
          </p>
          <div className="flex gap-3 text-sm">
            <Link href={href("/", "ar")} className="hover:text-ro-canvas">
              ع
            </Link>
            <Link href={href("/", "en")} className="hover:text-ro-canvas">
              EN
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-ro-border">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-6 text-xs text-ro-text-muted md:flex-row md:items-center md:justify-between md:px-8 lg:px-12">
          <p>
            © {year} {dict.brand}. {dict.home.footerRights}
          </p>
        </div>
      </div>
    </footer>
  );
}
