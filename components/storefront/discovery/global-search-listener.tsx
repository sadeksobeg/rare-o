"use client";

import { useEffect } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { useDiscovery } from "./discovery-context";
import { SearchOverlay } from "./search-overlay";
import { toSearchIndex } from "@/lib/catalog/homepage-search";

export function GlobalSearchListener({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const { openSearch, products } = useDiscovery();

  useEffect(() => {
    const onOpen = () => openSearch();
    window.addEventListener("ro:open-search", onOpen);
    return () => window.removeEventListener("ro:open-search", onOpen);
  }, [openSearch]);

  return (
    <SearchOverlay dict={dict} locale={locale} items={toSearchIndex(products)} />
  );
}
