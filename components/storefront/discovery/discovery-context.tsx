"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { HomepageProduct } from "@/lib/catalog/homepage-types";

type DiscoveryContextValue = {
  products: HomepageProduct[];
  quickViewId: string | null;
  openQuickView: (id: string) => void;
  closeQuickView: () => void;
  compareIds: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

const DiscoveryContext = createContext<DiscoveryContextValue | null>(null);

const MAX_COMPARE = 3;

export function DiscoveryProvider({
  products,
  children,
}: {
  products: HomepageProduct[];
  children: React.ReactNode;
}) {
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const openQuickView = useCallback((id: string) => setQuickViewId(id), []);
  const closeQuickView = useCallback(() => setQuickViewId(null), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  const clearCompare = useCallback(() => setCompareIds([]), []);

  const value = useMemo(
    () => ({
      products,
      quickViewId,
      openQuickView,
      closeQuickView,
      compareIds,
      toggleCompare,
      clearCompare,
      searchOpen,
      openSearch,
      closeSearch,
    }),
    [
      products,
      quickViewId,
      openQuickView,
      closeQuickView,
      compareIds,
      toggleCompare,
      clearCompare,
      searchOpen,
      openSearch,
      closeSearch,
    ]
  );

  return (
    <DiscoveryContext.Provider value={value}>{children}</DiscoveryContext.Provider>
  );
}

export function useDiscovery() {
  const ctx = useContext(DiscoveryContext);
  if (!ctx) throw new Error("useDiscovery must be used within DiscoveryProvider");
  return ctx;
}

export function useDiscoveryOptional() {
  return useContext(DiscoveryContext);
}
