# Independent Verification Audit — Phase 2 (Foundation)

**Mode:** read-only verification. No fixes, commits, migrations, or pushes were made.
This audit was run with no memory of the implementation session, per this project's
standing practice (see `AUDIT-PHASE-1.md`). Several throwaway probes were created during
this audit and have all been deleted; see "Temporary probes created and removed" at the end.

**Scope read:** `docs/ui-planning/MASTER-BUILD-PLAN.md` (Parts B/C/D, Phase 2 prompt),
`docs/ui-planning/DECISIONS-ADDENDUM.md` ("Phase 2 (Foundation)" section),
`docs/ui-planning/evidence/phase-02-reconciliation.md`,
`docs/ui-planning/DOD/{ADM-00,TRD-00,SF-SHELL}.md`, and the 10 commits on
`phase/02-design-system` (`19db7d3..HEAD`, i.e. `c1a6ce7`…`3340a52`).

---

## 1. Git state

- Branch `phase/02-design-system`, working tree clean, up to date with
  `origin/phase/02-design-system` (verified at session start via `git status` /
  `git log --oneline -vv`).
- `git log --oneline 19db7d3..HEAD`: exactly the 10 commits named in the brief
  (`c1a6ce7` → `3340a52`).
- `git diff --stat 19db7d3..HEAD`: **25 files, +747/-77**. Full file list reviewed —
  **no file under `middleware.ts`, `lib/auth/*`, `prisma/migrations/*`,
  `lib/whatsapp/*`, or `.env*` appears anywhere in the diff.** This was genuinely a
  design-system/foundation phase; nothing security- or data-model-adjacent was touched.
  `prisma/schema.prisma` itself was **not modified at all** this phase (no migration
  added, additive or otherwise).
- Files touched: 2 docs-only commits (`DECISIONS-ADDENDUM.md`, 3 `DOD/*.md` files,
  `evidence/phase-02-reconciliation.md`) plus 8 code/feature commits across
  `app/`, `components/`, `lib/`, `scripts/check-i18n.ts`. All in scope for "Foundation."

**Verdict: clean.** No secrets, no destructive migration, no out-of-scope files.

---

## 2. Quality gate (run independently, this session)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **PASS**, 0 errors |
| `npm run lint` (`next lint`) | **PASS**, 0 errors, 3 pre-existing warnings (`login-form.tsx`, `cart-provider.tsx`, `text-field.tsx` — all `react-hooks/exhaustive-deps`, none touched this phase). One fewer warning than Phase 1's baseline of 4, consistent with the `security-settings.tsx` unused-var warning being resolved by this phase's `enrollLabel` fix. |
| `npm run build` (clean `.next`) | **PASS** on retry — first attempt failed with a `next/font` Google Fonts `TypeError: Cannot read properties of null` (webpack loader crash), **same transient network/font-cache symptom independently flagged in `AUDIT-PHASE-1.md` §2**; a second clean build succeeded, all routes compiled. Reproduced this exact flake twice more later in the session; always resolved on retry. Not a Phase-2 defect. |
| `npm run check:i18n` | **PASS** — 1085 string keys match AR/EN; ratchet reports `55` violations against `BASELINE = 55` in `scripts/check-i18n.ts:64` — **exact match**, confirming the final commit's "correct the baseline" claim. |
| `npm run test:week3` | **PASS** — 58/58 |
| `npm run test:wholesale-security` | **PASS** — 9/9, self-cleaning (script removes its own fixtures) |

**Bundle sizes** (fresh production build, this session): `/admin` = 679 B / 126 kB first
load — **exact match** to `DOD/ADM-00.md`. `/trader` = 4.09 kB / 129 kB first load —
first-load figure matches `DOD/TRD-00.md` (129 kB) but the page-own size differs (4.09 kB
vs. the documented 3.6 kB). Low-impact, informational only (see Finding L-2).

---

## 3. Claim verification table

