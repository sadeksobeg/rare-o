import { HERO_OUD_LCP_SRC } from "@/components/brand/hero-oud-field";

/** Optional `<link rel="preload">` for hero LCP asset (home only). */
export function HeroLcpPreload() {
  return (
    <link
      rel="preload"
      as="image"
      href={HERO_OUD_LCP_SRC}
      type="image/webp"
      fetchPriority="high"
    />
  );
}
