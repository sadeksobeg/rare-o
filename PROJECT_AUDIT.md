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
