# Section 10 — Complete Execution Roadmap

**Owner approved the plan and authorized implementation beyond WP5 on 2026-10-28.** Status per work package is updated below as execution proceeds; see `PROJECT_AUDIT.md` Session 4+ for full evidence.

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
- **Status:** **Complete.** Owner reviewed WP0–WP4 and explicitly authorized implementation beyond WP5 on 2026-10-28.
- **Completion evidence:** Owner's written approval in this conversation, referenced in `PROJECT_AUDIT.md` Session 4.

### WP6–WP9 — Storefront / trader / wholesale / admin `RoListCard` implementation
- **Status:** **Re-scoped on evidence, not executed as originally planned — correctly so.** Before implementing, verified the real current architecture per instruction ("if a roadmap item is already correctly implemented... record the evidence and move on"). Finding: trader (`DealCard`) and admin (`AdminRecordCard`) already share one consistent visual foundation — the `ro-portal-card` CSS utility class, used across 28 files. `DealCard` is already reused directly for trader deals, trader home, *and* wholesale requests — there was never a separate wholesale implementation to consolidate. Admin's `AdminRecordCard` is already the established `DataTable` mobile fallback everywhere. Only the storefront catalog `ProductCard` is visually distinct, correctly so (image-led merchandising card vs. operational record rows — different job, different shape, exactly the difference the mandate said to preserve).
- **Decision: no `RoListCard` component built.** Forcing it in would have meant discarding working, tested components for a redundant abstraction achieving nothing the CSS-class layer doesn't already achieve — directly against "do not replace working functionality." Full evidence: `PROJECT_AUDIT.md` Session 4, Track C.
- **Completion evidence:** Live browser verification (admin dashboard, zero console errors, consistent card rendering), grep evidence of `ro-portal-card` usage breadth.
- **Owner note:** if a *visual* refresh of these cards (not a structural consolidation) is still wanted, that's a distinct, smaller WP6-equivalent task — flag if so.

### WP10 — Security and functional hardening
- **Status:** **zod migration complete** (commit `b629cfd`). Inventory: one file imports zod directly, six consumers, one consistent pattern. `zod@^3.24.2` → `^4.6.7`. Verification: `tsc` clean, build clean, `test:week3` 58/58, `test:wholesale-security` 9/9, `test:f5-action-contracts` 16/16, plus a 20-case schema-level smoke test (success/failure paths, `superRefine` custom issues, `preprocess` chains) — 20/20. `npm audit`: app's own zod no longer a direct finding; one transitive zod remains via `puppeteer-core` (devDependency, documented, low-priority). Live-verified in browser post-migration.
- **Remaining in WP10:** the 9 transitive dev-tool `npm audit` findings (optional, low-priority, needs a `puppeteer-core` major bump — not done, correctly deferred); structured-logging/error-exposure pass (WP0-S7/S10, not done this session, no contradiction found requiring urgency).
- **Correction to WP1's recommendation:** `scripts/security-audit.mjs` already wraps `npm audit --audit-level=high` exactly as recommended — confirmed this session. No new script needed; the WP1 recommendation is superseded.
- **Owner approval required:** No further approval needed — migration timing was already authorized.

### WP11 — Automated testing, accessibility, and performance
- **Status:** **CLS root-caused; test-tooling fix shipped** (commit `565b3cc`). Lighthouse's own trace gatherers still error in this environment (confirmed again). Built a direct CDP + native `PerformanceObserver` profiler connected to the exact Chrome instance Lighthouse spawns. **Finding: the dominant measured shift was the browser window itself resizing mid-load (chrome-launcher default window racing Lighthouse's `screenEmulation` CDP call) — a test-harness artifact, not an application defect.** Fixed by pinning `--window-size=390,844` at Chrome launch. Post-fix, true native CLS measured 0 in 5/6 runs, 0.086 in 1/6 (both within the ≤0.1 budget). Honest residual: Lighthouse's own full-pipeline score still shows some flakiness (2/3 clean, 1/3 not) from a secondary timing sensitivity inside Lighthouse's own sequencing, not reachable from outside the library.
- **Remaining in WP11:** full E2E state coverage beyond spot-checks; rate-limiter load test; CI-based authoritative Lighthouse grading (blocked on WP0-B5, GitHub billing).
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
