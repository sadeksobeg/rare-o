"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Quietly re-reads the server data while the tab is visible, so status changes appear without a manual reload. */
export function AutoRefresh({ everyMs = 15000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, everyMs);
    return () => clearInterval(t);
  }, [router, everyMs]);
  return null;
}
