# E2 Playwright `test.skip` audit (Closure E2)

**Date:** 2026-10-19  
**Scope:** `e2e/*.spec.ts`

## Summary

| Before | After |
|--------|-------|
| 24 `test.skip(...)` call sites | **0** |

All unconditional and conditional skips were removed. Failures now surface as **`expect(...)` hard failures** or thrown errors from `ensureE2EFixtures()`.

## Remediation strategy

1. **`e2e/global-setup.ts`** — when `DATABASE_URL` is set and `E2E_AUTO_SEED≠0`, runs `prisma migrate deploy`, `prisma/seed.ts`, and `prisma/seed-demo.ts`.
2. **`e2e/ensure-seed.ts`** — idempotent fixtures: published catalog, `cello-studio`, admin deals, category-with-products, admin customer row, foreign trader deal (`DL-E2E-FOREIGN`) for IDOR tests.
3. **`test.beforeAll(ensureE2EFixtures)`** on C2/C3/C4/D1 suites for parity when global setup is disabled.

## Former skip → new behavior

| File | Former skip reason | Resolution |
|------|-------------------|------------|
| c2/c4 | No catalog product | `db:seed` + `expect(added).toBe(true)` |
| c2/c4 | Missing `idempotencyKey` migration | migrate in global setup; no silent skip |
| c4 | `cello-studio` missing | seed fixture + `expect(h1)` |
| c4 | Remove control missing | `expect(remove).toBeVisible()` |
| c4 | No header controls | `expect(count).toBeGreaterThan(0)` |
| c4 | Request submit alert | `expect(alert).toBeHidden()` (server needs `WHATSAPP_BUSINESS_E164`) |
| c3 | Wizard / products / submit | hard `expect` on controls and option count |
| c3 | No admin deals | seed + visible deal link |
| c3 | IDOR foreign deal | `ensureForeignTraderDeal` |
| d1 | Route 404 / missing UI | `expectRouteOk` / visible assertions |
| d1 | Categories / customers empty | seed + `ensureCustomerForAdminList` |

## Operational notes (not skips)

- **WhatsApp deep link button:** if `WHATSAPP_BUSINESS_E164` is unset on the **Next dev server**, the handoff UI may hide the button; test adds a Playwright **annotation** only.
- **Fake pairing code:** requires `WHATSAPP_ADAPTER=fake` on server/worker; otherwise inbox status assertion still runs.

## Dead tests removed

None — all specs remain; none were deleted as dead code.