| Claim (`DECISIONS-ADDENDUM.md` / DOD files) | Status | Evidence |
|---|---|---|
| 3D logo scene: real Canvas renders on `/admin/login` and `/trader/login`, zero console errors, Three.js chunk not in the login routes' initial JS | **VERIFIED** | Live (prod build + dev server, Playwright): `canvas` element present on both routes, 0 console errors (only pre-existing THREE.js deprecation *warnings*, not errors). Build manifest (`.next/app-build-manifest.json`) for `/admin/login` lists 11 chunk files — none match the large bundled chunks (380 KB / 360 KB / 284 KB) found under `.next/static/chunks/`, confirming the 3D scene is a separate, lazy chunk. `/admin/login` and `/trader/login` both report 130 kB first load in the production build, in line with ordinary route overhead, not a library the size of Three.js. |
| 3D scene: `prefers-reduced-motion` renders the static fallback, no crash | **VERIFIED** | Live test with Playwright's `browser_emulate_media({reducedMotion: 'reduce'})`: `document.querySelectorAll('canvas').length === 0` and `window.matchMedia('(prefers-reduced-motion: reduce)').matches === true` on a fresh `/admin/login` load, 0 console errors. Re-toggled to `no-preference` on the same page: canvas returned (`1`). Code review of `components/brand/logo-scene-mount.tsx:59-78` confirms the `skip3d` state gate matches this behavior exactly. |
| Storefront search "now works from every page, not only `/`" (`GlobalSearchMount`, nested `DiscoveryProvider`) | **PARTIALLY FALSE — see Finding H-1** | The `GlobalSearchMount` infrastructure itself works: manually dispatching `window.dispatchEvent(new Event('ro:open-search'))` on `/catalog` opens the real, full-screen overlay with live catalog data (`قانون مختار`, `موالف رقمي`, …, 9 results) and a working close button — this part of the claim is genuine. **But the header's actual search button never fires that event outside the homepage.** `components/storefront/header.tsx:87-93`'s `openSearch()` only dispatches `ro:open-search` when `isHome` is true; on every other route (including `/catalog`, the exact route named in the DOD file as "verified live") it instead runs `window.location.href = href("/catalog", locale)` — a full-page navigation. Confirmed live: clicking the real button on `/catalog` (both via a real Playwright click and a raw DOM `.click()` with an event listener attached) produced `fired: false` and a full page reload to the same URL, not the overlay. `header.tsx` was **not touched** in this phase's diff. |
| Homepage's own `DiscoveryProvider` (quick-view/compare) unaffected by the new global one nested around it | **VERIFIED (narrowly)** | Live on `/`: search button *does* open the overlay correctly (home is the one place `isHome` is true), and the quick-add-to-cart button on a product card worked (cart count went 0→1), confirming the homepage's product-grid interactivity still functions with the nested provider in place. A dedicated quick-view *modal* and the compare feature specifically were not separately exercised (no `aria-label` for them was found in a DOM scan of the rendered homepage) — not falsified, just not independently isolated this audit. |
| i18n ratchet: baseline matches the accurate script-reported count; 5 real fixes landed; several "false positives" named are genuinely data-locale selection, not UI strings | **VERIFIED, with an additional caveat the addendum itself anticipates** | `BASELINE = 55` in `scripts/check-i18n.ts:64` exactly matches the script's own printed count (`55`). Sampled the 5 named "false positive" locations (`product/[slug]/page.tsx:107`, `admin/inbox/layout.tsx:20`, `storefront/header.tsx:23`, `lib/seo.ts:19,38`, `lib/utils.ts:14`) — all 5 are genuinely bilingual-field/locale-code selection, not hardcoded UI copy; claim holds. However, sampling *outside* that named list turned up **at least two more of the same false-positive pattern that the addendum doesn't mention**: `components/admin/locale-toggle.tsx:15` (`locale === "ar" ? "en" : "ar"`, a locale code, not a string) and `app/trader/(protected)/notifications/page.tsx:54-55` (bilingual DB field selection, same pattern as the disclosed product-page example). This doesn't contradict the addendum's claim — it explicitly says "the ratchet count therefore overstates true UI-string debt; a future pass should classify the full list" — but it means the overstatement is larger than the 5 examples given would suggest. Also spot-checked a non-disclosed, *genuine* violation (`components/admin/shell.tsx:62`, `"الفريق" : "Team"` hardcoded in nav) to confirm the ratchet isn't hiding real debt behind the false-positive framing — confirmed genuine, correctly left uncounted as "fixed." |
| Recharts dashboard renders live, `DomainBreakdown` genuinely removed | **VERIFIED** | `grep -rn "DomainBreakdown"` across the repo (excluding `node_modules`/`design-lab`) returns **zero matches** — fully removed, no dead references. Live test: logged into `/admin` with a throwaway admin account (production build), `.recharts-wrapper`/`svg.recharts-surface` present, `.recharts-pie-sector` count = 4 (retail/deal/wholesale/brokerage), matching the dashboard's own legend (17/0/0/1, i.e. 94%/0%/0%/6%). |
| Command-palette brokerage search: a real query against `BR-SEED-014` returns a hit | **TRUE AT THE FUNCTION LEVEL — but the entire command palette is unreachable in the live app, undisclosed. See Finding H-2.** | Ran `searchAdminCommand("BR-SEED-014")` directly (`lib/admin/command-search.ts`): returns one hit (`/admin/brokerage/cmvthjgrs001oeplc0g4h2ebg`, title `BR-SEED-014`, subtitle `Demo Trader`) — the narrow claim is correct. But `grep -rln "AdminCommandSearchMount"` across the repo shows the component is **defined and exported but never imported/rendered anywhere** — not in `components/admin/shell.tsx` (which is what `app/admin/(protected)/layout.tsx` actually renders), not anywhere else. Live confirmation: pressed `Ctrl+K` on a fully loaded `/admin` page (logged in) — no dialog opened, no search affordance exists anywhere in the rendered admin header/sidebar. This orphaning **predates Phase 2** (the mount/slot files were last touched in commits `b418ff9`/`06019c5`, both ancestors of the Phase‑1 boundary commit `19db7d3`) — it is not a regression introduced this phase. But `DOD/ADM-00.md`'s B3 checkbox ("Command palette does real record search… verified via a direct query against the seeded fixture") and the addendum's "cmdk" entry both describe this as a working, audited feature without disclosing that it cannot currently be opened by any user in the live app. |
| 2FA enrollment button: `enrollLabel`/`dict.auth.totpEnrollButton` now wired correctly, AR + EN | **VERIFIED** | `lib/i18n/dictionaries.ts:1062,2266,3489` has the key in both locales (`ابدأ تفعيل التحقق بخطوتين` / `Start 2FA enrollment`); `app/admin/(protected)/settings/security/page.tsx:42` passes `dict.auth.totpEnrollButton` as `enrollLabel`. Live, logged in as a throwaway admin: AR page renders the button with exactly that text; toggled to EN via the UI locale switch — button renders "Start 2FA enrollment" exactly. |

