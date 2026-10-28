# PROJECT_AUDIT — RARE OUD platform

Tracking doc for the comprehensive audit/repair mission. This project already
carries an extensive internal QA history — see `docs/pro-readiness/FINAL-REPORT.md`
(Rounds D–G contract matrix, 26 PASS / 5 PARTIAL / 2 OWNER-ACTION) and
`docs/ui-planning/plan/` (locked UI plan v1.0). This doc tracks work from
**this session** on top of that baseline; it does not replace the existing reports.

## Session 1 — 2026-10-28

### Starting state
- 191 modified tracked files + ~140 untracked new files sitting uncommitted,
  implementing an in-progress visual/motion redesign:
  `docs/ui-planning/VISUAL-MOTION-PLAN.md` (V1 motion foundation, V2 icon
  system — both self-reported "complete, stop until approval" for V3),
  plus a broader slice-based UI rebuild (slices A–J) already through
  `docs/ui-planning/plan/FINAL-QA-REPORT.md` (2026-10-14).
- Decision (user): finish and verify this WIP before starting a fresh audit
  cycle, rather than discard or audit around it.

### Baseline checks run against the current working tree
| Check | Result |
|---|---|
| `tsc --noEmit` | PASS, 0 errors |
| `npm run lint` | PASS, 3 pre-existing warnings (unused var, 2× exhaustive-deps), 0 errors |
| `npm run build` | PASS — all 39 routes compiled; sizes close to V2-report baseline (Home 162 kB vs 160 kB reported) |
| `npm run test:week3` | PASS — 58/58 |
| `npm run test:wholesale-security` | PASS — 9/9 |
| `npm run test:d1-axe` (92 scans: AR/EN × 390/1440 × public+admin+trader routes) | Initially 25/92 failed (flaky, different routes each run) → root-caused → **0/92 failed** after fixes |
| Live browser check: home page horizontal overflow (X07–X09, FAIL in the 2026-10-14 FINAL-QA-REPORT) | **Not reproducible** — scrollWidth == clientWidth at 390 and 1440. Already fixed by later slice work; stale finding. |

### Fixed this session
1. **`scripts/d1-axe-full.mjs`** — the axe scan fired after a fixed 500 ms wait,
   which races the new scroll-reveal system (`components/motion/reveal.tsx`,
   IntersectionObserver + staggered CSS transition, up to ~several hundred ms
   for longer lists). Axe would sometimes scan mid-transition and see
   near-invisible text, reported as a `color-contrast` violation — non-
   deterministic, a different set of ~17–25 routes failed each run. Fixed to
   wait for `.ro-reveal-base:not(.is-visible)` to clear (bounded 3 s) before
   scanning. This is a test-reliability fix; no application behavior changed.
2. **`components/storefront/cart-view.tsx`** — the pre-hydration loading
   placeholder for `/cart` was a bare `<div aria-busy aria-label>` with no
   `role`. ARIA forbids `aria-label` on a roleless div, so every single visit
   to `/cart` (not a race — this is the actual initial render before
   `useCart()` hydrates) tripped `aria-prohibited-attr`, a real, reproducible
   a11y bug introduced by this round of work. Fixed by adding `role="status"`.
   Confirmed via direct axe run (node target before fix: `aria-label` on
   `.py-24` div) and by re-running the full suite (now 0/92 failed).

### Known, already-documented, not re-litigated here
From the existing `FINAL-REPORT.md` / Round G notes — still true, not
something this session can fix:
- Storefront Lighthouse medians Home 0.82 / Catalog 0.81 / Product 0.80 vs
  the 0.85 gate (item 2.6 PARTIAL). V2-REPORT shows some improvement
  (catalog 0.99, request 0.87) but home/product still below gate.
- GitHub Actions CI blocked by billing/spending limit (G2) — owner action,
  not an engineering fix.
- OWNER-ACTION items unchanged: real WhatsApp phone pairing, VPS/DNS
  deployment, SVG logo + real photography + legal copy.

### Open decision points (asked the user, not assumed)
- Whether to proceed into **V3** of the motion plan (wiring S1–S9 into real
  storefront pages) — V1/V2 reports both explicitly gate further motion work
  behind owner approval; not started by default.
- Whether to commit the now-verified working tree, and in what batching.

### Files changed this session
- `scripts/d1-axe-full.mjs` (test reliability fix)
- `components/storefront/cart-view.tsx` (real a11y fix)
- `.claude/launch.json` (new — local dev preview config, not app code)
- `PROJECT_AUDIT.md` (this file, new)
