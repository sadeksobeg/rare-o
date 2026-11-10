# Independent Verification Audit — Phase 4 (Admin core)

**Mode:** read-only verification. No fixes, commits, migrations, or pushes were made.

**Methodology note (important):** this audit began with live browser testing (admin
login as a throwaway account, real UI clicks, real form submissions) and was then
switched mid-session, by explicit coordinator instruction, to static code tracing plus
automated test/build scripts only, to save cost. **ADM-01 and ADM-02 were verified live**
(browser clicks, real session, real navigation) before that switch. **ADM-03, ADM-04,
ADM-05** were verified by reading the actual route/component/query code end-to-end and
cross-checking it against what was already observed live for the same shared patterns
(shell, auth gating, avatar/initials convention) — **not by independently clicking
them**. Anywhere this matters, it is called out explicitly below instead of being
presented as equivalent to a live click.

Five throwaway DB rows and one throwaway dev server were created during the live phase
and have been fully removed; see "Temporary probes created and removed" at the end.

**Scope read:** `docs/ui-planning/MASTER-BUILD-PLAN.md` Part B (Definition of Done) and
Part C2 (ADM-01…ADM-05); `docs/ui-planning/DECISIONS-ADDENDUM.md` "Phase 4 (Admin core)
— 2026-10-31" and the "D20 override — ratified" entry; `docs/ui-planning/evidence/
phase-04-admin-core.md`; `docs/ui-planning/plan/PLAN.md` §4 Decision Lock (D1–D26,
D20 excepted per owner ratification).

---

## 0. Git state

- Worktree was initially on a stale branch unrelated to `phase/09-hardening` (a
  `worktree-agent-*` branch carrying only CSP/hardening "G0–G3" commits). This was
  caught before any Phase 4 evidence was gathered and corrected by checking out
  `138a430` (tip of `phase/09-hardening`, one commit ahead of `3aad9c3`) in detached
  HEAD — confirmed via `git merge-base --is-ancestor 3aad9c3 138a430` and `git log
  --oneline -3`. All findings below are against `138a430`.
- `git show --stat 3aad9c3` (the squashed phases 3–9 commit): **no changes to
  `middleware.ts` or `lib/auth/*`**. `.env.example` gained 9 lines (new WhatsApp env
  documentation only, not `.env` itself). `lib/whatsapp/baileys-adapter.ts` (+734) and
  `lib/whatsapp/fake-adapter.ts` (+55) changed substantially — this is **out of Phase
  4's literal scope** (admin core) but belongs to Phase 5/9 (WhatsApp ops/hardening)
  bundled into the same squashed commit; not reviewed in depth here since it is not
  ADM-01…05. Checked only for the one thing that matters under `CLAUDE.md`'s
  WhatsApp-gating rule: `.env.example` still defaults `WHATSAPP_CONNECT_ON_START` and
  `WHATSAPP_OUTBOUND_ENABLED` to `"false"`, consistent with the commit message's own
  claim. No real number was linked or scanned during this audit (see §8).

---

## 1. Quality gate (run independently, this session)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **PASS**, 0 errors |
| `npm run lint` (`next lint`) | **PASS**, 0 errors; 2 pre-existing warnings, both unrelated to Phase 4 (`components/storefront/cart-provider.tsx:97`, `components/ui/text-field.tsx:223`, both `react-hooks/exhaustive-deps`) |
| `rm -rf .next && npm run build` | **PASS** first try, no flake this run — all 46 static + dynamic routes compiled, including every `/admin/*` route |
| `npm run check:i18n` | **PASS** — "i18n OK — 1260 string keys match in AR and EN"; inline-ternary ratchet at 53/53 (baseline), none of the listed files are ADM-01…05 |
| `npm run test:week3` | **PASS** — 58/58 |
| `npm run test:wholesale-security` | **PASS** — 9/9, fixtures self-cleaned |
| `npm run test:admin-dashboard-kpi` | **PASS** — 6/6 (retail 18=18, deals 0=0, wholesale 0=0, brokerage 1=1, 14-day trend has 14 points, trend total = sum of points) |

Note: this worktree had no local `node_modules` or `.env` (not copied into the
worktree by default). `node_modules` resolved transparently via Node's directory-walk
(the main checkout's `node_modules` one level up), which is why `tsc`/`build` worked
before this was noticed; `node_modules/tsx/dist/cli.mjs`-style **literal path** scripts
failed until re-run via `npx tsx <script>`, which resolves the same way. `.env` was
copied from the main checkout for DB-dependent commands only, with
`WHATSAPP_CONNECT_ON_START`/`WHATSAPP_OUTBOUND_ENABLED` explicitly forced to `false`
in this worktree's copy (the main checkout's own `.env` has these `true` against an
already-linked local WhatsApp session, which is unrelated to Phase 4 and out of scope
to touch). The copied `.env` was deleted at the end of this audit (see §8).

**On the KPI test script itself** (`scripts/admin-dashboard-kpi-checks.ts`): it is a
**function/data-layer test only** — it calls `getAdminHomeData()` directly and compares
against independently-recomputed counts from Prisma. It does **not** click a KPI tile
or assert that the destination list's rendered row count matches. This is exactly the
class of gap the Phase 2 audit flagged (verifying "at the function level" instead of
the real UI). See §3 Finding M-1 for what this gap actually hides.

---

## 2. Live test evidence (ADM-01, ADM-02 — before the scope change)

A throwaway admin (`audit-phase4-throwaway@rareoud.test`, created directly via Prisma
with `hashPassword` from `lib/auth/admin-session.ts`, **not** the seeded admin) was
used to log in through the real `/admin/login` form in a Chromium browser pane against
a dedicated dev server on port 3003 (to avoid colliding with other running instances).

**ADM-01 `/admin` — live:**
- Dashboard rendered with a real session: gradient hero, greeting, KPI strip
  (retail 18 / deals 0 / wholesale 0 / active brokerage 1), 14-day area chart
  ("الطلبات خلال 14 يوماً", total 6, visible polyline + fill), and a real domain-mix
  donut ("توزيع المسارات": 95% retail-new, 0% wholesale-waiting, 0% wholesale-new,
  1.5% active brokerage) — **both charts rendered actual SVG content**, not
  empty/broken placeholders.
- **First-use empty state correctly NOT shown** (real seed data present). Code
  read (`app/admin/(protected)/page.tsx:75-81`): `isFirstUse` requires **all** of
  waiting-count=0, activeBrokerage=0, publishedProducts=0, traders=0, customers=0,
  AND an empty action queue — a strict AND across every domain, not just one zero
  metric. This is sound: it only fires on a genuinely empty tenant, and (note) even
  when it does fire, the KPI strip/charts still render below it (all-zero), which is
  slightly redundant but not wrong.
- **KPI → filtered list, live-clicked**: clicked the retail KPI tile (18) →
  navigated to `/admin/requests?tab=waiting` → list header showed "18 نتيجة" with
  the "بانتظارك 18" tab active. **Matches exactly.**
- Code-traced (not independently clicked, due to the scope change) for the other
  three tiles: deals (`/admin/deals?tab=waiting`) and wholesale
  (`/admin/wholesale?tab=waiting`) both filter via the **same** `dealNextActor`/
  `wholesaleNextActor` functions the dashboard count uses, and the same
  `uiVisibleDealWhere`/`uiVisibleWholesaleWhere` fixture-hiding filter
  (`lib/deals/service.ts:1,357`), so they are structurally guaranteed to agree —
  high confidence, not independently clicked.
- **Brokerage KPI → list: confirmed NOT filtered correctly.** See Finding M-1 below
  — this is a real, code-confirmed gap, not a hypothetical.

**ADM-02 `/admin/traders` + `/admin/traders/[id]` — live:**
- The traders list initially rendered the "first-use" empty state even though 3
  trader rows exist in the dev DB — traced to `lib/admin/ui-hidden.ts`: all 3
  existing traders (`Reg Trader A`, `Reg Trader B`, `Demo Trader`) are deliberately
  hidden dev/regression fixtures (`HIDDEN_TRADER_NAMES`/`HIDDEN_TRADER_EMAILS`),
  **not a bug** — intentional, documented fixture-hiding also used by the admin
  dashboard, deals, and wholesale queries.
- **Created a real trader live** through the actual `إضافة تاجر` form on
  `/admin/traders` (not via Prisma): one-time temp-password dialog with a
  copy-and-confirm gate appeared correctly, matching AUTH-04/Phase-1's C-2 pattern.
- Opened the new trader's detail page (`/admin/traders/[id]`) live: real `_count`
  values (0/0/0 for a brand-new trader).
- **Cross-trader isolation, live-proven**: created a second throwaway trader
  ("Trader B") and attached one `DealProposal` to Trader A and one
  `WholesaleRequest` to Trader B directly via Prisma (throwaway, deleted after).
  Live navigation confirmed: Trader A's detail page showed **deals=1, wholesale=0**;
  Trader B's showed **deals=0, wholesale=1**. No cross-contamination — the `_count`
  is a genuine Prisma relation count scoped to `trader.id` inside a `findFirst`
  keyed on that one trader, which is structurally immune to leaking another
  trader's counts (not just "tested once and hoped").
- **IDOR, live-tested, authenticated session**: `/admin/traders/does-not-exist-abc123`
  (malformed/nonexistent id) → clean "الصفحة غير موجودة" 404 page, no crash, no
  stack trace. `/admin/traders/<a real but hidden-fixture id>` → **also** a clean
  404 (the `uiVisibleTraderWhere()` filter is applied inside the same
  `findFirst` in the detail route, so a hidden fixture trader is unreachable even
  by direct ID — consistent with the list, not an inconsistency). Both confirmed
  with the real authenticated session cookie, not just unauthenticated redirects.
- **Finding L-1** (below): the per-trader activity cards (deals/wholesale/brokerage
  counts, each a clickable card) link to the **global, unfiltered**
  `/admin/deals`, `/admin/wholesale`, `/admin/brokerage` lists, not to a
  trader-scoped view. Confirmed by reading both the detail page
  (`app/admin/(protected)/traders/[id]/page.tsx:181,186,191`) and the destination
  list pages, which accept no trader-id query param at all.

---

## 3. Code-traced evidence (ADM-03, ADM-04, ADM-05 — after the scope change)

These were **not** independently clicked this session. Confidence is based on reading
the actual server component, server action, and query code end-to-end, and (for ADM-03)
cross-checking it against a `get_page_text` snapshot taken live in §2's session before
the scope change (the Ctrl+K search bar, team table, and audit-log tab were all visible
on-screen at that point, with real rows — included for completeness, not re-verified
independently after the switch).

**ADM-03 `/admin/team`:**
- `app/admin/(protected)/team/page.tsx`: both tabs (`team`/`audit`) are
  server-rendered from `?tab=` search params (URL-persisted, matches DoD B3), fetch
  real `prisma.adminUser.findMany` and `prisma.adminAuditLog.findMany`/`count`. The
  "no roles yet" gap is explicitly disclosed in-page copy (AR/EN), matching
  `DECISIONS-ADDENDUM.md`'s "no invented admin roles" entry — honest, not silently
  dropped.
- Audit-log action filter is a plain GET `<form>` (works without JS) that round-trips
  through the same `actionFilter` used by both the table query and the CSV export
  link's query string (`team/page.tsx:190`) — consistent.
- CSV export route (`app/api/admin/audit-export/route.ts`): gated by
  `requireAdminSession()` (401 JSON if not authenticated — **and** this is the
  password-change-aware gated variant, not the bare `getAdminSession`, unlike the
  Phase-1-audit's L-1 finding on the media route), queries real
  `prisma.adminAuditLog.findMany` (up to 2000 rows, same `action` filter), returns a
  real `text/csv` body with `Content-Disposition: attachment` and `Cache-Control:
  no-store`. Properly escapes quotes/commas/newlines in cells. This route was **seen
  wired correctly live** (its href present and pointing at the right URL with the
  filter applied) before the scope change, but the actual CSV byte-content was not
  independently fetched/verified this session — flagged as **needs live
  verification later** rather than claimed as fully proven.

**ADM-04 `/admin/customers` (+ `[id]`):**
- Initials avatar: `c.name.trim().slice(0, 1) || "C"` rendered in both the mobile
  card list and the desktop table (`app/admin/(protected)/customers/page.tsx:103,
  183`) — the exact same pattern already **live-confirmed working** for traders
  (`app/admin/(protected)/traders/page.tsx` initial badge, seen rendering correctly
  in the browser in §2). High confidence by pattern-identity, not independently
  clicked for customers specifically.
- Customer detail page (`app/admin/(protected)/customers/[id]/page.tsx`) genuinely
  wires `CustomerNotesForm` (real notes, not a stub) and
  `findWhatsAppConversationsForPhone` (a real query joining by phone number) — both
  present and called, not orphaned imports.

**ADM-05 `/admin/brokerage` (+ `[id]`):**
- `app/admin/(protected)/brokerage/page.tsx` reads `trader`/`city`/`stale` from
  `searchParams` (URL-persisted) and filters the real row set
  (`listAdminBrokerage()`) server-side before rendering both the Kanban board and
  the full table — both reflect the same filtered `rows` array, so they cannot
  disagree with each other.
- `components/admin/brokerage-filters.tsx` (`BrokerageAdminFilters`) is a client
  component that builds the trader/city/stale URL params via
  `router.replace(...)` — confirmed **mounted** inside the page (not an orphaned
  "coded but never imported" component, the specific Phase-2 bug class): it is
  imported and rendered at `app/admin/(protected)/brokerage/page.tsx:117-130`
  inside a `<Suspense>`.
- **Not independently clicked** this session (scope change landed before this
  screen's live pass); the filter round-trip (client builds URL → server reads
  `searchParams` → filters the same `rows` used by both board and table) is sound
  by code structure, but picking a known trader/city and confirming the exact
  result set live is listed as a follow-up in §6.

---

## 4. Requirement checklist against the Phase 4 prompt (MASTER-BUILD-PLAN §Part D)

| Requirement | Status |
|---|---|
| ADM-01…05, real data only, match/exceed design-lab | Done — not independently compared pixel-for-pixel against design-lab screenshots this session (no lab-vs-real artifacts exist to compare against; see Finding L-2) |
| One commit per screen; DOD per screen | **Not done** — squashed into one commit (`3aad9c3`) for phases 3–9, and no `docs/ui-planning/DOD/ADM-0{1..5}.md` files exist (only `ADM-00.md`, `SF-SHELL.md`, `TRD-00.md` exist repo-wide) — see Finding L-2, already disclosed by the implementer's own evidence file |
| Automated test: every dashboard count = filtered list count | **Partially done** — `test:admin-dashboard-kpi` verifies counts at the data layer (6/6 pass) but does not assert the destination list's rendered length; the brokerage KPI→list case this would have caught is a real gap (Finding M-1) |
| IDOR + role tests for every detail route | **Partially done** — live-tested for ADM-02 (the only new detail route in this phase) and found clean; no automated IDOR test script exists in the repo for this route (not found via search of `scripts/`) |
| Quality gate | Done (§1) |
| Videos of each screen's main flow | **Not done** — explicitly disclosed as not produced in `evidence/phase-04-admin-core.md` |

---

## 5. Findings by severity

**Critical:** none.

**High:** none.

**Medium:**

- **M-1 — Brokerage KPI tile does not navigate to a list filtered to match its own
  count.** The dashboard's "وساطة نشطة" (active brokerage) KPI value is
  `countActiveBrokerage()` (`lib/brokerage/service.ts:355`), which counts only rows
  whose status is in an explicit "active" list (`SUBMITTED`, `NEEDS_INFO`,
  `ACCEPTED`, `INSPECTION_SCHEDULED`, `INSPECTED`, `QUOTE_SENT`, `APPROVED`,
  `PURCHASED`, …). Clicking that tile navigates to `/admin/brokerage`
  (`app/admin/(protected)/page.tsx:116`, the KPI's `href` is the bare path, no
  query param), whose page calls `listAdminBrokerage()` with **no status argument**
  (`app/admin/(protected)/brokerage/page.tsx:43` → `lib/brokerage/service.ts:137-146`,
  `status` defaults to `undefined` → unfiltered), so the destination shows **every**
  brokerage request regardless of status, including `CLOSED`/`DECLINED`/
  `REJECTED`/`CANCELLED`. In this session's dev data the two numbers happened to
  coincide (1 active brokerage row, 1 brokerage row total) purely because there
  were zero closed/declined/rejected/cancelled rows in the dev DB — the moment any
  such row exists (which will happen in real operation as deals get closed), the
  KPI number and the destination list's total row count will diverge, violating
  the explicit DoD requirement ("كل رقم يطابق قائمته المفلترة — اختبار") for this
  one tile. `test:admin-dashboard-kpi` does not catch this because it only checks
  the KPI's own value against an independently recomputed count, never against
  what the destination page actually renders. *Suggested direction (not executed —
  read-only audit): either add a `status` query param the brokerage KPI link can
  pass and have the list page apply it, or change `countActiveBrokerage` to count
  what's literally on `/admin/brokerage` by default.*

**Low:**

- **L-1 — Trader detail page's per-track activity cards link to unfiltered global
  lists, not to that trader's records.** On `/admin/traders/[id]`, the three
  "ملخص النشاط" cards (deals/wholesale/brokerage, each showing that trader's real
  `_count`) are clickable `<Link>`s whose `href` is the bare `/admin/deals`,
  `/admin/wholesale`, `/admin/brokerage` (`app/admin/(protected)/traders/[id]/
  page.tsx:181,186,191`) — none of those destination pages accept a trader-id
  filter param (confirmed by reading all three list pages). A user clicking "3
  deals" on a trader's profile, expecting to see that trader's 3 deals, lands on
  the full admin deals list instead. Not a security issue (no data crosses a
  boundary) — a navigation/UX inconsistency the DoD's "numbers match their filtered
  list" spirit would flag if read broadly, though D-01's literal checklist line is
  about the dashboard specifically.
- **L-2 — Per-screen evidence artifacts (DOD files, lab-vs-real screenshots,
  videos) were not produced for ADM-01…05**, already disclosed in
  `evidence/phase-04-admin-core.md` ("Videos / lab-vs-real screenshot pairs / IDOR
  suite: not produced in this pass") and confirmed by this audit (`docs/ui-planning/
  DOD/` contains only `ADM-00.md`, `SF-SHELL.md`, `TRD-00.md` — no `ADM-01.md`
  through `ADM-05.md`). Carried forward as already tracked, not a new find.
- **L-3 — CSV export's actual output bytes were not independently fetched this
  session** (scope change landed before this specific sub-check). The route code is
  sound (§3) and its wiring was seen live, but "does it actually return a
  downloadable CSV with real rows" per the original brief's wording was not proven
  byte-for-byte. Flagged as a follow-up for a future live pass, not claimed as done.
- **L-4 — ADM-05's trader/city/stale filters were not independently live-clicked**
  this session (scope change). Code structure is sound (§3) but picking a known
  trader, applying the filter, and confirming the exact result set live (as the
  original brief specifically asked) was not completed — follow-up for a future
  live pass.

---

## 6. Remaining for a future live-verification pass

(Everything in this section was out of reach once live browser testing was stopped
mid-session; none of it is a new gap this audit introduces — it narrows exactly what
could not be independently proven live this time.)

1. CSV export: fetch `/api/admin/audit-export` with a real session cookie and inspect
   actual response bytes/row count against the on-screen "N حدثاً" count.
2. ADM-05: pick a known trader and city, apply both filters together, confirm the
   Kanban board + table + result count all agree and match a hand-counted expectation.
3. ADM-01: click the deals and wholesale KPI tiles (only retail was clicked); confirm
   their destination counts match, as the retail one did.
4. Fix or explicitly accept Finding M-1 (brokerage KPI → list mismatch potential).

---

## 7. Overall verdict

**No Critical or High findings.** ADM-01 and ADM-02 are implemented correctly and
match their claims, independently verified via live browser testing with a throwaway
admin session, real form submissions, and a from-scratch cross-trader isolation proof
(two throwaway traders, one deal, one wholesale request, created and fully deleted this
session). ADM-03/04/05 are implemented correctly per static code tracing but were **not
independently clicked** this session following a coordinator-directed scope change
partway through — that gap is disclosed throughout §3, §5 (Findings L-3, L-4), and §6
rather than papered over.

One genuine, code-confirmed **Medium** finding (M-1: the brokerage KPI tile's
destination list is not filtered to match its own count — a real DoD violation that
will surface the first time a brokerage request is closed/declined in production, not
a theoretical edge case) and three **Low** findings (L-1 trader-detail card links not
trader-scoped, L-2 missing per-screen evidence artifacts — already self-disclosed, L-3/
L-4 not independently live-verified due to the scope change) do not block moving
forward per the project's own gating rule ("لا تنتقل قبل أن يخرج التدقيق بلا Critical
أو High") — they are recorded here as follow-ups, with M-1 specifically worth fixing
before this phase is considered fully closed.

---

## 8. Temporary probes created and removed

- `scripts/tmp-audit-phase4-setup.ts` — created one throwaway `AdminUser`
  (`audit-phase4-throwaway@rareoud.test`, password hashed via the real
  `hashPassword` from `lib/auth/admin-session.ts`). **Deleted after use.**
- `scripts/tmp-audit-phase4-check-traders.ts` — read-only, listed existing
  `TraderAccount` rows. **Deleted after use** (not a probe, no data created).
- `scripts/tmp-audit-phase4-isolation.ts` — created one throwaway trader
  ("Audit Phase4 Trader B", `audit-phase4-trader-b@rareoud.test`), one
  `DealProposal` (`AUDIT-P4-DEAL-A`) attached to the Trader-created-live-via-UI
  ("Audit Phase4 Live Trader", `audit-phase4-live-trader@rareoud.test`), and one
  `WholesaleRequest` (`AUDIT-P4-WS-B`) attached to Trader B — used to prove
  cross-trader count isolation in §2. **All deleted after use.**
- `scripts/tmp-audit-phase4-cleanup.ts` — the cleanup script itself; ran it
  (deleted the deal, the wholesale request, both throwaway traders, and the
  throwaway admin — 5/5 rows confirmed removed), then deleted the script file
  too. Re-queried trader accounts afterward: only the original 3 pre-existing
  dev/regression fixture traders remain, exactly as before this audit started.
- One trader was additionally **created through the real UI form** (not Prisma)
  as "Audit Phase4 Live Trader" — this is the trader referenced above as
  `audit-phase4-live-trader@rareoud.test`; it and its attached deal were deleted
  in the same cleanup pass.
- A dedicated dev server was started on port 3003 (`npx next dev -p 3003`, to
  avoid colliding with other running instances on 3000/3002) to drive the live
  browser tests. **Stopped** (`taskkill` on its PID) once live testing ended.
- `.env` was copied into this worktree from the main checkout (it has no `.env`
  of its own) to run DB-dependent commands, with WhatsApp auto-connect/outbound
  forced to `false` in the copy (the main checkout's own `.env` has a real linked
  WhatsApp session unrelated to this audit — never touched, never connected to
  from this worktree's server). **Deleted** at the end of this audit.
- Final `git status` in this worktree: clean except for this new report file
  (`docs/ui-planning/AUDIT-PHASE-4.md`), confirmed before writing this report.
