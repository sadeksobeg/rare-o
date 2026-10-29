"use client";

import { useEffect, useState, type ComponentType } from "react";

/**
 * After-mount load so server pages never statically bind HomeAmbient’s
 * motion/brand graph (avoids webpack `undefined.call` in AdminDashboardBody).
 */
export function HomeAmbientMount() {
  const [Comp, setComp] = useState<ComponentType | null>(null);

  useEffect(() => {
    let live = true;
    void import("./home-ambient")
      .then((mod) => {
        const next = mod?.HomeAmbient;
        if (live && typeof next === "function") setComp(() => next);
      })
      .catch(() => {
        /* decorative only */
      });
    return () => {
      live = false;
    };
  }, []);

  if (!Comp) return null;
  return <Comp />;
}
