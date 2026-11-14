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

---

## Session 2 — 2026-10-28 — Phase One: comprehensive discovery audit

Baseline before this session: working tree clean, 8 commits from Session 1
(`7d0b030`..`9d888ca`), nothing pushed to `origin`. Confirmed clean again
before starting. V3 of the motion plan **not started**, per standing
instruction — all work below stays inside what's already wired up.

### Method
Re-verified every open finding in `docs/pro-readiness/AUDIT.md` (2026-10-18,
"STEP 1" — the most recent item-by-item code audit) against the *current*
code, rather than re-running a fresh audit from scratch, to avoid duplicating
work already on record. Added a live-browser crawl (admin login → dashboard,
AR/EN) and a from-scratch Lighthouse root-cause investigation, neither of
which that Oct 18 audit completed (both were explicitly marked BLOCKED there).

### Most important verified findings

**Already fixed since the Oct 18 audit (re-verified now, not re-reported as open):**
| Oct 18 finding | Current state | Evidence |
|---|---|---|
| V1 P0: BrandWallpaper on admin/trader violates brand plan | Fixed — `grep Wallpaper` in `components/admin/shell.tsx` / `components/trader/shell.tsx` returns nothing now | code |
| V4 P1: raw English enums leak into AR admin activity feed | Fixed — `eventKey` is now explicitly dictionary-mapped (`lib/admin/dashboard.ts:74`, consumed by `eventLabel()` in `activity-feed.tsx`) | code |
| V5 P1: demo data (`Demo Trader`, `DL-DEMO-*`) not hidden from UI | Fixed — both in `lib/admin/ui-hidden.ts` (`HIDDEN_TRADER_NAMES`, `reference.startsWith("DL-DEMO-")`) | code |
| No `rejected` deal status, only `closed` | Fixed — `DEAL_STATUSES` now includes `"rejected"` (`lib/deals/constants.ts`) | code |
| No security headers (CSP/HSTS/X-Frame/etc.) | Fixed — `next.config.ts` `headers()` + CSP nonce via `middleware.ts` (this was Round G1's work) | code + curl response headers |
| No login rate limit/lockout | Fixed — `lib/auth/rate-limit.ts`, 5 failures / 15 min window / 15 min lockout, scoped by role+identity | code |
| No magic-byte upload validation (MIME-only) | Fixed — `detectMediaMagic()` in `lib/catalog/images.ts`, rejects type mismatches | code |
| No `/api/health` endpoint | Fixed — `/api/health` and `/api/ready` both exist and build | build route list |
| axe/Lighthouse never run | No longer true — both run in this session (see below) | this session |

**Confirmed still true / newly found:**

1. **[SECURITY-HIGH, confirmed, NOT fixed] `zod` has an active high-severity DoS advisory.**
   `npm audit`: `zod <4.6.6` — GHSA-mrhx-c7xc-m3w5, CVSS 7.5, CWE-770 (memory
   exhaustion validating oversized constrained collections). `package.json`
   pins `zod: ^3.24.2`, a **direct production dependency** used for all
   input validation (`lib/validation/schemas.ts` and every service layer —
   retail/wholesale/deal — including unauthenticated storefront submission
   paths). Fix requires zod 3→4, which `npm` flags `isSemVerMajor: true` —
   a breaking change touching every schema file in the codebase. **Not
   attempted this session** — this is a major-migration-risk item requiring
   explicit authorization, not a "small independently verifiable batch."
   The other 9 high-severity `npm audit` findings (`lighthouse`,
   `puppeteer-core`, `extract-zip`, `basic-ftp`, `proxy-agent`, etc.) are all
   transitively rooted in `lighthouse`/`puppeteer-core` — devDependencies
   used only by local perf-test scripts, never shipped to the running app;
   lower real-world risk, but not yet cleaned up either.
2. **[PERF, confirmed + fixed, see below] Dead LCP preload on the home hero.**
3. **[PERF, confirmed, NOT fixed] CLS instability newly exposed on home** (see below).
4. Lighthouse storefront perf gate (0.85) — still below gate, as previously
   documented, but the local measurement environment turned out to be too
   noisy for a trustworthy median (see Lighthouse section).
5. `docs/pro-readiness/AUDIT.md`'s remaining open items (SQLite note is now
   stale — `FINAL-REPORT.md` already confirms Postgres merged; daily backup
   and 8.3 wholesale shipping fields are both already marked PASS in the more
   recent `FINAL-REPORT.md` — Oct 18 audit itself is the stale document here,
   not the app) were cross-checked against `FINAL-REPORT.md` and are not
   repeated as open findings.
