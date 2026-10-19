"use client";

import { useEffect, useState } from "react";
import {
  BrandWallpaper,
  type BrandWallpaperTone,
} from "@/components/brand/brand-wallpaper";

/**
 * Mount wallpaper after first paint / idle so LCP is not competed by SVG work.
 */
export function DeferredBrandWallpaper({
  tone = "cream",
  className,
  patternId = "ro-brand-wallpaper",
}: {
  tone?: BrandWallpaperTone;
  className?: string;
  patternId?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };
    const w = window as Window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number }
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(enable, { timeout: 1200 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const t = globalThis.setTimeout(enable, 400);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(t);
    };
  }, []);

  if (!ready) return null;
  return (
    <BrandWallpaper tone={tone} className={className} patternId={patternId} />
  );
}
