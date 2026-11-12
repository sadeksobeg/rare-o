# Phase 0 — Stabilization

| Bug | Root cause | Fix | Test |
|---|---|---|---|
| Brokerage list 500 / Unexpected end of JSON input | Intermittent during SH0 capture under concurrent compile; list path has no bare `JSON.parse`. Hardened status accent map for all lifecycle/terminal statuses. `parsePhotoPaths` already try/catch. | `COL_ACCENT` complete in `brokerage/page.tsx`; regression `scripts/shipping-brokerage-list-check.mjs` | Hit `/admin/brokerage` 200 in prod build + script |
| Trader "1 Issue" badge | Dev-only Next.js overlay (often RSC/hydration); not a customer-facing runtime error | Classify: **dev-only** unless `next build && next start` reproduces | Check production build console |
| `/request` horizontal scrollbar 1440 | Honeypot `left-[-9999px]` + possible select intrinsic width | `sr-only` honeypot; `overflow-x-hidden` on form section; `max-w-full` on select | Overflow gate `scrollWidth <= innerWidth` |
| Weight "20 كغ" font + Arabic-Indic digits | `font-display` on weight; hardcoded `١/٢/٢٠/٢٥`; `toLocaleString(locale)` | Same `text-base` as body; Western digits; `String(pieces)` | Visual + unit assert digits ASCII |
| Admin request shows raw "SY" | `destinationCountry` stored as code | `shippingDestinationParts` shows Arabic/EN name + code | Admin request detail shot |
| Germany floor &lt;11 kg empty methods | `quoteInternationalShipping` returns null below tier | Inquiry card "اطلب عرض سعر" when `options.length===0` | DE + weight 5 kg shows inquiry |
| Client-tampered retail price | Already server-recomputed in `lib/retail-request/service.ts` via `match.amount` | Keep; engine will replace `resolveAvailableMethods` | Golden + tamper test |

**Production impact (brokerage 500):** Unconfirmed for prod; treat as possible race under `next dev`. Must verify with `next build && next start` before STOP-B.

## Gate run (production build, `next build && next start`) — 2026-11-12

`scripts/shipping-phase0-gate.mjs` → `docs/shipping/PHASE-0-GATE.json`: **12/12 passed**.

- `/admin/brokerage`: 200 on 6 consecutive loads, no JSON parse error, no page errors → the 500 was **not reproduced in a production build**; classified dev-only (compile race under `next dev`).
- `/request`: `scrollWidth <= innerWidth` at 390 / 768 / 1280 / 1440; zero Arabic-Indic digits; weight reads "20 كغ".
- Admin request detail: no bare 2-letter country code.

Corrections made when the work was taken over from the first pass:
- `COL_ACCENT` used `--rad-danger`, a token that does not exist → `--rad-err`.
- `overflow-x-hidden` on the request form section was a band-aid that would clip focus rings; removed — the gate passes without it (the real cause was the off-screen honeypot, now `sr-only`).
- Arabic default strings in `schema.prisma` and the migration SQL were saved as `????` (encoding loss) → restored.