6. Live admin crawl (login → dashboard, production build, port 3001): clean
   console, zero errors, correct KPI tiles, correct locale-aware greeting.
   One dev-server-only false alarm investigated and ruled out (see below).

### Lighthouse / LCP investigation (mission-requested deep dive)

**Exact conditions:** `scripts/e1-lh-budget.mjs`, mobile form factor,
simulated throttling, 5 runs/route, against a freshly built `next build` +
`next start` on port 3001 (not dev mode). Routes: home, catalog, product,
request (hard gate 0.85), admin-home, trader-home (soft gate).

**Root cause found and fixed:** `components/brand/hero-lcp-preload.tsx`
preloaded `/brand/hero-oud-atelier-f-e1.webp` (the raw file, 43 KB) with
`fetchPriority="high"`, but the actual `<Image>` in
`components/brand/hero-oud-field.tsx` (the real LCP element) is served by
`next/image` through `/_next/image?url=...&w=640&q=70` (21.6 KB) — a
**completely different URL**. Confirmed via `network-requests` audit: both
URLs were fetched as separate, unrelated requests. The preload was dead
weight; the real LCP image was only discovered once React hydrated and
resolved the component's `srcset`, consistent with the measured gap
(FCP 2.1s vs LCP 4.9s, LCP sub-score 0.29 on the pre-fix baseline). Fixed by
building the preload href as the exact `/_next/image` URL the component
requests. Single-run, post-fix measurements: LCP 2.7–3.9s (down from the
4.9s baseline every time it was re-measured), FCP as low as 1.2s (from 2.1s).

**Second, smaller fix on the same element:** the hero's entrance animation
(`@keyframes ro-oud-enter` in `app/globals.css`) animated `filter:
brightness(...)`, which the project's own `VISUAL-MOTION-PLAN.md` §3.4 rule
1 explicitly restricts ("animate only `transform` and `opacity`"). Changed
to animate `opacity` instead. This does not affect layout geometry and is
unrelated to the CLS finding below (verified by reasoning: neither `filter`
nor `opacity` affects box dimensions).

**New finding, NOT fixed — flagged, not guessed at:** once the preload fix
made the hero image load much faster, Cumulative Layout Shift on home
became measurably unstable — 0 (clean) in some runs, 0.8–0.9 (severe) in
others, non-deterministic across 5+ repeated runs. This strongly suggests a
**pre-existing** layout-shift source (prime suspect: the four Arabic/Latin
display fonts all use `font-display: swap` in `app/layout.tsx`, a very
common CLS cause) that was previously masked because the slow hero image
arrival pushed it outside Lighthouse's CLS scoring window — i.e., making
the image fast *exposed* a bug that was already there, rather than causing
a new one. Lighthouse's own root-cause gatherers
(`layout-shift-elements`, `layout-shifts`) errored in this environment
(`RootCauses` / `frame_sequence` exception — a Lighthouse/Chrome
version-compat bug here, not an app bug), and a manual
`PerformanceObserver({type:'layout-shift'})` check in an unthrottled real
browser captured zero shifts (the bug appears to need CPU throttling to
reproduce, consistent with a timing race). **Per the mission's explicit
instruction not to optimize blindly: this was not patched speculatively.**
Flagged as the top follow-up item — needs either a working Lighthouse trace
gatherer (different Chrome/Lighthouse version, or a CI run) or manual
CPU-throttled DevTools profiling to pin the exact element.

