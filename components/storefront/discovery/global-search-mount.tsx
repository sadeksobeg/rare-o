"use client";

import { useEffect, useState, type ComponentType } from "react";

type SlotProps = {
  dict: unknown;
  locale: string;
  /** Opaque payload from the server layout — typed inside the lazy slot only. */
  products: unknown[];
};

/**
 * Isolates discovery/search from the storefront layout client graph so a
 * poisoned webpack chunk (e.g. accidental Prisma import) cannot crash the
 * whole storefront with `undefined.call`.
 */
export function GlobalSearchMount(props: SlotProps) {
  const [Slot, setSlot] = useState<ComponentType<SlotProps> | null>(null);

  useEffect(() => {
    let live = true;
    void import("./global-search-slot")
      .then((mod) => {
        const next = mod?.GlobalSearchSlot;
        if (live && typeof next === "function") {
          setSlot(() => next as ComponentType<SlotProps>);
        }
      })
      .catch(() => {
        /* keep null — search unavailable, page still usable */
      });
    return () => {
      live = false;
    };
  }, []);

  if (!Slot) return null;
  return <Slot {...props} />;
}
