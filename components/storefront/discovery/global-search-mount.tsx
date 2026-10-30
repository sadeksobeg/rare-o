"use client";

import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageProduct } from "@/lib/catalog/homepage";
import { DiscoveryProvider } from "./discovery-context";
import { GlobalSearchListener } from "./global-search-listener";

/**
 * Makes the full-screen search overlay (triggered by the header's "search"
 * button, event "ro:open-search") work on every storefront page, not only
 * the homepage. The homepage keeps its own, more specific DiscoveryProvider
 * (components/storefront/discovery/homepage-shell.tsx) for quick-view and
 * compare — React's nearest-provider-wins means that instance simply shadows
 * this one there, so nothing about the homepage's existing behavior changes.
 */
export function GlobalSearchMount({
  dict,
  locale,
  products,
}: {
  dict: Dictionary;
  locale: Locale;
  products: HomepageProduct[];
}) {
  return (
    <DiscoveryProvider products={products}>
      <GlobalSearchListener dict={dict} locale={locale} />
    </DiscoveryProvider>
  );
}