**Measurement-environment caveat (important, do not over-read any single
Lighthouth number from this machine):** repeated runs of the *same* build
swung wildly — admin-home 0.93 → 0.99, request 0.90 → 0.83, home scored
0.95, 0.68, 0.64, and 0.81 across different single-route runs minutes apart.
This machine was concurrently running Docker Desktop plus several unrelated
containers (visible in `docker ps`: ERPNext, Grafana/Loki/Tempo, n8n,
Postgres/Redis instances for other projects) started before this session,
plus the browser pane and this CLI session itself. That matches the
project's own prior conclusion (Round G) that authoritative Lighthouse
numbers should come from CI on a clean runner, not this workstation — CI is
currently blocked on the GitHub billing issue (owner action, unchanged).
**Do not treat any single local Lighthouse score in this project's history,
including the ones in this session, as a reliable pass/fail signal** — only
the relative, repeated-measurement finding (dead preload → real fix) is
trustworthy from this environment.

### Live-browser verification notes

- One hydration-mismatch console warning on `/cart` was investigated and
  **ruled out as a Next.js dev-server/Fast-Refresh artifact**, not a real
  bug: `curl`-ing the raw server HTML confirmed `role="status"` was present
  both before and after a clean dev-server restart; the same page loaded
  against a fresh `next build` + `next start` produced **zero console
  errors**. Root cause: editing a `"use client"` component mid-session can
  leave Fast Refresh's HMR state briefly inconsistent with a fresh SSR
  response. Not a defect to fix.
- One apparent "default locale is English, not Arabic" anomaly was
  investigated and **ruled out**: caused by a `ro_locale=en` cookie left
  over from this session's own earlier testing on a different port (cookies
  are host-scoped, not port-scoped, so `:3000` and `:3001` on `localhost`
  share a cookie jar). Clearing cookies and re-testing confirmed the real
  default is Arabic, as documented (`defaultLocale = "ar"` in
  `lib/i18n/config.ts`, confirmed via `getRequestLocale()` fallback logic).

### Fixed this session
1. `components/brand/hero-lcp-preload.tsx` — preload URL now matches the
   actual `next/image`-requested URL (was preloading an unused resource).
2. `app/globals.css` — `@keyframes ro-oud-enter` animates `opacity` instead
   of `filter`, per the project's own motion rules.

### Not fixed, flagged for explicit follow-up (priority order)
1. **zod high-severity DoS advisory** (production dependency, major-version
   fix, needs authorization before touching — see above).
2. **CLS instability on home**, newly exposed, root cause not yet isolated
   (needs working Lighthouse tooling or manual CPU-throttled profiling).
3. Lower-severity `npm audit` findings rooted in `lighthouse`/`puppeteer-core`
   devDependencies (9 high, transitively — not shipped to production).
4. Previously known, unchanged: storefront Lighthouse gate, GitHub billing
   block on CI, WhatsApp live session / VPS deploy / brand asset OWNER-ACTIONs.

### Tests executed this session (Phase One)
| Check | Result |
|---|---|
| `tsc --noEmit` | PASS |
| `npm run lint` | PASS (3 pre-existing warnings, same as Session 1) |
| `npm run build` | PASS (after both fixes) |
| `npm run test:week3` | PASS 58/58 |
| `npm run test:wholesale-security` | PASS 9/9 |
| `npm run test:d1-axe` (92 scans) | PASS 0/92 failed (re-confirmed after hero changes). One intermediate background run reported "67 failed" with `ERR_CONNECTION_REFUSED` errors — invalid, caused by stopping the preview dev server mid-run while that background job was still hitting it; not a regression. Re-ran clean with the server left untouched. |
| `npm run test:lh-budget` (5 runs × 6 routes) | Ran twice (before/after); see noise caveat above — not a clean signal this session |
| `npm audit --audit-level=high` | 12 vulnerabilities (2 low, 10 high) — see zod finding above |
| Live browser crawl: admin login + dashboard (prod build) | PASS, 0 console errors |
| Live browser crawl: home, catalog (dev + prod) | PASS, 0 console errors, no horizontal overflow at 390/1440 |

### Files changed this session
- `components/brand/hero-lcp-preload.tsx` (real perf fix)
- `app/globals.css` (motion-rule compliance fix, same hero component)
- `docs/pro-readiness/LIGHTHOUSE.json` (regenerated by `test:lh-budget`)
- `PROJECT_AUDIT.md` (this entry)

