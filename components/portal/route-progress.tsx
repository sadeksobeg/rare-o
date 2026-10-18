"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin top bar while soft-nav is in flight — pairs with PendingNavLink.
 * Listens for any [data-pending] nav click via capture, clears on route settle.
 */
export function PortalRouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(false);
  }, [pathname, search]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const link = t.closest("a.ro-portal-nav-link, a[data-ro-variant]");
      if (!link) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        const same =
          url.pathname === window.location.pathname &&
          url.search === window.location.search;
        if (!same) setActive(true);
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return (
    <div
      className="ro-portal-route-progress"
      data-active={active ? "true" : "false"}
      aria-hidden
    />
  );
}
