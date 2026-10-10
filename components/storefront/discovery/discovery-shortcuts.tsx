import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function DiscoveryShortcuts({
  dict,
  hasAvailable,
  hasOffers,
  hasProducts,
}: {
  dict: Dictionary;
  hasAvailable: boolean;
  hasOffers: boolean;
  hasProducts: boolean;
}) {
  const items = [
    { href: "/catalog", label: dict.home.shortcutCatalog, show: true },
    {
      href: "#available",
      label: dict.home.shortcutAvailable,
      show: hasAvailable,
    },
    { href: "#categories", label: dict.home.shortcutCategories, show: true },
    { href: "#latest", label: dict.home.shortcutLatest, show: hasProducts },
    {
      href: hasOffers ? "/offers" : "#curated",
      label: dict.home.shortcutOffers,
      show: hasOffers,
    },
  ].filter((i) => i.show);

  return (
    <section className="border-b border-ro-line bg-ro-cream">
      <div className="mx-auto max-w-[1440px] px-5 py-6 md:px-8 lg:px-12">
        <div className="ro-track gap-3 md:gap-4">
          {items.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex shrink-0 items-center border border-ro-line px-5 py-3 text-[0.7rem] tracking-[0.2em] uppercase text-ro-muted transition-colors duration-300 hover:border-ro-purple hover:text-ro-purple"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
