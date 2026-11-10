"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LazyMotion, domAnimation, MotionConfig } from "motion/react";
import { MotionContext } from "./context";
import {
  resolveMotionTier,
  surfaceFromPathname,
  type MotionSurface,
  type MotionTier,
} from "./resolve-tier";

export { useMotion } from "./context";
export type { MotionContextValue } from "./context";

type ConnectionLike = { saveData?: boolean };

function readSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: ConnectionLike })
    .connection;
  return Boolean(conn?.saveData);
}

function readDevice() {
  if (typeof navigator === "undefined") {
    return { deviceMemory: undefined, hardwareConcurrency: undefined };
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
  };
}

export function MotionProvider({
  children,
  surface: surfaceProp,
}: {
  children: ReactNode;
  surface?: MotionSurface;
}) {
  const pathname = usePathname() ?? "/";
  const surface = surfaceProp ?? surfaceFromPathname(pathname);
  /** SSR-safe defaults — window/navigator are read only after mount. */
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const [device, setDevice] = useState<{
    deviceMemory?: number;
    hardwareConcurrency?: number;
  }>({});
  const [override, setOverride] = useState<MotionTier | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    setSaveData(readSaveData());
    setDevice(readDevice());
    return () => mq.removeEventListener("change", update);
  }, []);

  const autoTier = useMemo(
    () =>
      resolveMotionTier({
        reducedMotion,
        saveData,
        deviceMemory: device.deviceMemory,
        hardwareConcurrency: device.hardwareConcurrency,
        surface,
      }),
    [reducedMotion, saveData, device, surface]
  );

  const tier = override ?? autoTier;
  const lite = tier === "Lite";

  const value = useMemo(
    () => ({
      tier,
      surface,
      lite,
      reducedMotion: reducedMotion || lite,
      setOverride,
      override,
    }),
    [tier, surface, lite, reducedMotion, override]
  );

  return (
    <MotionContext.Provider value={value}>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion={lite || reducedMotion ? "always" : "user"}>
          <div
            data-ro-motion-tier={tier}
            data-ro-motion-surface={surface}
            data-ro-motion-lite={lite ? "true" : "false"}
          >
            {children}
          </div>
        </MotionConfig>
      </LazyMotion>
    </MotionContext.Provider>
  );
}
