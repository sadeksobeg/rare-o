"use client";

import { createContext, useContext } from "react";
import type { MotionSurface, MotionTier } from "./resolve-tier";

export type MotionContextValue = {
  tier: MotionTier;
  surface: MotionSurface;
  lite: boolean;
  reducedMotion: boolean;
  /** Lab override — ignores device/path when set. */
  setOverride: (next: MotionTier | null) => void;
  override: MotionTier | null;
};

export const MotionContext = createContext<MotionContextValue | null>(null);

const FALLBACK: MotionContextValue = {
  tier: "A",
  surface: "storefront",
  lite: false,
  reducedMotion: false,
  setOverride: () => undefined,
  override: null,
};

/** Safe to import from leaf motion modules — no usePathname / useSearchParams. */
export function useMotion(): MotionContextValue {
  return useContext(MotionContext) ?? FALLBACK;
}