---

## Session 3 — 2026-10-28 — Comprehensive Product Excellence Plan (planning phase, no code changes)

Produced a full, approval-gated improvement plan per owner request, covering design research,
design system validation, page blueprints, visual prototypes, functional/business decisions,
security/ops remediation, test strategy, and a WP0–WP13 roadmap. **Zero application code, schema,
or business behavior changed** — working tree confirmed identical to Session 2's end state except
for new documentation.

Full package: `docs/excellence-plan/00-INDEX.md` and its linked documents. Headline finding: 13 of
~16 previously-open audit items are already fixed in code (mostly from Sessions 1–2); remaining
open items are the zod CVE (WP0-B1), the CLS regression (WP0-B2), three beyond-contract features
needing owner acknowledgment (not a code fix), and the already-tracked owner-action items.

One factual correction recorded: the mission brief assumed SQLite is the current database; the
database has in fact been PostgreSQL 16 since Round D2 (already merged, already approved, not a
new decision) — see `docs/excellence-plan/08-SECURITY-AND-OPERATIONS.md`.

This phase stops at the WP5 approval gate. No further work proceeds until the owner reviews
`docs/excellence-plan/` and approves.

---

## Session 4 — 2026-10-28 — Execution: Track A (security), Track D (perf), Track C (verified)

Owner explicitly approved the plan and authorized implementation beyond WP5. This session executed
the highest-priority, well-scoped items. Full detail and evidence in `docs/excellence-plan/`
(updated); summary here.

### Track A — zod 3→4 migration (WP10, done)

Inventory: exactly one file imports `zod` directly (`lib/validation/schemas.ts`), six consumers,
all via the identical narrow pattern (`.safeParse` + `.error.issues[0]?.message`). Bumped
`zod@^3.24.2` → `^4.6.7`. Verification: `tsc` clean, `build` clean, `test:week3` 58/58,
`test:wholesale-security` 9/9, `test:f5-action-contracts` 16/16, plus a dedicated 20-case smoke
test (not committed, throwaway) covering every schema's success/failure paths, `superRefine`
custom issues, and `preprocess` chains — 20/20, zero regressions. `npm audit`: the app's own zod
no longer appears as a direct finding; one transitive zod remains via `puppeteer-core`/
`chromium-bidi` (devDependency, not shipped, documented, low-priority optional cleanup).
Live browser re-verification post-migration: admin login → dashboard, zero console errors.
Commit `b629cfd`.

### Track D — homepage CLS investigation (WP11, root-caused + partial fix)

