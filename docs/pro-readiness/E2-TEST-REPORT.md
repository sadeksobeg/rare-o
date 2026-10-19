# E2 test report (Closure Round E2)

**Date:** 2026-10-19

## Deliverables

| Item | Status |
|------|--------|
| E2E skip audit | `E2-SKIP-AUDIT.md` — 0 `test.skip` in `e2e/` |
| Playwright multi-browser + mobile projects | `playwright.config.ts` |
| Global seed pipeline | `e2e/global-setup.ts`, `e2e/ensure-seed.ts` |
| Support matrix | `SUPPORT-MATRIX.md` |
| Accessibility statement | `ACCESSIBILITY-STATEMENT.md` |
| Unit-style checks | `npm run test:e2-unit` → `scripts/e2-unit-checks.ts` |
| Load smoke (p95) | `npm run test:e2-load` → `scripts/e2-load.mjs` |

## Commands

```bash
npm run db:migrate && npm run db:seed && npm run db:seed:demo
npm run test:e2-unit
npm run test:e2e                    # server on :3000; set DATABASE_URL
npm run test:e2-load                # optional BASE=http://127.0.0.1:3000
```

## CI note

Full Playwright matrix (5 projects × all specs) is **local/optional** — default CI job runs lint, tsc, build, week3, Docker (E4). Run `test:e2e` on a workstation or dedicated E2E job when browsers are installed.

## Verification (agent run)

- `test:e2-unit`: run during commit prep (see commit message / CI log).
- E2E: requires running Next dev/prod + Postgres; not executed in this closure pass unless local server was up.
