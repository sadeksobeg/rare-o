# E1 Performance Engineering Report

**Date:** 2026-10-19  
**Measure base:** `next build --no-lint` + standalone `node server.js` on `:3001` (not `next dev`).  
Caddy Brotli proxy attempted (`deploy/Caddyfile.perf`); host Docker→Caddy start was slow/unavailable — scores below are **direct to Next**.  
**Script:** `npm run test:lh-budget` (median of **5** mobile runs) → [`LIGHTHOUSE.json`](./LIGHTHOUSE.json).  
**Budget:** [`lighthouse-budget.json`](../../lighthouse-budget.json).

## Before (D4, 3-run median)

| Route | Perf | A11y |
|-------|------|------|
| Home | 0.79 | 0.99 |
| Catalog | 0.78 | 0.98 |
| Product | 0.77 | 0.99 |
| Request | 0.81 | 0.99 |

## After (E1, 5-run median)

| Route | Perf | A11y | Gate |
|-------|------|------|------|
| Home | **0.82** | 0.99 | FAIL (&lt;0.85) |
| Catalog | **0.81** | 0.98 | FAIL |
| Product | **0.80** | 0.99 | FAIL (runs included 0.91 then 0.80) |
| Request | **0.84** | 0.99 | FAIL (near miss) |
| Admin home | **0.87** | 0.94 | OK soft |
| Trader home | **0.87** | 0.94 | OK soft |

## Fixes applied

| Change | Rationale |
|--------|-----------|
| Hero `hero-oud-atelier-f-e1.webp` 360px q68 + tighter `sizes`/`quality` | LCP bytes |
| Removed CSS filter on hero | Extra paint cost |
| Catalog: drop hover second image + `take: 1` images | Was loading 2× srcset per card |
| Tighter `ProductThumb` `sizes` + `quality={72}` | `uses-responsive-images` |
| `next.config` imageSizes/deviceSizes + cache headers for `/_next/static`, `/brand` | Cache + fit |
| Arabic font weights 400+600 only | Font weight |
| `unstable_cache` homepage discovery 60s | TTFB |

## Root cause remaining

Still under 0.85 on Windows localhost without CDN/HTTP2 edge. Primary LH opportunity class remains image weight on Home mosaic / catalog grid and path-with-spaces Chrome noise. Re-measure on staging behind Caddy+Cloudflare (E4/O6) before claiming PASS.

## Verdict

- **2.6 Responsive / Performance:** **PARTIAL** (improved, not ≥0.85 hard gate).
- Admin/Trader soft gate ≥0.85: **met**.
- Do **not** mark storefront pages PASS below target.

## F2 follow-up (2026-10-20)

See [`F2-PERF-NOTES.md`](./F2-PERF-NOTES.md): hero preload/`fetchPriority`, lazy catalog hover, `revalidateTag` for homepage/catalog, double product LH warmups, and `npm run test:f2-home-cache`. **CI Linux** Lighthouse remains the source of truth; Windows localhost is informational only.
