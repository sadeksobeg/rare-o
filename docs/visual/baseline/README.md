# V1 visual baseline (V0)

Regression reference captured for the motion program. Do not treat these scores as a pass of the 0.85 Lighthouse gate.

## Lighthouse

[`lighthouse-v0.json`](lighthouse-v0.json) is a copy of `docs/pro-readiness/LIGHTHOUSE.json` (E1, 2026-10-19, median of 5, `http://127.0.0.1:3001`).

| Route | Perf median | A11y | Hard gate |
|---|---|---|---|
| home | 0.82 | 0.99 | fail |
| catalog | 0.81 | 0.98 | fail |
| product | 0.80 | 0.99 | fail |
| request | 0.84 | 0.99 | fail |
| admin-home | 0.87 | 0.94 | soft ok |
| trader-home | 0.87 | 0.94 | soft ok |

V1 does not re-run the 5×6 production Lighthouse loop (needs `next start -p 3001`, ~20 min). Storefront routes are unchanged except a thin `MotionProvider` client boundary. Live re-measure is a V3/V6 gate.

## JS gzip

[`js-sizes.json`](js-sizes.json) is the rejected **next-dev** capture. Use [`js-sizes-prod.json`](js-sizes-prod.json) for production First Load JS from `next build` (Home 160 kB, Catalog 158 kB, Product 155 kB, Request 129 kB, Admin 124 kB, Trader 123 kB). MotionProvider delta is 0 kB at 1 kB resolution (static client import on the root layout).

[`lighthouse-v0-current.json`](lighthouse-v0-current.json) is the refreshed 5-run median on current master (includes F2).

## Screenshots

AR/EN × 390 / 768 / 1440 for home, catalog, product, request, admin home, trader home — see `screenshots/` and `screenshots.json`.
