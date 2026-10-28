import { HERO_OUD_LCP_SRC } from "@/components/brand/hero-oud-field";

/**
 * Optional `<link rel="preload">` for the hero LCP asset (home only).
 *
 * next/image never requests the raw file directly - it requests it through
 * `/_next/image?url=...&w=...&q=...`. Preloading the raw path was a dead
 * request: it fetched a different (larger, unoptimized) resource than the
 * one the <Image> component actually renders, so the real LCP image was
 * only discovered once React hydrated and resolved its srcset - measured
 * as a ~2.8s FCP-to-LCP gap (LCP 4.9s vs FCP 2.1s, LCP sub-score 0.29).
 * Preloading the exact `/_next/image` URL the component requests lets the
 * browser satisfy that request from the preload instead of starting a
 * second, later fetch. `w=640&q=70` matches the srcset bucket actually
 * requested at the mobile breakpoint Lighthouse/the perf budget gate on.
 */
export function HeroLcpPreload() {
  const href = `/_next/image?url=${encodeURIComponent(HERO_OUD_LCP_SRC)}&w=640&q=70`;
  return (
    <link
      rel="preload"
      as="image"
      href={href}
      type="image/webp"
      fetchPriority="high"
    />
  );
}
