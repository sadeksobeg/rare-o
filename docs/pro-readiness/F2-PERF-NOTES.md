# F2 Performance Notes

**Date:** 2026-10-20  
**Scope:** Closure round F2 — LCP, lazy catalog hover, tagged homepage cache, LH stability, bundle analyze hook.

## Changes

| Area | Change |
|------|--------|
| Hero LCP | `fetchPriority="high"` on hero oud image + optional `<link rel="preload">` on home (`HeroLcpPreload`) |
| Catalog hover | `CatalogCardHoverImage` loads second image on `pointerenter`; DB `take: 2` restores secondary path |
| Homepage cache | `unstable_cache` tags `homepage` + `catalog`; mutations call `revalidateTag` via `revalidateHomepageAndCatalogTags()` |
| LH product runs | `d4-lh-once.mjs` + `e1-lh-budget.mjs` double-warm product URLs before scored runs |
| Bundle | `ANALYZE=true npm run build` enables `@next/bundle-analyzer`; below-fold `FeaturedInstrument` dynamically imported on home |

## Measurement source of truth

- **CI on Linux** (production build + `npm run test:lh-budget`) is the authoritative Lighthouse gate.
- **Windows localhost** runs are informational only — do not claim storefront perf ≥ 0.85 without CI `LIGHTHOUSE.json`.
- Prior E1 baseline and methodology: [`E1-PERF-REPORT.md`](./E1-PERF-REPORT.md).

## Verification

- `npm run test:f2-home-cache` — creates a published product, revalidates tags, asserts homepage discovery includes it, cleans up.
- `npm run test:lh-budget` — median of 5 mobile runs; hard gate on home/catalog/product/request (unchanged threshold 0.85).