Lighthouse's own trace gatherers error in this environment (confirmed again). Built a direct
CDP + native `PerformanceObserver` profiler instead, connected to the exact Chrome instance
`chrome-launcher`/Lighthouse itself spawns. **Finding: the dominant reported shift (~1.0 of a
measured ~1.17) was the `<html>` root element resizing from a small default window to its final
size mid-measurement — a test-harness artifact** (Chrome launching without an explicit window
size, racing against Lighthouse's `screenEmulation` CDP call), **not an application defect.**
Fixed by pinning `--window-size=390,844` in `scripts/d4-lh-once.mjs`. With the window-size race
eliminated and the viewport set before any navigation, true native-browser CLS measured 0 in 5/6
runs and 0.086 in 1/6 — both within the ≤0.1 "good" budget. Honest residual: Lighthouse's own
reported score (run through its full pipeline) still shows some flakiness post-fix (2/3 clean,
1/3 still read 0.913) — a secondary timing sensitivity inside Lighthouse's own sequencing that
this fix can't reach from outside the library. Recommendation: trust the direct
`PerformanceObserver` measurement (consistently healthy) over any single local Lighthouse run.
Previously-fixed LCP (Session 2, dead preload) re-verified intact throughout: 2.6–3.4s across
every run. Commit `565b3cc`.

### Track C — RoListCard consolidation: verified already substantially implemented, not rebuilt

Before forcing the `RoListCard` prototype into production, checked the real current architecture
(per instruction: "if a roadmap item is already correctly implemented... record the evidence and
move on"). **Finding: trader and admin already share one visual foundation** — the `ro-portal-card`
CSS utility class, used consistently across 28 files spanning `components/trader/deal-card.tsx`,
`components/admin/list-record-card.tsx`, `action-queue.tsx`, `activity-feed.tsx`,
`connection-card.tsx`, `dashboard-aside.tsx`, `manage-hub.tsx`, and more. `DealCard` is already
reused directly across trader deals, trader home, *and* trader wholesale requests — wholesale was
never a separate implementation. Admin's `AdminRecordCard` is the established mobile fallback for
every `DataTable` usage. Only the storefront catalog `ProductCard` is visually distinct from these,
correctly so — it's an image-led merchandising card (hover-swap gallery, quick-add, compare-at
pricing) with a fundamentally different job than an operational record row, exactly the kind of
difference the mandate said to preserve, not flatten.

**Conclusion: no `RoListCard` component was built into the application.** The original WP3 proposal
was based on a surface-level read of four page types without checking the shared CSS layer
underneath; the real architecture already achieves the same goal (one consistent visual language,
purpose-fit components) through a better mechanism (a shared token class + focused components)
than the single-component-with-many-variants approach the plan proposed. Building it anyway would
have meant discarding working, tested components for a redundant abstraction — directly against
instruction. Live-verified via browser: admin dashboard record cards render correctly, consistent
with the trader portal's own cards, zero console errors. No commit — no code change was warranted.

### Full regression re-run after all Session 4 changes

| Check | Result |
|---|---|
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `test:week3` | PASS 58/58 |
| `test:wholesale-security` | PASS 9/9 |
| `test:d1-axe` (92 scans) | PASS 0/92 failed |
| Live browser: admin login → dashboard (zod-migrated build) | PASS, 0 console errors |

### Not done this session — honest accounting against the full mandate

Given the scope of the full mandate (every roadmap track, every route, full release-readiness),
this session prioritized the highest-severity/highest-confidence items (security CVE, measured
perf regression, and verifying rather than blindly rebuilding the design-system item) over breadth.
**Not done:** WP6 storefront visual redesign work beyond what Sessions 1–2 already shipped (no
further UI changes were identified as *necessary* — see Track C finding above); full route-by-route
state verification (loading/empty/error/success) beyond what's already spot-checked; WP12
(deployment — owner-gated); WP13 (WhatsApp — explicitly deferred). These remain open; see the
roadmap for sequencing.

---

## Session 5 — 2026-10-28 — Real UI/UX implementation pass (skills-driven)

Per owner instruction: implementation, not another audit. Consulted the `frontend-design` skill
(general calibration — confirmed not the operative source here) and, more usefully, the project's
**own** binding design rules (`.cursor/rules/rareoud-ui.mdc`, `docs/ui/01_DESIGN_SYSTEM.md`), which
contain a 10-item diagnosis checklist from an earlier audit round. Tested each against the live
app rather than trusting the old report.

**Finding:** 9 of 10 diagnosed issues already fixed (Session 1's admin work — command palette,
sparkline, dashboard-aside, full-ink sidebar). **One genuine, still-live defect found and fixed:**
admin dashboard's main grid (`ActionQueue` col-span-7 + `DashboardAside` col-span-5) had no
`align-items` override; CSS Grid's default `stretch` forced the much-shorter `DashboardAside` to
match `ActionQueue`'s height, leaving one card rendered as a mostly-empty box up to 573px tall.
Fixed with `items-start` (`app/admin/(protected)/page.tsx`). Verified via direct DOM measurement
(not screenshot alone) at 900px and 1440px: aside height 573px (broken) → 360px (natural) at both
widths, both panels top-aligned in the shared row. Commit `767db91`.

Checked two visually-similar patterns for the same bug class and confirmed **both are correctly,
deliberately built** — not touched: trader home's 6/6 grid (`items-stretch` + explicit `flex-1` on
both sides' inner content — intentional balanced panels, labeled "TR-02 desktop: waiting + tasks
balanced 6/6" in a comment) and product detail's info column (`self-start` + `sticky` — standard
PDP pattern). Recording this is as important as the fix itself: it proves the check was real, not
a search-and-replace of every `grid` in the codebase.

