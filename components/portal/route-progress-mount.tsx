"use client";

import { useEffect, useState, type ComponentType } from "react";

/**
 * Isolates useSearchParams route progress from portal shells.
 * A poisoned navigation chunk must not crash AdminShell / TraderShell.
 */
export function PortalRouteProgressMount() {
  const [Comp, setComp] = useState<ComponentType | null>(null);

  useEffect(() => {
    let live = true;
    void import("./route-progress")
      .then((mod) => {
        const next = mod?.PortalRouteProgress;
        if (live && typeof next === "function") setComp(() => next);
      })
      .catch(() => {
        /* no bar is preferable to a shell crash */
      });
    return () => {
      live = false;
    };
  }, []);

  if (!Comp) return null;
  return <Comp />;
}
