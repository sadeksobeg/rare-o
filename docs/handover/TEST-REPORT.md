# Handover test report (aggregated)

**Last updated:** 2026-10-19 — placeholders from Closure D4/E2; refresh after E2/E5 gates on target host.

## D4 baseline (FINAL-REPORT)

| Gate | Result | Proof |
|------|--------|-------|
| `npm ci` + migrate + build | PASS | `docs/pro-readiness/FINAL-REPORT.md` |
| week3 regression | **58/0** | FINAL-REPORT |
| Playwright | **18 passed, 3 skipped** | `docs/pro-readiness/D4-E2E-RESULTS.txt` |
| axe | **92 scans, 0 critical/serious** | `docs/pro-readiness/D4-AXE-RESULTS.txt` |
| Lighthouse mobile medians | Home **0.79**, Catalog **0.78**, Product **0.77**, Request **0.81** | `docs/pro-readiness/LIGHTHOUSE.json` |
| Restore drill | **22/22** tables | `docs/pro-readiness/D2-RESTORE-DRILL.json` |
| `smoke:prod` | PASS (local :3001) | `docs/pro-readiness/D4-SMOKE.txt` |

## E2 (target — update when run)

| Gate | Target | Status |
|------|--------|--------|
| E2E skips | 0 `test.skip` in `e2e/` | See `docs/pro-readiness/E2-SKIP-AUDIT.md` |
| `test:e2-unit` | PASS | Run on workstation |
| `test:e2e` full matrix | PASS | Requires Postgres + browsers |
| `test:e2-load` | p95 within budget | `scripts/e2-load.mjs` |
| Lighthouse budget | ≥ **0.85** mobile medians | `npm run test:lh-budget` |

## E5 content gates

| Command | Expectation |
|---------|-------------|
| `npm run catalog:import -- --dry-run` | Valid rows, no DB writes |
| `npm run check:placeholders` | FAIL until legal copy finalized |
| `npm run seo:validate` | PASS against running `BASE` |

## Commands (quick)

```bash
npm run test:week3
npm run test:e2e
npm run test:c6-axe-lh
npm run smoke:prod -- https://YOUR_DOMAIN
npm run seo:validate -- https://YOUR_DOMAIN
```

Replace numbers in this file after each release candidate.