---

## 4. Live tests performed (this session)

- **3D scene** — `/admin/login`, `/trader/login`: canvas present, 0 errors, both normal and
  `prefers-reduced-motion: reduce` states (production build + dev server, Playwright MCP).
- **Storefront search** — `/catalog`: real button click (not synthetic) instrumented with an
  `ro:open-search` listener; `fired: false`, page navigated instead. Manual event dispatch on
  the same page opened the overlay correctly with 9 real products. Home (`/`): real button
  click opened the overlay correctly (`role="dialog"` present).
- **Admin dashboard** — logged in via the real login form with a throwaway admin account
  (production build on port 3055, to avoid the dev server's HMR instability hit during this
  session — see below); confirmed 4-slice recharts donut renders; confirmed `Ctrl+K` does
  nothing anywhere in the admin shell.
- **2FA enrollment button** — `/admin/settings/security`, AR and EN (via UI locale toggle).
- **Command search function** — direct invocation of `searchAdminCommand("BR-SEED-014")`.
- **DomainBreakdown removal** — full-repo grep.

**Environment note:** the `rare-oud-dev` dev server (Next 15 dev mode) entered a pathological
HMR hot-update loop partway through this session (hundreds of
`*.webpack.hot-update.json` requests in a tight loop, intermittent 404/500 on
`/admin/login`), unrelated to any Phase‑2 code — it reproduced identically before and after a
clean `.next` restart and regardless of which route was requested. Switched to a clean
production build (`next build && next start -p 3055`) for all live tests from that point on,
which was stable throughout. This matches the spirit of Phase 1's audit note about stale dev
caches being an environment artifact, not a code regression — flagged here for visibility,
not as a Phase-2 finding.

---

## 5. Requirement checklist against the Phase 2 prompt (Part D)

