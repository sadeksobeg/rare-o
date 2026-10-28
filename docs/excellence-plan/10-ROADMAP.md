# Section 10 — Complete Execution Roadmap

Approval gate applies after WP5. **WP6 onward does not start until the owner explicitly approves this plan and the WP4 prototypes.**

---

### WP0 — Baseline, traceability, and owner decisions
- **Objective:** Establish ground truth before any design or code work; surface every outstanding decision honestly.
- **Status:** **Complete** (this plan).
- **Deliverables:** `01-TRACEABILITY-MATRIX.md`.
- **Owner approval required:** No (informational), but the decisions it surfaces (WP0-§C) need acknowledgment.
- **Completion evidence:** This document set.

### WP1 — Skills, tools, and capability readiness
- **Objective:** Confirm the right tools are available and avoid redundant installs.
- **Status:** **Complete** (this plan).
- **Deliverables:** `02-TOOLS-AND-SKILLS-INVENTORY.md`.
- **Owner approval required:** No — zero new dependencies installed; the one recommendation (an `npm audit` wrapper script) is a no-risk scripting addition that can land with WP10.
- **Completion evidence:** This document set.

### WP2 — Design research and verified references
- **Objective:** Validate the locked design direction against real, inspected references.
- **Status:** **Complete** (this plan).
- **Deliverables:** `03-DESIGN-REFERENCES.md`.
- **Owner approval required:** No.
- **Completion evidence:** This document set.

### WP3 — Digital identity, information architecture, and design system
- **Objective:** Confirm design-system completeness, specify the one refinement found (unified card anatomy).
- **Status:** **Complete** (this plan).
- **Deliverables:** `04-DESIGN-SYSTEM-AND-IA.md`.
- **Owner approval required:** Yes, as part of WP5 — specifically the `RoListCard` consolidation.
- **Completion evidence:** This document set.

### WP4 — Page blueprints and isolated visual prototypes
- **Objective:** Verify blueprints against real implementation; produce reviewable, isolated prototypes.
- **Status:** **Complete** (this plan), with explicit scope notes on what was not built and why (`06-PROTOTYPE-REVIEW-INDEX.md`).
- **Deliverables:** `05-PAGE-BLUEPRINTS.md`, `06-PROTOTYPE-REVIEW-INDEX.md`, `prototypes/ro-list-card-unification.html`.
- **Risks:** None — zero application code touched.
- **Owner approval required:** Yes — this is the design content WP5 gates on.
- **Completion evidence:** This document set + live screenshots in this conversation.

### WP5 — Owner design review and approval gate
- **Objective:** Owner reviews WP0–WP4 and either approves, requests changes, or rejects specific items.
- **Status:** **Not started — waiting on the owner.**
- **Dependencies:** WP0–WP4.
- **Expected deliverable:** An explicit, itemized approval (or change requests) covering: the `RoListCard` consolidation, the three owner-decision items (naming realignment, conflict-blocking keep, notifications keep), and the zod-migration timing.
- **Owner approval required:** This WP *is* the approval gate.
- **Completion evidence:** Owner's written approval, referenced in a future `PROJECT_AUDIT.md` entry.

### WP6 — Storefront implementation
- **Objective:** Apply the `RoListCard` consolidation to catalog/product cards; close any state-handling gaps found during WP4a verification (none currently open).
- **Dependencies:** WP5 approval.
- **Likely files:** `components/storefront/catalog/product-card.tsx`, new `components/ui/ro-list-card.tsx`.
- **Risks:** Visual regression on catalog/home if the shared component doesn't account for every existing variant (badges, video thumbnails). **Rollback:** component is additive; old card components stay until the new one is verified in place, then removed in the same batch, revertible via git.
- **Test plan:** axe suite on catalog/home (must stay 0/92-equivalent), visual diff before/after, `tsc`/lint/build.
- **Acceptance criteria:** No visual regression, no a11y regression, one shared component replaces at least the catalog card.
- **Owner approval required:** No (pre-approved by WP5), but final visual diff shown before merge.

### WP7 — Trader and negotiation implementation
- **Objective:** Apply `RoListCard` to the trader deal list; document the conflict-blocking and notifications-center decisions as approved extensions (doc-only change to a companion note, not Appendix S itself).
- **Dependencies:** WP5, WP6 (shared component).
- **Likely files:** `components/trader/deal-card.tsx`.
- **Risks:** Low — isolated component swap.
- **Test plan:** `test:week3`, `test:wholesale-security`, axe on trader routes.
- **Acceptance criteria:** No regression in the 58/9 baseline.
- **Owner approval required:** No.

### WP8 — Wholesale implementation
- **Objective:** Apply `RoListCard` to the wholesale list.
- **Dependencies:** WP5, WP6.
- **Likely files:** Wholesale list components (trader + admin sides).
- **Test plan:** Same as WP7.
- **Acceptance criteria:** Same as WP7.
- **Owner approval required:** No.