**Tooling note:** found and worked around a real limitation — the browser pane's screenshot tool
does not reliably capture content at a scroll position reached via `window.scrollTo()`; a position
with verified real DOM content rendered as a completely blank screenshot. Cross-checked everything
visually ambiguous against exact DOM `getBoundingClientRect()` measurements instead of trusting
screenshots alone, and explicitly avoided shipping a second "fix" based on that artifact.

### Tests executed and results
| Check | Result |
|---|---|
| `tsc --noEmit` | PASS |
| `npm run lint` | PASS (3 pre-existing warnings, unrelated) |
| `test:week3` | PASS 58/58 |
| `test:d1-axe` (92 scans) | PASS 0/92 failed — re-confirmed after the grid fix |
| Live browser: admin dashboard, 900px + 1440px | PASS, fix confirmed via DOM measurement |
| Live browser: homepage, 390px / 768px / 1440px, Arabic RTL | PASS, no overflow, hero/nav/principles render correctly |

### Remaining this track
Full route-by-route visual pass not yet done this session (catalog, product, cart, trader
deals/wholesale, every admin table) — this session prioritized depth (find, correctly fix, and
verify one real bug, plus rule out two near-misses) over breadth, consistent with "small, verified
implementation cycles." Continuing to the next route.

### Files changed this session
- `app/admin/(protected)/page.tsx` (real layout fix)
- `docs/pro-readiness/AXE-RESULTS.json` (regenerated)
- `PROJECT_AUDIT.md` (this entry)

---

## Session 6 — 2026-10-30 — REMAINING-PLAN.md Phase 0 + Phase 1

Phase 0 (safety net) and Phase 1 (security gaps) executed per
`docs/ui-planning/REMAINING-PLAN.md` on branch `feat/port-lab-to-real` then
`phase/01-security`. Full reports live in this session's chat log; summary here
for future sessions.

**Phase 0:** committed and pushed Cursor's uncommitted port work (9 commits),
reconciled the `20261029160000_brokerage_request_photos` migration (proved no
drift, `migrate resolve --applied`, proved the migration SQL on a disposable
fresh database), cleaned 12 leftover E2E test rows, made
`scripts/brokerage-lifecycle-e2e.ts` self-cleaning + added the CANCELLED
scenario, added the AR/EN dictionary-keys section to `BROKERAGE-SPEC.md`.
Push initially failed twice with a mid-transfer HTTPS connection reset on the
~77MB/55-commit payload (not a credential or file-size issue) — resolved by
splitting the push into two smaller transfers.

**Phase 1:** AUDIT-2026-10-30.md's C-1 and C-2 findings fixed and verified live:
- **C-1 (brokerage photos unauthenticated):** moved storage from
  `public/uploads/brokerage` to `storage/uploads/brokerage` (outside the web
  root, gitignored), added `app/api/media/brokerage/[requestId]/[file]/route.ts`
  (session + ownership check, strict filename validation, path-traversal
  guard, 404 never 403). Verified with a real HTTP test against the running
  dev server (`scripts/brokerage-media-security-checks.ts`, 9/9 passed:
  unauthenticated/wrong-trader/traversal → 404, owner/admin → 200).
- **C-2 (no forced password change):** additive migration
  (`mustChangePassword`, `passwordChangedAt` on `AdminUser` and
  `TraderAccount`), server-enforced via `requireAdminSession`/
  `requireTraderSession` (DB-authoritative, not just the JWT claim) plus a
  middleware redirect, a `pwv` JWT claim that invalidates sessions on other
  devices the moment a password changes, `/admin/force-password-change` and
  `/trader/force-password-change` screens, an admin "reset trader password"
  action, and the same `ChangePasswordForm` reused in profile/security.
  Verified live end-to-end in both AR and EN (reset → forced screen → change
  → access restored → old temp password confirmed rejected).
- Security sweep: extended login rate-limiting to the two new change-password
  actions; confirmed `next.config.ts` + `middleware.ts`/`lib/security/csp.ts`
  already carry a full header set (CSP with per-request nonce, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS in prod) —
  nothing missing, nothing changed there.