| Requirement | Status |
|---|---|
| Route reconciliation table (Step 0) | Done — `evidence/phase-02-reconciliation.md`, 33 IDs mapped |
| Compatibility report (framework versions) | Done — `DECISIONS-ADDENDUM.md`, no-upgrade decision, reasoned |
| Design-system port | Partial, disclosed: cmdk migration skipped (reasoned — existing palette already does real search, **though see Finding H-2: that palette is unreachable regardless of cmdk**), Sonner mounted but not fully migrated (disclosed, reasoned), recharts wired by replacement not addition (done, verified) |
| Dictionary consolidation | Partial, ratchet not zero (55 baseline) — acceptable given the plan's own framing as ongoing debt tracking, not a one-shot requirement; see i18n row in §3 for nuance on the false-positive classification |
| Shells audited, not rebuilt | Done — `DOD/ADM-00.md`, `TRD-00.md`, `SF-SHELL.md` all explicitly scope themselves this way |
| AUTH-06 / SF-11 offline page: not built | Reasoning is sound. No service worker or PWA manifest exists anywhere in the app (confirmed: no `manifest.json`/`sw.js` reference found in the diff or the wider repo search performed for this audit) — a dedicated `/offline` route is genuinely unreachable without one. `OfflineBanner` mounted globally is a reasonable interim substitute. Correctly flagged as a gap for a future phase, not fixed. |
| `/dev/ui` gallery extended | Done — `toast-demo.tsx` added, referenced in diff |
| Legacy removal: `DomainBreakdown` | Done, verified (§3) |
| `DECISIONS-ADDENDUM.md` | Exists, substantive, mostly accurate — two claims in it (storefront search, command palette) do not hold up at the live-UI level; see Findings H-1/H-2 |
| DOD files for 3 shells | Exist, explicitly incomplete per their own unchecked boxes — consistent with "audited, not rebuilt" framing, acceptable for a foundation phase |

---

## 6. Findings by severity

**Critical:** none.

**High:**

- **H-1 — The storefront search button does not open the search overlay on any route
  except the homepage, contradicting this phase's central, explicitly-tested claim.**
  `components/storefront/header.tsx:87-93`'s `openSearch()` function is gated on `isHome`:
  when true, it dispatches `ro:open-search` (which `GlobalSearchMount` listens for); when
  false — i.e. on every other storefront route, including `/catalog`, the exact page named
  in both `DECISIONS-ADDENDUM.md` and `DOD/SF-SHELL.md` as having been "verified live" — it
  instead does `window.location.href = href("/catalog", locale)`, a full-page navigation.
  Live-confirmed with an event listener attached before the real button click:
  `fired: false`. The `GlobalSearchMount`/`DiscoveryProvider` machinery that was actually
  built this phase is correct and does work (confirmed by manually dispatching the event),
  but `header.tsx` — the one file that would need to change for a user to ever reach it
  outside the homepage — was not touched in this phase's diff at all. The net effect is that
  this phase's flagship storefront fix does not reach end users anywhere it was claimed to.
  This is exactly the kind of claim the audit brief asked to stress-test, and it does not
  hold up.
  - *Suggested direction (not executed):* remove the `isHome` branch in `openSearch()` (or
    make it unconditionally dispatch `ro:open-search`, since `GlobalSearchMount` now covers
    every route) and re-run the DOD's own live verification steps for real this time.

- **H-2 — The entire admin command palette (search, keyboard shortcut, and the brokerage
  search added this phase) is dead code: never mounted anywhere in the live app.**
  `components/admin/command-search-mount.tsx` exports `AdminCommandSearchMount`, which is
  never imported by `components/admin/shell.tsx` (the component `app/admin/(protected)/
  layout.tsx` actually renders) or anywhere else in the repo. Live-confirmed: `Ctrl+K` on a
  logged-in `/admin` page does nothing, and no search affordance of any kind exists in the
  rendered header or sidebar. This orphaning **predates Phase 2** — the mount/slot files
  were last touched in commits `b418ff9`/`06019c5`, both ancestors of the Phase‑1 boundary
  (`19db7d3`), so it is not a regression this phase introduced. However, `DOD/ADM-00.md`
  explicitly checks off "Command palette does real record search… verified via a direct
  query against the seeded fixture" and `DECISIONS-ADDENDUM.md`'s "cmdk" entry discusses
  this palette at length as a working, already-tested feature worth keeping as-is — neither
  document discloses that the feature it's defending is currently unreachable by any user.
  The underlying search function itself is correct (confirmed: `searchAdminCommand
  ("BR-SEED-014")` returns the right hit), so the narrow technical claim in the brief is
  true, but the live-UI claim implied by the DOD checkbox is not.
  - *Suggested direction (not executed):* either mount `<AdminCommandSearchMount>` in
    `AdminShell`'s header (it already accepts `labels` and lazy-loads its own chunk, so this
    looks like a one-line wiring gap, not a redesign) or, if it's being deliberately held
    back for a later phase, say so explicitly in the DOD file instead of checking the box.