### WP9 — Admin implementation
- **Objective:** Apply `RoListCard` to the admin retail-request list and equivalent surfaces.
- **Dependencies:** WP5, WP6.
- **Likely files:** `components/admin/data-table.tsx` or adjacent list components.
- **Test plan:** Same pattern as WP6–WP8, plus a live admin-login browser crawl.
- **Acceptance criteria:** Same.
- **Owner approval required:** No.

### WP10 — Security and functional hardening
- **Objective:** Execute the zod 3→4 migration (owner-authorized, WP0-B1); clean up the 9 dev-tool `npm audit` findings; structured-logging/error-exposure pass (WP0-S7/S10); add the `npm audit` wrapper script (WP1).
- **Dependencies:** WP5 owner authorization specifically for the zod migration (major version, breaking change, touches every validation schema).
- **Likely files:** `lib/validation/schemas.ts`, every service file importing `zod`, `package.json`.
- **Risks:** zod 4's API changes could silently alter validation behavior if not carefully migrated. **Rollback:** full git revert of the migration commit; feasible because it will land as its own isolated commit, not mixed with UI work.
- **Test plan:** Full regression (`tsc`, lint, build, `test:week3`, `test:wholesale-security`, `test:d1-axe`) must stay green; `npm audit` shows 0 high for `zod`.
- **Acceptance criteria:** Zero behavior change to any user-facing validation message or rejection logic, proven by the regression suite; CVE closed.
- **Owner approval required:** Yes, specifically for the zod migration timing (already sought in WP5).

### WP11 — Automated testing, accessibility, and performance
- **Objective:** Resolve the CLS instability (WP0-B2) with proper tooling; re-measure Lighthouse on a quiet machine or CI; full E2E state coverage (loading/empty/error/success) across routes not yet spot-checked; rate-limiter load test.
- **Dependencies:** WP0-B5 (CI billing fix) ideally, or a dedicated quiet local run as a fallback.
- **Likely files:** `app/layout.tsx` (font loading, if that's the confirmed CLS cause), possibly font-fallback metric overrides.
- **Risks:** Low — performance-only changes, covered by the existing Lighthouse/axe gates.
- **Test plan:** `test:lh-budget` CLS ≤0.1 median; `test:d1-axe` stays 0; full E2E suite run (`test:e2e`).
- **Acceptance criteria:** CLS root-caused and fixed with evidence (not guessed); Lighthouse gate status known with confidence (clean environment or CI), not just "ran."
- **Owner approval required:** No.

### WP12 — Backup, deployment, monitoring, and production readiness
- **Objective:** Execute the owner-controlled infrastructure items: GitHub billing fix (unblocks CI), VPS/DNS deployment, production monitoring wiring, final asset delivery (SVG logo, photography, legal copy).
- **Dependencies:** Owner access to hosting/DNS/GitHub billing; WP10/WP11 complete so what's deployed is already hardened and measured.
- **Risks:** Deployment is the highest-blast-radius step in this roadmap. **Rollback:** `docs/pro-readiness/VPS-RUNBOOK.md` already documents the deploy procedure; standard container rollback (redeploy prior image) applies.
- **Test plan:** `smoke:prod` against the real URL; `test:d2-restore` re-run against production-equivalent data.
- **Acceptance criteria:** Platform publicly reachable, SSL valid, backups verified against the real environment, monitoring alerting confirmed live.
- **Owner approval required:** Yes — this is a production go-live decision.

### WP13 — Final WhatsApp real-number integration (explicitly deferred)
- **Objective:** Connect a real WhatsApp number, complete QR authentication, enable outbound messaging, run the operational acceptance tests (`test:whatsapp-phase-*`), lift the kill switch.
- **Dependencies:** Owner-provided, controlled phone number; WP12 complete (stable production environment).
- **Explicit boundary (per this mission's Section 2):** nothing in WP0–WP12 touches WhatsApp connection state, kill switches, or the worker process. This item is a separate work package requiring its own explicit authorization, not a default continuation of WP12.
- **Risks:** Real customer-facing messaging; a misconfigured kill switch could send unintended outbound messages. **Rollback:** kill switch is env-controlled and already defaults to disabled (`WHATSAPP_OUTBOUND_ENABLED=false`).
- **Test plan:** `test:whatsapp-phase-a` through `-e` (existing suites, all green in prior rounds against isolated test data).
- **Acceptance criteria:** Live inbox traffic confirmed, outbound confirmed working under supervision, kill switch tested in both states.
- **Owner approval required:** Yes — separate, explicit, final-stage authorization.

---

## Ordering rationale

WP6–WP9 (the four `RoListCard` consumers) are ordered storefront → trader → wholesale → admin, matching this mission's own stated prototype priority order, and each is independently revertible — a defect found in WP7 doesn't block or require re-opening WP6. WP10 (security) is placed after the UI work because the zod migration is unrelated to and independently revertible from the card consolidation; running them in parallel would needlessly conflate two unrelated review surfaces for the owner. WP11 (CLS/perf) depends on nothing from WP6–WP10 and could technically run earlier, but is sequenced after so that any UI changes from WP6–WP9 are already reflected in the numbers it measures, avoiding a second re-measurement pass.