**Gap found, not fixed (out of scope for Phase 1 — recorded per CLAUDE.md):**
the dev database has 7 leftover test trader accounts
(`f5-trader-a@rareoud.local`, `f5-trader-b@rareoud.local`, four
`e2e-trader-*@rareoud.test`, `e2e-foreign-trader@rareoud.test`) left behind by
`scripts/f5-security-checks.ts` and other e2e scripts that, unlike
`brokerage-lifecycle-e2e.ts` (fixed in Phase 0 this session), don't delete
their own rows. Low impact (dev DB only, doesn't affect production data or
security), but should be fixed the same way before Phase 2's broader
regression runs accumulate more of them.

### Tests executed and results
| Check | Result |
|---|---|
| `tsc --noEmit` | PASS |
| `next lint` | PASS (4 pre-existing warnings, unrelated) |
| `npm run build` | PASS (clean, all routes) |
| `check:i18n` | PASS — 1080 string keys match AR/EN |
| `test:week3` | PASS 58/58 |
| `test:wholesale-security` | PASS |
| `test:brokerage-media-security` (new) | PASS 9/9, live HTTP against dev server |
| `brokerage-lifecycle-e2e.ts` | PASS, self-cleaning confirmed |
| Live browser: reset → forced change → access restored, AR | PASS |
| Live browser: reset → forced change → access restored, EN | PASS |
| Live browser: old temp password rejected after change | PASS |

### Files changed this session
Commits `3b19c3b`, `52f65c3`, `4df5128`, `c7ff622` on `phase/01-security`
(branched from `feat/port-lab-to-real` at `ae819db`) — see commit messages for
the full file list per commit.

## Session note — 2026-10-31 — WhatsApp number survival (owner constraint)

**Owner:** Official WhatsApp Business / Cloud API is blocked; product must stay
on unofficial linked-device (Baileys). **#1 priority:** avoid phone number ban.

Recorded as standing rule in
`docs/ui-planning/DECISIONS-ADDENDUM.md` (section “WhatsApp number survival”).
Do **not** swap stack to Mid Auto `whatsapp-web.js`.

**Shipped (code only, kill switch still off):** `lib/whatsapp/outbound-safety.ts`
wired into enqueue + `dispatchOutboundMessage` (before claim); tunables in
`.env.example` / `ENV-REFERENCE`; gate `npm run test:whatsapp-outbound-safety`.

**STOP until separate owner OK:** no QR scan; no
`WHATSAPP_OUTBOUND_ENABLED=true`.

## Session note — 2026-10-31 — WhatsApp desk parity (code)

Built human desk features on Baileys (no live enable): typed media inbound/
outbound, private `storage/uploads/whatsapp`, admin media API, CRM
`customerId`/`traderId` + phone suggestions, brokerage request link type.
Migration `20261031170000_whatsapp_desk_media_crm` additive — apply when
Postgres is reachable. Kill switch remains off.

## Session note — 2026-11-01 — Admin + Trader VISION program (started)

Owner approved VISION-first plan (dark luxury + stronger motion; Framer/`motion`
allowed; trader tabs = 5 with Brokerage replacing Offers). Shipped foundation:
`rareoud-ui.mdc` authority update; dark `data-theme` tokens + `PortalTheme`;
shells on Sonner-only toasts + `LazyMotion`; login ceremony MotionProvider;
admin sidebar user collapse + h-16; trader 5-tab shell; unsaved guards + empty
CTAs on admin ops; wholesale/brokerage drafts; brokerage list/detail dict i18n;
home per-block errors. Evidence:
`docs/ui-planning/evidence/phase-vision-admin-trader.md`. Further depth
(charts choreography, inbox a11y English aria, full axe matrix) continues
under the same plan acceptance gates.

## Session note — 2026-11-01 — VPS deploy (isolated + media)

Owner approved plan `rareoud_vps_deploy_9c2a49cf`. Live on Hostinger VPS
`72.62.155.198` beside Tenegta — **Tenegta untouched**.

| Layer | Location |
|---|---|
| Code | `/srv/rareoud` |
| Data | `/var/lib/rareoud/{media,wa-auth,pg,backups}` |
| Compose | project `rare-oud-prod`, network `rareoud` |
| Edge | host nginx → `127.0.0.1:3010` |
| Public | `https://rareoud.com` (LE cert to 2027-01-30) |

