/**
 * Plain constants shared between the client-only HeroOudField component and
 * server components (e.g. HeroLcpPreload) that need the same image path.
 * Keep this file free of "use client" — a server component cannot import a
 * value from a client-boundary module (Next.js replaces such exports with a
 * throwing reference), which is what silently broke the LCP preload link.
 */
export const HERO_OUD_LCP_SRC = "/brand/hero-oud-atelier-f-e1.webp";