**Medium:** none found this phase (the storefront-search and command-palette findings are
both load-bearing enough — central, explicitly-claimed-and-"verified" deliverables that
don't work end-to-end — to rate High rather than Medium, even though neither has a security
or data-integrity dimension).

**Low:**

- **L-1 — Dictionary ratchet's disclosed false-positive list is non-exhaustive.**
  `DECISIONS-ADDENDUM.md` names 5 specific locations as false positives (data-locale
  selection, not real UI-string debt) out of the 55 the ratchet counts. At least two more of
  the same pattern exist and aren't mentioned (`components/admin/locale-toggle.tsx:15`,
  `app/trader/(protected)/notifications/page.tsx:54-55`). The addendum already anticipates
  this ("a future pass should classify the full list… not assuming all 55 need a dictionary
  key"), so this isn't a false claim — just a reminder that the true remaining UI-string
  debt is smaller than 55, and smaller still than "55 minus the 5 named," when that future
  classification pass happens.
- **L-2 — `/trader` bundle-size figure in `DOD/TRD-00.md` is slightly stale.** The DOD file
  reports 3.6 kB page / 129 kB first load; a fresh production build this session measured
  4.09 kB / 129 kB (first-load figure matches, page-own size doesn't). Likely just measured
  at an earlier point in the same phase's work before a later commit added a few bytes;
  not independently alarming, but worth refreshing the figure if `DOD/TRD-00.md` is revisited.

---

## 7. Temporary probes created and removed

- `scripts/tmp-audit-phase2-admin.ts` — created a throwaway `AdminUser`
  (`audit-phase2-throwaway@rareoud.test`), later repurposed in the same file to delete it.
  **Deleted after use** (confirmed: `adminUser.count({ where: { email: { contains:
  "audit-phase2" } } })` → `0`; file removed, `git status` clean).
- `scripts/tmp-audit-phase2-search.ts` — read-only, called `searchAdminCommand` directly, no
  side effects. **Deleted after use.**
- `scripts/tmp-audit-phase2-verify-clean.ts` — read-only cleanup-verification query.
  **Deleted after use.**
- A production server (`next start -p 3055`) and, earlier, the `rare-oud-dev` dev server
  (port 3001, via the built-in browser's `preview_start`) were used for live testing.
  **Both stopped** at the end of this session (confirmed via `Get-NetTCPConnection` for port
  3055; the dev server via its own `preview_stop` call).
- `.next/` (production build artifacts) and `.playwright-mcp/` (Playwright MCP snapshot
  files generated during live testing) were removed from the working tree.
  **Confirmed via `git status --short` → clean**, both before and after this audit.

---

## 8. Overall verdict

**No Critical findings. Two High findings (H-1, H-2).** Both are claim-verification
failures, not security or data-integrity issues: the storefront search fix and the
command-palette brokerage search were each independently reported as "verified live" by the
implementer, and in both cases the underlying infrastructure genuinely works when exercised
directly (manual event dispatch; direct function call) — but the actual end-user path to
reach either feature is broken (search: the button's `isHome` gate was never removed from
`header.tsx`; command palette: the component was never mounted in `AdminShell`, a pre-existing
gap this phase's own verification should have caught but didn't). Per the project's own
gating rule ("لا تنتقل قبل أن يخرج التدقيق بلا Critical أو High"), **these two High findings
should be resolved — or at minimum explicitly acknowledged and accepted by the owner — before
moving to Phase 3.** Everything else checked (3D logo scene fix, recharts/DomainBreakdown
swap, 2FA button fix, i18n ratchet math, git hygiene, full quality gate) held up under
independent live testing exactly as claimed.
