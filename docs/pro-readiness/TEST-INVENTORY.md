# Test inventory (Closure F5)

**Generated:** 2026-10-20  
**Purpose:** Single index of automated checks, counts, and npm entry points.

## Summary counts

| Layer | Suite / artifact | Cases (approx.) | Command |
|-------|------------------|-----------------|---------|
| Server actions | `scripts/f5-action-contracts.ts` | 16 smoke + **53** inventoried actions | `npm run test:f5-action-contracts` |
| Lib unit | `scripts/e2-unit-checks.ts` | 8 | `npm run test:e2-unit` |
| Lib unit | `scripts/f5-lib-unit.ts` | 19 | (via `test:f5-lib-coverage`) |
| Security | `scripts/f5-security-checks.ts` | 6 (+ optional BASE HTML XSS) | `npm run test:f5-security` |
| Coverage | `scripts/f5-lib-coverage.mjs` | 4 harness scripts | `npm run test:f5-lib-coverage` |
| Load | `scripts/e2-load.mjs` | 3 routes × 50 concurrent | `npm run test:e2-load` |
| E2E Playwright | `e2e/*.spec.ts` (excl. visual) | **22** | `npm run test:e2e` |
| Visual F5 | `e2e/visual-regression.spec.ts` | **10** (5 routes × 390/1440 AR) | `npm run test:e2e -- visual-regression` |
| Regression | `scripts/week3-regression.ts` | ~49 asserts | `npm run test:week3` |
| Wholesale IDOR | `scripts/wholesale-security-checks.ts` | 9 | `npm run test:wholesale-security` |
| WhatsApp phases | `scripts/whatsapp-phase-*.ts` | 183+ | `npm run test:whatsapp-phase-*` |

**Playwright E2E total:** 22 functional + 10 visual = **32** tests (default `chromium` project).

**F5 action families covered in contracts:** admin catalog publish guards (mirror + unauthorized), retail request (invalid/honeypot + service valid), trader deal create unauthorized, wholesale/whatsapp/trader-portal unauthorized.

## Coverage & load artifacts

| File | Description |
|------|-------------|
| `docs/pro-readiness/F5-COVERAGE.txt` | lib/auth + lib/db + lib/deals import proxy (**95.2%**, gate ≥70% MET) |
| `docs/pro-readiness/F5-LIB-COVERAGE.json` | Machine-readable coverage report |
| `docs/pro-readiness/F5-ACTION-INVENTORY.json` | Exported server action list |
| `docs/pro-readiness/F5-LOAD.json` | p95, error rate, 50-way concurrency per path |

## Visual regression

- **Output:** `test-results/visual/{route}-ar-{390|1440}.png`
- **Locales:** Arabic default routes (`/`, `/catalog`, `/contact`, `/privacy`, `/request`)
- **Baselines:** First run captures PNGs only; optional snapshot compare via Playwright `toHaveScreenshot` (recommended **maxDiffPixelRatio 0.02** when baselines are checked in under `e2e/visual-regression.spec.ts-snapshots/`)

## Load gate notes

- Default **50** concurrent requests per path (`E2_LOAD_CONCURRENCY`).
- Reports **p50/p95/max** and **errorRate**; exits non-zero if any request fails (useful CI gate when `BASE` points at a running server).
