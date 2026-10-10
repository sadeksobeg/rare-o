"use client";

import { useEffect } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageDiscoveryData } from "@/lib/catalog/homepage";
import { DiscoveryProvider, useDiscovery } from "./discovery-context";
import { SearchOverlay } from "./search-overlay";
import { QuickViewPanel } from "./quick-view-panel";
import { CompareTray } from "./compare-tray";

function ShellListeners({
  dict,
  locale,
  searchIndex,
}: {
  dict: Dictionary;
  locale: Locale;
  searchIndex: HomepageDiscoveryData["searchIndex"];
}) {
  const { openSearch } = useDiscovery();

  useEffect(() => {
    const onOpen = () => openSearch();
    window.addEventListener("ro:open-search", onOpen);
    return () => window.removeEventListener("ro:open-search", onOpen);
  }, [openSearch]);

  return (
    <>
      <SearchOverlay dict={dict} locale={locale} items={searchIndex} />
      <QuickViewPanel dict={dict} locale={locale} />
      <CompareTray dict={dict} locale={locale} />
    </>
  );
}

export function HomepageShell({
  dict,
  locale,
  data,
  children,
}: {
  dict: Dictionary;
  locale: Locale;
  data: HomepageDiscoveryData;
  children: React.ReactNode;
}) {
  return (
    <DiscoveryProvider products={data.products}>
      {children}
      <ShellListeners
        dict={dict}
        locale={locale}
        searchIndex={data.searchIndex}
      />
    </DiscoveryProvider>
  );
}
