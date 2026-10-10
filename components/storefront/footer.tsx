import Link from "next/link";
import { BrandMark } from "@/components/storefront/brand-mark";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function StorefrontFooter({ dict }: { dict: Dictionary }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ro-black text-ro-cream">
      <div className="mx-auto grid max-w-[1440px] gap-14 px-5 py-16 md:grid-cols-12 md:gap-10 md:px-8 md:py-20 lg:px-12">
        <div className="space-y-6 md:col-span-5">
          <div className="flex items-center gap-4">
            <BrandMark variant="master" tone="on-dark" size="md" />
            <p className="font-display text-2xl tracking-[0.28em] md:text-3xl">
              {dict.brand}
            </p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ro-ivory-muted">
            {dict.home.footerTagline}
          </p>
        </div>

        <div className="md:col-span-3 md:col-start-7">
          <p className="mb-5 text-[0.65rem] tracking-[0.28em] text-ro-ivory-muted uppercase">
            {dict.home.footerExplore}
          </p>
          <nav className="flex flex-col gap-3 text-[0.75rem] tracking-[0.16em] uppercase text-ro-ivory-muted" aria-label="Footer">
            <Link href="/" className="transition-colors hover:text-ro-cream">
              {dict.nav.home}
            </Link>
            <Link href="/catalog" className="transition-colors hover:text-ro-cream">
              {dict.nav.catalog}
            </Link>
            <Link href="/offers" className="transition-colors hover:text-ro-cream">
              {dict.nav.offers}
            </Link>
            <Link href="/cart" className="transition-colors hover:text-ro-cream">
              {dict.nav.cart}
            </Link>
          </nav>
        </div>

        <div className="md:col-span-3">
          <p className="mb-5 text-[0.65rem] tracking-[0.28em] text-ro-ivory-muted uppercase">
            {dict.common.language}
          </p>
          <p className="text-sm text-ro-ivory-muted">AR / EN</p>
        </div>
      </div>

      <div className="border-t border-ro-line-on-dark">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-6 text-[0.65rem] tracking-[0.12em] text-ro-ivory-muted md:flex-row md:items-center md:justify-between md:px-8 lg:px-12">
          <p>
            © {year} {dict.brand}. {dict.home.footerRights}
          </p>
        </div>
      </div>
    </footer>
  );
}
