"use client";

import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageProduct } from "@/lib/catalog/homepage-types";
import { DiscoveryProvider } from "./discovery-context";
import { GlobalSearchListener } from "./global-search-listener";

export function GlobalSearchSlot({
  dict,
  locale,
  products,
}: {
  dict: Dictionary;
  locale: Locale;
  products: unknown[];
}) {
  return (
    <DiscoveryProvider products={products as HomepageProduct[]}>
      <GlobalSearchListener dict={dict} locale={locale} />
    </DiscoveryProvider>
  );
}
