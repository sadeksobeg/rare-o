# Independent Verification Audit — Phase 7 (Trader portal)

**Mode:** read-only verification. No fixes, commits, migrations, or pushes were made.

**Scope-change note (mid-audit, from the coordinator):** the original brief called for live
browser testing at a 390px viewport with a throwaway trader account clicking through every
flow. That instruction was withdrawn mid-session to save cost. **This audit does not include
any live browser/dev-server interaction.** Every claim below is verified by static code
tracing (reading the actual route/action/query code end-to-end) plus the automated quality
gate and test scripts. Anywhere a live click would have been the only way to be fully
confident, it is called out explicitly as "needs live verification" rather than asserted as
done.

**Worktree note:** the worktree this agent was assigned (`agent-af343db29613bd6c1`) was not
on `phase/09-hardening` — it was on an unrelated branch (`worktree-agent-af343db29613bd6c1`,
a `master`-based security-hardening lineage with no trader-portal docs at all). This was
caught before any audit work was done. A separate detached-HEAD worktree was created at
`D:\tmp\phase7-audit` from the actual tip of `phase/09-hardening` (commit `138a430`, one
commit ahead of the `3aad9c3` tip named in the brief — `138a430` is a docs-only commit
recording an unrelated owner ratification, not trader-portal code) and all verification in
this report was done there. `git log --oneline -3` in that worktree: `138a430` → `3aad9c3`
→ `3340a52`.

**Environment note:** the host's `C:` volume was at 0 bytes free for part of this session
(a pre-existing condition, not caused by this audit), which broke the shared `node_modules`
the other worktrees junction to (missing `node_modules/.bin`, missing `@next/env`). This
audit's worktree lives entirely on `D:` (`D:\tmp\phase7-audit`) with its own `npm ci` install,
so the gate results below are from a clean, independent install, not the shared/possibly
broken one.

One throwaway trader row (`audit-phase7-throwaway@rareoud.test`) was created directly via
Prisma to prepare for the originally-planned live pass, then deleted the moment the
no-live-testing scope change arrived — see "Temporary probes" at the end.

---

## 1. Git state

- Branch/commit audited: `phase/09-hardening` @ `138a430` (detached HEAD in a separate
  worktree), one commit ahead of the `3aad9c3` "phases 3–9 + VISION + WhatsApp" commit named
  in the brief. The one extra commit is `docs: record owner ratification of D20 override and
  close the git-safety gap` — governance/docs only, no trader-portal code.
- Working tree in the audit worktree: clean after cleanup (`git status` → "nothing to
  commit, working tree clean", not counting the new `AUDIT-PHASE-7.md`).

---

## 2. Quality gate (run independently, this session, from a clean `npm ci`)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **PASS**, 0 errors |
| `npm run lint` (`next lint`) | **PASS**, 0 errors; 2 pre-existing warnings, both unrelated to Phase 7 (`components/storefront/cart-provider.tsx` and `components/ui/text-field.tsx`, both `react-hooks/exhaustive-deps`) |
| `npm run build` (`rm -rf .next` first) | **PASS**, all pages compiled, 46/46 static pages generated. First attempt hit `socket hang up` during "Creating an optimized production build" and **retried automatically (1/3) and succeeded** — this matches the brief's "known transient flake" description (webpack's own retry, not a next/font-specific message this run, but the same transient-network-during-build symptom) |
| `npm run check:i18n` | **PASS** — "i18n OK — 1260 string keys match in AR and EN"; inline-ternary ratchet at 53/53 (not raised) |
| `npm run test:week3` | **PASS** — 58/58, including `trader B cannot read trader A wholesale request` |
| `npm run test:wholesale-security` | **PASS** — all checks including `Trader B cannot read Trader A wholesale request` / `Trader B cannot modify Trader A wholesale request` / `Trader A can accept own quotation` |

No Critical/High gate failures. All six requested checks pass cleanly on an independent install.

---

## 3. TRD-00 — shell / tab count reconciliation

**Claim conflict identified and resolved:**

