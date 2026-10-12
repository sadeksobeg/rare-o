import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageCategory } from "@/lib/catalog/homepage";
import { href } from "@/lib/href";
import { localizedName } from "@/lib/utils";

/** Clean department shortcuts — limited set, consistent chip height. */
export function ShortcutStrip({
  dict,
  locale,
  categories,
}: {
  dict: Dictionary;
  locale: Locale;
  categories: HomepageCategory[];
}) {
  const links = [
    { href: href("/catalog", locale), label: dict.home.shortcutCatalog },
    { href: "#shop", label: dict.home.shortcutLatest },
    { href: href("/offers", locale), label: dict.home.shortcutOffers },
    ...categories.slice(0, 2).map((c) => ({
      href: `${href("/catalog", locale)}?type=${encodeURIComponent(c.slug)}`,
      label: localizedName(locale, c.nameAr, c.nameEn, c.slug),
    })),
    { href: href("/contact", locale), label: dict.nav.contact },
  ];

  return (
    <nav
      aria-label={dict.home.shortcutCategories}
      className="sticky top-[4.75rem] z-20 border-b border-ro-line bg-ro-paper md:top-[5.25rem]"
    >
      <ul className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-4 py-2.5 md:px-6 lg:px-8">
        {links.map((link) => (
          <li key={link.href + link.label} className="shrink-0">
            <Link
              href={link.href}
              className="inline-flex h-8 items-center rounded-[var(--ro-r-sm)] bg-ro-canvas px-3 text-xs font-semibold text-ro-ink ring-1 ring-ro-line transition-colors hover:bg-ro-ink hover:text-ro-canvas hover:ring-ro-ink"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
