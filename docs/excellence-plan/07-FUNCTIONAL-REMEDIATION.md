# Section 7 — Full Functional and Business Review

Evidence for every claim below is in `01-TRACEABILITY-MATRIX.md`; this document organizes it by surface into an actionable remediation plan and resolves the decisions that have actual evidence to resolve, without inventing owner approval.

## Storefront

| Area | State | Action needed |
|---|---|---|
| Homepage (H1–H9) | Verified correct, including all three conditional empty-states (WP4a) | None |
| Catalog, categories, search, filter | PASS per `DELIVERY-VS-CONTRACT.md`; filter scope (type + price only) correctly matches contract clarification 1 (re-verified visually this session) | None |
| Product detail + media | PASS; magic-byte upload validation now closes the one real gap the Oct 18 audit found (WP0-A7) | None |
| Cart + request submission | Cart a11y defect fixed (Session 1); price-on-request now verified end-to-end schema→UI (WP4a) | None |
| Validation/loading/empty/success/error states | Covered by `06-cross-cutting.md` §7; spot-verified on home and cart this session | Full state-by-state re-verification across every remaining storefront route is in scope for **WP11**, not re-done here without a specific reason to doubt a given route |

## Trader

| Area | State | Action needed |
|---|---|---|
| Authentication, profile | PASS; rate-limit/lockout now confirmed present (WP0-A6) | None |
| Deal proposal and negotiation, including accept/counter/continue/close/reject semantics | **Now resolved** — `rejected` is an explicit status (WP0-A4), closing a real contract-wording gap ("admin accepts or rejects," item 3.6) | None |
| Deal product-conflict blocking | Beyond-contract extension, **recommend keep** (WP0-C1) — protects data integrity, already tested | Document as an approved extension in a companion note to Appendix S; no code change |
| Deal history and status visibility | PASS | None |
| Wholesale eligibility and lifecycle | PASS, shipping/tracking fields confirmed present (WP0-A9) | None |
| Trader notifications | Beyond-contract extension, **recommend keep** (WP0-C2) — no conflict, already built and tested | Document as approved extension |

## Admin

| Area | State | Action needed |
|---|---|---|
| Dashboard, action queue | PASS; activity feed now dictionary-mapped, closing the Oct 18 raw-enum-leak finding (WP0-A2) | None |
| Product/category management | PASS; oud-spec tiers (Session 1) extend this without contract conflict | None |
| Customer management | PASS | None |
| Retail request lifecycle + audit history | PASS | None |
| Trader management + deal review | PASS | None |
| Wholesale review + fulfillment | PASS | None |
| Translated activity history / action feedback | Resolved (WP0-A2) | None |

## Outstanding business decisions — presented, not invented

Full detail with options/consequences/recommendation in `01-TRACEABILITY-MATRIX.md` §C. Summary:

| Decision | Current evidence | Contract ref | Recommendation | Status |
|---|---|---|---|---|
| Contract naming (Appendix S) vs. client-report naming (SECTION-02/03/04) | Appendix S is the signed source; client reports diverged in naming only, not substance | N/A — documentation consistency | Realign client reports to Appendix S naming in a **separately authorized** pass; not touched this phase per this mission's explicit "do not rewrite client reports" instruction | Flagged, deferred |
| Deal product-conflict blocking | Implemented, tested, beyond-contract | Beyond 3.6 | Keep | Needs owner acknowledgment, not a blocking decision |
| Trader notifications center | Implemented, tested, beyond-contract | Beyond 3.4 | Keep | Needs owner acknowledgment, not a blocking decision |
| Explicit rejection behavior | **Already implemented** (`rejected` status exists) | 3.6 | No decision needed — already done | Resolved |
| Wholesale shipping/tracking fields | **Already implemented** | 8.3 | No decision needed — already done | Resolved |
| Nullable retail price/currency | **Already implemented** (schema + UI) | D28b | No decision needed — already done | Resolved |

**No schema or lifecycle behavior is proposed to change merely to appear complete** — every item above that shows "already implemented" was independently re-verified this session (schema read, grep for the UI consumer, or both), not assumed from a prior audit's PASS mark.
