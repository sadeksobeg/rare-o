export type MotionSurface = "storefront" | "trader" | "admin";
export type MotionTier = "A" | "B" | "C" | "Lite";

export type MotionTierInput = {
  reducedMotion: boolean;
  saveData: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  surface: MotionSurface;
};

export function isWeakDevice(
  input: Pick<MotionTierInput, "deviceMemory" | "hardwareConcurrency">
): boolean {
  const mem = input.deviceMemory;
  const cores = input.hardwareConcurrency;
  if (typeof mem === "number" && mem > 0 && mem <= 4) return true;
  if (typeof cores === "number" && cores > 0 && cores <= 4) return true;
  return false;
}

export function resolveMotionTier(input: MotionTierInput): MotionTier {
  if (input.reducedMotion || input.saveData || isWeakDevice(input)) {
    return "Lite";
  }
  if (input.surface === "admin") return "C";
  if (input.surface === "trader") return "B";
  return "A";
}

export function surfaceFromPathname(pathname: string): MotionSurface {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/trader")) return "trader";
  return "storefront";
}

export const AMBIENT_MAX_MS = 5000;
export const STAGGER_MS = 70;
export const RIPPLE_MS = 600;
/** VISION: admin UI transitions ≤300ms (data anims may run longer separately). */
export const ADMIN_MAX_MS = 300;
