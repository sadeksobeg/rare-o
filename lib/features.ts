/**
 * Build-time feature flags. `NEXT_PUBLIC_*` values are inlined into the client
 * bundle, so these are safe to import from both server and client components.
 */

/** Homepage compare tray + compare buttons. Off unless `NEXT_PUBLIC_ENABLE_COMPARE=1`. */
export const ENABLE_COMPARE = process.env.NEXT_PUBLIC_ENABLE_COMPARE === "1";
