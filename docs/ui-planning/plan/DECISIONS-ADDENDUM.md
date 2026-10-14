# Decision Lock addendum (D27+)

**Source:** Owner approval of `RECONCILIATION.md` conflicts and status table (2026-10-12).  
**Rule:** Do not edit `PLAN.md`. This file extends Part 00 Decision Lock from D28 onward.  
**Code/schema:** No implementation in the approval step. Schema migrations (D28b, D37b) are later dedicated slices after DB backup.

---

## Decisions

| # | Decision | Value |
|---|----------|--------|
| **D28** | Missing / on-request price | **b.** `retailPrice` and `currency` become nullable **together** (both set or both null). Zod enforces the pair. UI shows "السعر عند الطلب" / "Price on request" when null. Afterwards remove the "TEST currency ⇒ on-request" rule. **Later slice:** DB backup → safe migration → audit every `retailPrice` usage (sort, filters, compareAt, wholesale snapshots). |
| **D29** | Request geography | Country (`destinationCountry`) + optional notes; **no city field**. Wireframe / Part 03 wording «city» is **read as country** — do not add a city control. |
| **D30** | Offer model UI | Omit validity dates; **0–1** linked product (`productId` optional). No multi-product invent. |
| **D31** | Activity feed | Read-only union of existing domain event tables (`RetailHandoffEvent`, `NegotiationEntry`, `WholesaleRequestEvent`; optional inbound WA). |
| **D31b** | ActionQueue | Merged rows across the three domains where `nextActor === admin`, oldest first, max 8. |
| **D32** | Outbound kill-switch | **a.** Connection / dashboard UI shows **read-only** outbound state from env (`WHATSAPP_OUTBOUND_ENABLED` / `isOutboundEnabled()`). No in-app toggle in v1. |
| **D34** | Specs | Free-text bilingual (`specsTextAr` / `specsTextEn`); SpecTable soft-parses `label: value` lines. |
| **D37** | Wholesale shipping | **b.** Contracted (Appendix S **8.3**). **Later slice:** add nullable `carrier`, `trackingReference`, `shippedAt` on `WholesaleRequest`; admin entry; trader read-only. Nothing else. Not a scope expansion. |
| **D38** | Trader last sign-in | Omit column; no invented timestamp. |
| **D39** | Product featured flag | Omit schema field; homepage featured = existing helper / first published only. |
| **D40** | Dashboard KPIs | Counts derived from the **approved** status / `nextActor` table (see below), not ad-hoc status lists. |
| **D41** | Home section stack | **b.** Re-align `/` to locked **H1–H9** so it matches approved wireframes. |
| **D42** | Promo / compareAt / discount UI | Hidden behind `RO_PROMO_FEATURES` (default off); code and data kept. |

---

## Status table — verified from code (condition applied)

### Code evidence (retail creation & transitions)

| Fact | Evidence |
|------|----------|
| Storefront submit always creates **`ready_for_handoff`** | `app/actions.ts` → `createRetailRequestAction` passes `status: "ready_for_handoff"`; Zod default same in `lib/validation/schemas.ts` |
| Creation prepares wa.me + `RetailHandoffEvent` `prepared` | `lib/retail-request/service.ts` when status is `ready_for_handoff` |
| Customer opening WhatsApp advances **`ready_for_handoff` → `handoff_opened`** | `markRetailHandoffOpened` only advances when `from === "ready_for_handoff"` |
| `draft` is a legal status but **not** the storefront creation path | Schema default / transitions allow draft → ready_for_handoff; customer action never sets draft |
| Dashboard KPI today **omits** `ready_for_handoff` | `lib/admin/dashboard.ts` counts `draft`, `handoff_opened`, `in_follow_up` only — **bug vs D40** once table is applied |

**Owner condition:** A status in which a request first becomes visible to admin must have `nextActor = admin`. Creation state is `ready_for_handoff` → **`nextActor = admin`**. Statuses never shown as admin work → `none`.

### Approved mapping (post-condition)

Tone vocabulary unchanged: `neutral | info | progress | attention | success | danger | closed`.

#### RetailRequest

| value | tone | labelKey | nextActor | Notes |
|-------|------|----------|-----------|--------|
| `draft` | neutral | `status.retail.draft` | `admin` | Rare / internal; if present, admin-visible |
| `ready_for_handoff` | info | `status.retail.ready_for_handoff` | **`admin`** | **Creation state from storefront** — first admin visibility (overrides prior "customer" proposal) |
| `handoff_opened` | progress | `status.retail.handoff_opened` | `admin` | After customer opens wa.me |
| `in_follow_up` | attention | `status.retail.in_follow_up` | `admin` | |
| `completed` | success | `status.retail.completed` | `none` | |
| `cancelled` | closed | `status.retail.cancelled` | `none` | |

#### DealProposal

| value | tone | labelKey | nextActor |
|-------|------|----------|-----------|
| `proposed` | info | `status.deal.proposed` | `admin` |
| `negotiating` | progress | `status.deal.negotiating` | Invert last `NegotiationEntry.actorRole` (`dealNextActor`); if none → `admin` |
| `accepted` | success | `status.deal.accepted` | `none` |
| `closed` | closed | `status.deal.closed` | `none` |

#### WholesaleRequest

| value | tone | labelKey | nextActor |
|-------|------|----------|-----------|
| `submitted` | info | `status.wholesale.submitted` | `admin` |
| `under_review` | progress | `status.wholesale.under_review` | `admin` |
| `quote_provided` | attention | `status.wholesale.quote_provided` | `trader` |
| `confirmed` | success | `status.wholesale.confirmed` | `admin` |
| `completed` | success | `status.wholesale.completed` | `none` |
| `cancelled` | closed | `status.wholesale.cancelled` | `none` |

#### WhatsApp message status

| value | tone | labelKey | nextActor |
|-------|------|----------|-----------|
| `received` | info | `status.wa.received` | `none` |
| `pending` | progress | `status.wa.pending` | `none` |
| `sending` | progress | `status.wa.sending` | `none` |
| `sent` | success | `status.wa.sent` | `none` |
| `failed` | danger | `status.wa.failed` | `admin` |

#### Connection health (banner)

| state | Banner tone |
|-------|-------------|
| `CONNECTED` | success |
| `CONNECTING` / `RECONNECTING` | progress |
| `DISCONNECTED` / `ERROR` | danger |
| `AUTHENTICATION_REQUIRED` | attention |

**Implementation note (later, not this step):** update `lib/ui/status.ts` so `ready_for_handoff.nextActor = "admin"`, then align `getAdminHomeData` KPI filters with D40 (include `ready_for_handoff`).

---

## Deferred slices (explicit)

| Slice | Decisions | Prerequisite |
|-------|-----------|--------------|
| Nullable price migration | D28b | DB backup; audit all `retailPrice` / currency usages |
| Wholesale shipping fields | D37b | DB backup; Appendix S 8.3 only (`carrier`, `trackingReference`, `shippedAt`) |
| Home H1–H9 re-align | D41b | After CONFORMANCE.md review |
| KPI / ActionQueue / status.ts sync | D40, D31b, status condition | After this addendum |

---

## Explicit stop for this approval step

Recorded only. No code, schema, or dependency changes in this step.  
Next deliverable in the same turn: `docs/ui-planning/plan/CONFORMANCE.md` (read-only inventory).
