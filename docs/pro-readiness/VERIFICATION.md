# VERIFICATION — C1 matrix vs FINAL-REPORT claims

**Date:** 2026-10-18  
**Method:** Tooling commands + automated page audit + screenshots under `docs/pro-readiness/screens/`.  
**Legend:** VERIFIED = command/output or artefact exists · UNVERIFIED = claimed earlier without fresh proof in this pass.

## Owner defaults (locked)

| Claim | Verdict | Evidence |
|-------|---------|----------|
| Appendix S item names as internal SoT | VERIFIED | Catalog/seed naming unchanged; no rename batch in C1 |
| Conflict rule → admin warning only (no trader block) | VERIFIED | `lib/deals/conflict.ts` `findCatalogDealConflicts`; `assertNoCatalogDealConflict` no-op; create path does not throw `DEAL_PRODUCT_CONFLICT` |
| Trader notifications kept | VERIFIED | `/trader/notifications` + `notifyTrader` on admin negotiate |
| `rejected` + optional reject reason | PARTIAL | Status/action exist; admin reject UI + reason display completed in C3 |
| Wallpaper kept; solid AA form surfaces | VERIFIED | Wallpaper retained; negotiation/forms use `bg-ro-surface` / `bg-ro-paper` |

## Tooling gate

| Check | Verdict | Evidence |
|-------|---------|----------|
| `npm run lint` | VERIFIED | Exit 0 (C1 run) |
| `npx tsc --noEmit` | VERIFIED | Exit 0 (C1 run) |
| `npm run build` | VERIFIED | Exit 0 (C6 prep) |
| `npm run check:i18n` | VERIFIED | 901 keys AR/EN match |
| `npm run check:ar-enums` | VERIFIED | 28 labels ok |
| `npm run test:c1-audit` | VERIFIED | 132 pages, **0 issues** |
| `npm run test:week3` | VERIFIED | 58 passed, 0 failed |
| Playwright (`channel: chrome`) | VERIFIED | `playwright.config.ts` + `@playwright/test@1.49.1`; Chromium CDN install may fail on path-with-spaces — system Chrome used |
| axe / Lighthouse deps present | VERIFIED | `@axe-core/playwright@4.10.1`, `lighthouse@12.2.1` in package.json |
| Full axe/Lighthouse matrix | UNVERIFIED in C1 | Deferred to C6 with thresholds |

## Contract claims from prior FINAL-REPORT

| Area | Prior claim | C1 verdict | Evidence |
|------|-------------|------------|----------|
| 2.2 video magic bytes | PASS path | VERIFIED code | `lib/catalog/images.ts` |
| 4.1 wa.me handoff | PASS | VERIFIED code | `lib/whatsapp/handoff-adapter.ts` |
| 4.2 / 4.3 retail admin | PASS | VERIFIED routes | `/admin/requests` |
| 8.3 shipping fields | PASS | VERIFIED schema/UI | Wholesale shipping fields |
| 9.1–9.3 live WA | PARTIAL | UNVERIFIED live | Pairing UI + fake adapter = C2; live phone = owner ops |
| 7.2 backups | Script PASS | VERIFIED script | `npm run backup:daily` |
| Restore drill | Manual | UNVERIFIED in C1 | C6 |
| Login lockout | PASS | VERIFIED code | `lib/auth/rate-limit.ts` |
| Security headers | PASS | VERIFIED | `next.config.ts` |
| `/api/health` | PASS | VERIFIED | smoke e2e |

## Screenshot / page audit matrix

| Surface | Widths | Locales | Artefact |
|---------|--------|---------|----------|
| Storefront public routes | 390 / 768 / 1440 | AR + EN | `docs/pro-readiness/screens/{locale}/{width}/` |
| Admin routes (incl. login) | same | same | same |
| Trader routes (incl. login) | same | same | same |
| Contact sheet | — | — | `docs/pro-readiness/screens/CONTACT-SHEET.md` |
| Machine results | — | — | `docs/pro-readiness/screens/AUDIT-RESULTS.json` |

Automated checks per page: horizontal overflow, console errors, failed requests, broken images, Latin enum leakage in AR UI (`scripts/c1-page-audit.mjs`).

## Honest gaps carried to later batches

- C2: admin WA pairing + `WHATSAPP_ADAPTER=fake` + retail idempotency E2E
- C3: conflict warning UI on admin accept; reject reason UX; trader E2E
- C4: storefront media/cart/RTL E2E depth
- C5: CONFORMANCE regen
- C6: axe 0 critical/serious; Lighthouse thresholds; restore drill; FINAL-REPORT rewrite
- C7: PostgreSQL — gated (`GO C7` only)