DNS: use Hostinger **dns-parking** NS (`ns1`/`ns2.dns-parking.com`) — not
`ns1.hostinger.com` (those refuse customer zones). A `@` → VPS IP; `www` CNAME.

WhatsApp kill switches remain off (`CONNECT_ON_START=false`,
`OUTBOUND_ENABLED=false`). Worker idle / no session files.

Verified: public smoke 200 on `/`, `/api/health`, `/api/ready`, `/catalog`,
login pages; `https://tenegta.com` + `mail.tenegta.com` OK; daily backups
writing under `/var/lib/rareoud/backups`; hourly disk alert cron
(`/usr/local/sbin/rareoud-disk-alert.sh`, gate free &lt;40GB / media ≥75%/90%).

**Still owner-gated:** live WhatsApp QR/outbound; Object Storage; do not run
`docker compose down -v` on this host.

## Session note — 2026-11-05 — Contract 7.1 closed + Section 07 client report

Closed **7.1 Encryption & Secure Storage** within contract scope (app-layer
sensitive credentials + TLS; field-level Postgres PII still out of scope):

- Gate: `npm run test:security-storage` (`scripts/security-storage-gate.mjs`)
- Docs: `docs/security/ENCRYPTION-AND-STORAGE.md`, `ASVS-L2.md` (TOTP marked shipped)
- `.env.production.example` documents `WHATSAPP_AUTH_KEY` (WA connect/outbound still false)
- Client AR delivery: `docs/client-report/SECTION-07-CLIENT-DELIVERY-AR.md`
- Matrix: FINAL-REPORT + DELIVERY-VS-CONTRACT — **7.1–7.5 PASS**; **9.1 live WhatsApp** remains the open owner gate

`npm run report:counts` after matrix edit: PASS 30 · PARTIAL 3 · OWNER-ACTION 0.

## 2026-11-14 — Wholesale test round 1 (findings)
Fixed (6ddebdf): `WH-YYYY-NNNN` reference collided in a real test run (9000 values, no retry) → now `WH-YYYY-XXXXXX` (crypto, 5 retries); admin now gets a live toast on new wholesale request / quote accepted / declined.
Open (not fixed, awaiting owner direction):
1. Admin wholesale detail: "Operations" (the quote/transition controls) sits below the shipping card — primary action is buried; same stage-gating as retail (show only what applies) is advisable.
2. Admin wholesale detail: the "تتبّع الشحنة" button in the shipping card has no handler (dead button); shipping fields show even before confirmation.
3. Trader is notified in-portal only (`notifyTrader`); no WhatsApp message to the trader on quote / status change (retail has this). Needs owner decision.
4. No admin ops-alert entry for wholesale (dashboard queue only).
Not yet covered: full UI walk-through with browser (trader create → admin quote → accept → handoff), deals track.

## 2026-11-14 — Deals test round 1 (findings)
Fixed (6a5457f + label): `DP-YYYY-NNNN` reference (4 digits, Math.random, no retry) → `DP-YYYY-XXXXXX` crypto + retry; admin live toast on new deal / trader reply / accept / reject / close; trader now told in platform inbox + WhatsApp on admin accept/reject/close/counter and payment confirmation (`lib/trader/notify-channels.ts`); trader deal page label "الإجمالي" for a unit-price field → "السعر المقترح". New check: `npm run test:deals-flow` (8 pass).
Verified in browser (local): trader creates non-catalog deal (3-step wizard) → admin sees it → admin accept (confirm dialog) → awaiting_payment card with "confirm payment" action.
Open (awaiting owner direction):
1. Unclear whether `proposedPrice` is per-unit or total (form label "السعر (مطلوب)"); admin card says "الشروط التجارية الحالية". Decide and label consistently.
2. Admin awaiting_payment view repeats the commercial terms twice (payment card + details card).
3. Admin deal reply form lists all five actions at once (continue/counter/accept/reject/close); stage-gating like wholesale/retail would reduce confusion.
4. Payment-confirm step not clicked in browser (covered by service check).
