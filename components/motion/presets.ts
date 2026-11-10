/**
 * Shared motion presets for admin/trader portals (VISION motion system).
 * Durations: admin ≤300ms; trader warmer; Lite ≤150ms fades.
 */

export const portalFadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
} as const;

export const portalDurations = {
  adminEnterMs: 280,
  adminExitMs: 170,
  traderEnterMs: 320,
  traderExitMs: 190,
  liteMs: 140,
} as const;

export const portalStagger = {
  /** Cap at 8 items (VISION). */
  maxChildren: 8,
  delayChildren: 0.04,
  staggerChildren: 0.045,
} as const;

export const portalPress = {
  whileTap: { scale: 0.97 },
} as const;

type CubicBezier = readonly [number, number, number, number];

const easeOut: CubicBezier = [0.22, 1, 0.36, 1];
const easeIn: CubicBezier = [0.4, 0, 1, 1];

export function enterTransition(
  surface: "admin" | "trader",
  lite: boolean
): { duration: number; ease: CubicBezier } {
  if (lite) {
    return { duration: portalDurations.liteMs / 1000, ease: easeOut };
  }
  const ms =
    surface === "admin"
      ? portalDurations.adminEnterMs
      : portalDurations.traderEnterMs;
  return { duration: ms / 1000, ease: easeOut };
}

export function exitTransition(
  surface: "admin" | "trader",
  lite: boolean
): { duration: number; ease: CubicBezier } {
  if (lite) {
    return { duration: portalDurations.liteMs / 1000, ease: easeIn };
  }
  const ms =
    surface === "admin"
      ? portalDurations.adminExitMs
      : portalDurations.traderExitMs;
  return { duration: ms / 1000, ease: easeIn };
}
