# Section 9 — Test and Acceptance Strategy

Minimal, maintainable tool set — reusing the project's own existing choices (Playwright, axe, Lighthouse, the Node regression scripts), not introducing a parallel framework.

## What actually ran this session (accurate record — PASS means it ran and passed, not that it compiled)

| Check | Tool | Result | Evidence |
|---|---|---|---|
| Type checking | `tsc --noEmit` | PASS | Clean exit, this session |
| Lint | `next lint` / ESLint | PASS (3 pre-existing warnings, 0 errors) | This session |
| Production build | `next build` | PASS | This session, multiple times |
| Domain regression (retail/deal/wholesale/security) | `scripts/week3-regression.ts` | PASS 58/58 | This session |
| Wholesale IDOR/ownership | `scripts/wholesale-security-checks.ts` | PASS 9/9 | This session |
| Accessibility (92 scans: AR/EN × 390/1440 × public/admin/trader) | `@axe-core/playwright` via `scripts/d1-axe-full.mjs` | PASS 0/92 failed (one intermediate run invalidated by this session stopping the dev server mid-run — corrected, re-run clean) | This session, `docs/pro-readiness/AXE-RESULTS.json` |
| Performance (Lighthouse, 5-run median × 6 routes) | `scripts/e1-lh-budget.mjs` | **Ran, mixed/unreliable** — see note below | `docs/pro-readiness/LIGHTHOUSE.json` |
| `npm audit` | npm | Ran — 12 findings (2 low, 10 high); see WP0-B1/B4 | This session |
| Live browser crawl (admin login→dashboard, home, catalog, trader login) | Browser pane, production build | PASS — 0 console errors on the production build | This session |

**Lighthouse reliability note (do not treat as a clean PASS or FAIL):** measurements swung widely run-to-run on this development machine (admin-home 0.93↔0.99, home 0.64↔0.68↔0.81↔0.95) because several unrelated Docker containers from other projects were running concurrently throughout testing. The *relative* finding (fixing a dead LCP preload measurably improved LCP every time it was re-measured: 4.9s → 2.7–3.9s) is trustworthy; the *absolute* pass/fail numbers against the 0.85 gate are not, on this machine. Authoritative grading needs a CI runner (currently blocked, WP0-B5) or a dedicated quiet machine.

## Not yet executed this session (recorded honestly as not run, not assumed passing)

| Check | Why not run | When scheduled |
|---|---|---|
| Full browser-based E2E journeys (`npm run test:e2e`, Playwright) | Out of scope for a planning/audit session — this is an implementation-phase gate | WP11 |
| Database migration + restore drill re-run | No new migration was applied this session | WP10, if/when the zod migration or any schema change lands |
| Production deployment acceptance (`smoke:prod` against a real public URL) | No production deployment exists yet | WP12 |
| Load test against the login rate-limiter | Code-verified only, not exercised under load | WP11 |
| Full E2E coverage of every storefront/trader/admin state (loading/empty/error/success) | Scoped as a dedicated WP11 pass across all routes; spot-checked only on home/cart this session | WP11 |

## Acceptance criteria template (applied per work package in the roadmap)

Every WP6–WP12 roadmap item must show, before being marked complete:
1. The specific automated check(s) that ran, with pass/fail counts (not "looks fine").
2. A live browser verification for any UI-observable change (screenshot or described interaction), not just a green build.
3. No regression in the 58/9/92-scan baselines above.
4. For anything touching validation, auth, or data integrity: an explicit IDOR/ownership check, following the existing `week3-regression.ts` / `wholesale-security-checks.ts` pattern rather than a new ad-hoc test style.
5. For anything touching the database: evidence the change is additive/reversible, or an explicit backup+restore-drill re-run if it is not.

## Minimal tool combination by layer (do not add more than this)

| Layer | Tool | Already in project? |
|---|---|---|
| Types | `tsc` | Yes |
| Lint | ESLint / `next lint` | Yes |
| Unit/domain regression | Plain Node scripts (`scripts/*.ts` via `tsx`) | Yes — project's own established pattern, not Jest/Vitest; no reason to introduce a second framework |
| E2E | Playwright | Yes |
| Accessibility | `@axe-core/playwright` | Yes |
| Performance | Lighthouse + `chrome-launcher` | Yes |
| Security dependency scan | `npm audit` | Yes (no dedicated script wrapper yet — see WP1 recommendation) |