- `docs/ui-planning/DECISIONS-ADDENDUM.md` → "Phase 7 (Trader portal) — 2026-10-31" says
  **"TRD-00: six bottom tabs"** ("Pill/`grid` sizing is dynamic from `tabs.length` so profile
  is not clipped").
- `PROJECT_AUDIT.md` → "Session note — 2026-11-01 — Admin + Trader VISION program" (one day
  later) says the owner approved **"trader tabs = 5 with Brokerage replacing Offers"**, and
  `docs/ui-planning/evidence/phase-vision-admin-trader.md` → P5 confirms: **"Bottom/desktop
  tabs = 5: Home · Deals · Wholesale · Brokerage · Account (Offers deep-link only)."**

**Verified against the live code** (`components/trader/shell.tsx:34-69`): the `tabs` array
built in `TraderShell` has exactly **5** entries — `/trader` (home), `/trader/deals`,
`/trader/wholesale`, `/trader/brokerage`, `/trader/profile` — with an explicit code comment
`/** VISION program: 5 tabs — Home · Deals · Wholesale · Brokerage · Account */`. Offers has
no tab; it is reachable only via links from the home page's offers strip and from
`/trader/deals/new?title=...` deep links (confirmed in `app/trader/(protected)/offers/page.tsx`).

**Verdict: the code matches the later, owner-approved VISION decision (5 tabs), not the
earlier Phase-7-dated "six tabs" decision.** `DECISIONS-ADDENDUM.md`'s Phase 7 section is
now **stale documentation** — it was superseded by the VISION program one day after it was
written, and nothing in `DECISIONS-ADDENDUM.md` itself notes the supersession. This is not a
code defect (the code is internally consistent and matches the final, later approval) but it
is a real documentation-hygiene gap: anyone reading only the Phase 7 addendum (as the brief
itself initially did) would reasonably expect 6 tabs and could flag 5 as a regression. See
Finding **Low L-1**.

`TraderBottomTabs` (`components/trader/nav.tsx:103+`) derives pill width/grid columns from
`tabs.length` dynamically, so a 5-tab render is not a leftover 6-tab layout with an empty
slot — it is a correctly-sized 5-up layout. **This specific rendering detail (actual pixel
layout at 390px) was not confirmed live** per the no-browser-testing scope change — flagged
as needing live verification below.

**Waiting badges:** `TraderShell` wires `waiting.deals`, `waiting.wholesale`,
`waiting.brokerage` onto the three respective tabs (`shell.tsx:47,54,61`), sourced from
`getTraderWaitingCounts(session.sub)` (`lib/trader/waiting-counts.ts`), which scopes every
query by `traderId` (see §5). No badge is wired for home or profile, which is correct — there
is no "waiting on you" concept for those two tabs in the data model.

**Needs live verification:** the actual rendered tab bar at 390px (pill sizing, icon/label
fit, whether the dynamic grid math in fact avoids clipping) was not clicked through this
session.

---

## 4. Screen-by-screen claim verification (code tracing)

| ID | Claim (evidence docs) | Verification method | Verdict |
|---|---|---|---|
| TRD-00 | 5 tabs (VISION), badges on deals/wholesale/brokerage | Read `shell.tsx`, `nav.tsx` | **VERIFIED** (code); live pixel rendering **not verified** |
| TRD-01 | Personal/open counts, not global or another trader's | Read `app/trader/(protected)/page.tsx`, `lib/trader/waiting-counts.ts`, `lib/deals/service.ts` `listDealsForTrader`, `lib/wholesale/service.ts` `listWholesaleRequestsForTrader` — all take and filter by `traderId`/`session.sub` | **VERIFIED** — IDOR-adjacent risk is closed at the query layer, not just at the page layer |
| TRD-02 | Deal wizard: autosave to `sessionStorage`, invalid submit does not lose data, success celebration before navigating to detail | Read `components/trader/new-deal-form.tsx`: draft persisted to `sessionStorage` until `state.ok`; on failure (`state && !state.ok`) a `Banner` shows the error and the form fields are untouched (draft state is independent of `state`); on success a `role="status"` modal (`dealSuccessTitle`/`dealSuccessBody`) renders for 1.6s before `router.push` to the detail page | **VERIFIED** |
| TRD-03 | Wholesale wizard: autosave, invalid submit does not lose data, success celebration | Read `components/trader/wholesale-request-form.tsx`: draft/autosave and failure-preserves-data behavior **verified, same pattern as TRD-02**. **Success celebration: NOT PRESENT.** On success the component calls `router.push(`/trader/wholesale/${id}`)` directly with no modal, toast, or any success affordance (lines ~121-133); the wholesale detail page itself (`app/trader/(protected)/wholesale/[id]/page.tsx`) also renders no success/created banner. | **PARTIALLY VERIFIED — see Finding M-1** |
| TRD-04 | 4-step brokerage wizard, commission explainer, accept/reject via confirm dialog, detail gallery/quote/shipping real | Read `components/trader/brokerage-new-form.tsx` (4 steps: What/Where/Expectations/Review, `t.brokerageStep*`), commission explainer text present and substantive (`brokerageExplainerBody` in `lib/i18n/dictionaries.ts:2097-2098`, both AR/EN keys present); `components/trader/brokerage-quote-actions.tsx` gates both approve and reject behind `ConfirmDialog` before calling `traderRespondQuoteAction`; detail page (`app/trader/(protected)/brokerage/[id]/page.tsx`) renders `BrokeragePhotoGallery`, quote, and `BrokerageLifecycleRail`/timeline from real `getBrokerageForTrader` data | **VERIFIED for wizard steps, explainer, and confirm-before-commit.** **Success feedback: NOT PRESENT** — `traderCreateBrokerageAction` (`app/brokerage-actions.ts:99-110`) calls Next's server-side `redirect()` directly on success, so the client-side `state.ok` branch in the form (which clears the sessionStorage draft) **never actually fires on the happy path** — the trader is redirected straight to the detail page with zero success affordance, the same gap as TRD-03. See Finding **M-1**. |
| TRD-05 | Dual CTA cards, correct product image/page link | Read `app/trader/(protected)/offers/page.tsx`: each card shows `o.product.images[0].path` when present (brand-gradient fallback otherwise), with two buttons — "تفاصيل" linking to `/trader/offers/${o.slug}` and "اقترح صفقة" linking to `/trader/deals/new?title=...` | **VERIFIED** |
| TRD-06 | `?domain=` actually filters, not cosmetic | Read `app/trader/(protected)/notifications/page.tsx:27-38`: `domainFilter` is read from `searchParams`, and `filtered = items.filter(n => n.domain === domainFilter)` runs **server-side on the real data array** before render — the tab links are plain `<Link>`s to `?domain=X`, not client-side highlighting over an unfiltered list | **VERIFIED** — this is a real server-side filter |

---

## 5. IDOR verification (code tracing — not live-clicked per scope change)

All three detail-page data loaders scope by `traderId` at the Prisma query level, not just by
checking the session afterward:

- `getDealForTrader(dealId, traderId)` → `prisma.dealProposal.findFirst({ where: { id: dealId, traderId } })` (`lib/deals/service.ts:303-305`)
- `getWholesaleRequestForTrader(requestId, traderId)` → `findFirst({ where: { id: requestId, traderId } })` (`lib/wholesale/service.ts:178-183`)
- `getBrokerageForTrader(id, traderId)` → `findFirst({ where: { id, traderId } })` (`lib/brokerage/service.ts:149-151`)

All three detail pages call `notFound()` when the scoped lookup returns null (confirmed in
each `page.tsx`), so a trader who edits the URL to another trader's row ID gets a 404, not a
403 or a data leak (consistent with the Phase‑1 security pattern already audited).

Write paths are scoped the same way, not just reads:
- `addNegotiationEntry` (deals) explicitly checks `input.actorTraderId !== deal.traderId →
  throw FORBIDDEN` (`lib/deals/service.ts:177-181`) — a trader cannot post a negotiation entry
  against someone else's deal ID even though the dealId itself isn't looked up scoped-by-trader
  first (it's looked up by `findUnique` then ownership-checked, functionally equivalent).
- `traderTransitionBrokerage` (accept/reject quote) does `findFirst({ where: { id, traderId } })`
  then `throw NOT_FOUND` if null (`lib/brokerage/service.ts:234-237`) — same pattern as reads.
- `traderRespondToWholesaleQuote` / `traderCancelWholesaleRequest` pass `traderId` through to
  the service layer; this is independently confirmed by the **passing** automated tests
  `test:week3` ("trader B cannot read trader A wholesale request") and
  `test:wholesale-security` ("Trader B cannot read Trader A wholesale request" / "Trader B
  cannot modify Trader A wholesale request" — both PASS, §2).

**Verdict: IDOR protection is real and present at the query/service layer for all three
domains, verified by code tracing and corroborated by passing automated security tests.**
**A live attempt to open another trader's row by editing the URL in a running browser session
was not performed** (scope change) — this is the one item in the brief's IDOR section that is
asserted here on code evidence plus automated-test corroboration only, not a live click.
Recommended follow-up: run the already-existing `test:wholesale-security`-style live HTTP
check (or a quick manual click) against the deal and brokerage detail routes specifically, the
next time a live pass is in scope, to close this out with the same rigor Phase 1's audit used.

---

## 6. What this audit did **not** verify (scope change)

Per the mid-session scope change, none of the following from the original brief were done,
and none should be read as "passing" — they are open:

- Live rendering of the bottom tab bar at 390px (pill sizing, clipping, icon/label fit).
- Live click-through of the deal, wholesale, and brokerage wizards as a real trader session.
- Live confirmation that the deal wizard's success modal actually renders in a browser (code
  says it should; not watched happening).
- Live confirmation that invalid submissions genuinely leave form fields populated on screen
  (code says state is preserved independently of the `state` from `useActionState`; not
  watched happening).
- Live IDOR attempt (editing a URL to another trader's ID in an authenticated browser session).
- axe / accessibility pass, Playwright reduced-motion check — both were already listed as
  deferred to an owner device pass in `evidence/phase-vision-admin-trader.md`'s own checklist
  and remain deferred.

---

## 7. Findings by severity

**Critical:** none.

**High:** none.

**Medium:**

- **M-1 — Wholesale (TRD-03) and brokerage (TRD-04) wizards have no success
  celebration/confirmation, unlike deals (TRD-02).** `MASTER-BUILD-PLAN.md` Part B2's motion
  table requires, for the trader area generally: "انتقالات المعالج، احتفال نجاح بسيط" (wizard
  transitions, a simple success celebration) — not scoped to deals only. The deal-proposal
  wizard implements this (a 1.6s modal, `new-deal-form.tsx:431-452`). The wholesale wizard
  instead calls `router.push` straight to the detail page with no modal, toast, or banner
  (`wholesale-request-form.tsx:121-133`), and the detail page itself shows nothing. The
  brokerage wizard is worse: its create action (`app/brokerage-actions.ts:110`) calls
  Next's server-side `redirect()` directly, which means the client-side success branch in
  `brokerage-new-form.tsx` (lines 154-161, meant to clear the draft on `state.ok`) **can never
  fire on the happy path** — a trader who submits a brokerage request is redirected with zero
  on-screen acknowledgement that anything happened. Neither evidence doc discloses this gap:
  `evidence/phase-07-trader.md` only claims a celebration for TRD-02 (correctly, as it turns
  out) and is silent on TRD-03/TRD-04; `evidence/phase-vision-admin-trader.md` doesn't mention
  it either. Not a security or data-loss issue — purely a DoD/UX gap — but worth closing
  before this phase is called "done" against Part B2's own checklist.
  - *Suggested direction (not executed):* reuse the same success-modal pattern from
    `new-deal-form.tsx` in the wholesale form, and change `traderCreateBrokerageAction` to
    return `{ ok: true, data: { id } }` and let the client component navigate (as the other
    two already do) instead of a server-side `redirect()`, so the same modal pattern can be
    shared across all three wizards.

**Low:**

- **L-1 — `DECISIONS-ADDENDUM.md`'s Phase 7 section is stale and contradicts the current,
  correct code.** It states "six bottom tabs" (2026-10-31); the VISION program approved and
  shipped 5 tabs the next day (2026-11-01, Brokerage replacing the Offers tab), and the code
  correctly reflects 5. Nothing in `DECISIONS-ADDENDUM.md` marks the Phase 7 entry as
  superseded. A reader consulting only that file (as this audit's own brief initially did)
  would misjudge the current, correct 5-tab shell as a regression. Recommend adding a one-line
  "superseded by VISION, see evidence/phase-vision-admin-trader.md" note to the Phase 7
  section rather than leaving two documents in silent disagreement.
- **L-2 — Several claims in `evidence/phase-07-trader.md` are self-reported without evidence
  attached**, consistent with that file's own disclosure ("local agent," "not recorded this
  pass," "owner review on device remains the acceptance check"). This audit independently
  confirmed the underlying code for every such claim (§4), so none of them turned out to be
  false, but the practice of shipping a phase as "Done" against a DoD that explicitly requires
  390/768/1440 screenshots and axe results (Part B7) without attaching any of that evidence is
  a process gap worth naming, not a code defect.

---

## 8. Requirement checklist against the Phase‑7 prompt (Part C5 + relevant parts of B)

| Requirement | Status |
|---|---|
| TRD-00: bottom tab bar, correct tab count/icons/labels, waiting badges | Code matches VISION's 5-tab decision; **tab count correct, live pixel rendering unverified** |
| TRD-01: real, trader-scoped counts (IDOR-adjacent) | Done, verified by code tracing |
| TRD-02: deal wizard autosave + no data loss + success celebration | Done, verified |
| TRD-03: wholesale wizard autosave + no data loss | Done (autosave/no-loss); **success celebration missing — Finding M-1** |
| TRD-04: 4-step brokerage wizard + commission explainer + confirm-before-commit | Done, verified; **success feedback missing — Finding M-1** |
| TRD-05: dual-CTA offer cards, correct image/link | Done, verified |
| TRD-06: `?domain=` real filter | Done, verified — genuinely server-side |
| IDOR: traders cannot read/act on another trader's rows | Done at the code/query layer, corroborated by passing `test:week3` and `test:wholesale-security`; **not live-clicked (scope change)** |
| Quality gate (tsc/lint/build/i18n/week3/wholesale-security) | All PASS (§2) |

---

## 9. Temporary probes created and removed

- `audit-phase7-throwaway@rareoud.test` — a throwaway `TraderAccount` row created directly via
  Prisma (`mustChangePassword: false`) in preparation for the originally-planned live browser
  pass. **Deleted** the moment the no-live-testing scope change arrived, before any login or
  UI interaction was attempted with it. Confirmed gone via a follow-up Prisma query
  (`traderAccount.findFirst({ where: { email: ... } })` → `null`).
- No other DB rows, files, or dev servers were created. No fixtures were created for the
  deal/wholesale/brokerage flows (the scope change arrived before the planned "create a
  minimal fixture per flow" step).
- A detached-HEAD git worktree at `D:\tmp\phase7-audit` (checked out from `phase/09-hardening`
  @ `138a430`) was created to run this audit, since the agent's assigned worktree was on an
  unrelated branch. Its own `node_modules` (installed via `npm ci`, ~760 packages) and `.env`
  (copied from the main checkout) are local to that worktree and were not shared with or
  copied back into any other worktree. **This worktree and its report file were not removed**
  — `docs/ui-planning/AUDIT-PHASE-7.md` was written there (not committed/pushed, per
  instructions) since that is the only checkout in this session that actually contains Phase
  7's code and docs. This copy was made into the main checkout by the coordinating session.

---

## 10. Overall verdict

**No Critical or High findings.** The core Phase 7 claims — IDOR protection on all three
trader domains, the real `?domain=` notifications filter, the dual-CTA offers cards, the
4-step brokerage wizard with a genuine commission explainer and confirm-before-commit on
quote decisions, and the 5-tab shell matching the later owner-approved VISION decision — all
hold up under code tracing and the full automated quality gate (tsc/lint/build/i18n/week3/
wholesale-security all PASS). One real, previously-undisclosed Medium-severity UX/DoD gap was
found: only the deal wizard has the success celebration/confirmation the build plan requires
for trader wizards generally; wholesale and brokerage silently redirect with no success
feedback at all. One Low-severity documentation-staleness issue (the Phase 7 addendum
disagreeing with the later, correct VISION tab count) was also found and should be corrected
so it stops looking like a live discrepancy. Per the plan's own gating rule, these findings
(Medium/Low only) do not block the phase; they are recorded as follow-ups. **The live-browser
portion of the original audit brief (390px click-through, live IDOR attempt, screenshots) was
explicitly descoped mid-session and should be run before this phase is considered fully closed
against Part B7's evidence requirements.**
