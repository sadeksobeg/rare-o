# Slice D — Home H1–H9 screenshots

Captured via Chrome CDP (`scripts/slice-d-capture.mjs`, `scripts/slice-d-capture-full.mjs`), `prefers-reduced-motion: reduce`, ≥2s settle.

| File | Locale | Width | Notes |
|------|--------|-------|-------|
| home-ar-1440-full.png | ar | 1440 | **Full page** — H1→H9 + footer (~5223px tall) |
| home-ar-390-full.png | ar | 390 | **Full page** — H1→H9 + footer (~6811px tall) |
| home-ar-1440-scrolled-header.png | ar | 1440 | After scroll: solid sand-100 header |
| home-ar-390.png | ar | 390 | Hero viewport; rings below copy |
| home-ar-768.png | ar | 768 | |
| home-ar-1440.png | ar | 1440 | Hero viewport |
| home-ar-1440-hero.png | ar | 1440 | Hero-only clip |
| home-en-390.png | en | 390 | |
| home-en-768.png | en | 768 | |
| home-en-1440.png | en | 1440 | |

Stack (D41b / SF-01): H1 Hero → H2 TrustStrip → H3 Featured → H4 Collections → H5 Offers → H6 Latest → H7 EditorialSplit → H8 HandoffExplainer → H9 TraderBand → Footer.

Assertions: `node scripts/slice-d-hero-assert.mjs http://127.0.0.1:3010`
