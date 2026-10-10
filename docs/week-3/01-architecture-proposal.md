# Week 3 — Architecture Proposal (APPROVED)

**Project B:** `D:\N I G H T\rare-oud-platform`  
**Status:** Approved with client decisions (2026-10-05)  
**Project A:** untouched  

---

## Approved decisions summary

### Track 1 — Retail + WhatsApp handoff
- Evolve existing `RetailRequest` (no separate Order entity).
- Statuses: `draft` → `ready_for_handoff` → `handoff_opened` → `in_follow_up` → `completed` | `cancelled`.
- WhatsApp Week 3: prefilled `wa.me` + stored message text + structured payload. **No** Business API. **No** inbox.
- Business number from env (not hard-coded).
- Customer storefront is primary handoff path; admin may reopen/retrigger **without** duplicating the request.
- No “contacted” dashboard metric.

### Track 2 — Trader deals
- Negotiation model (Week 1): propose / continue / counter / accept / close — **not** approve/reject-only.
- Admin participation visible in negotiation history (structured entries, not real-time chat).
- `PublicCuratedOffer` optional; explicit admin action only; never auto from deal.
- Non-catalog deals never auto-create/modify catalog.
- Structured minimum v1 deal fields; no marketplace/commission rules.

### Track 3 — Wholesale
- Product must be `published` **and** `wholesaleEligible`.
- Same client catalog (no duplicate wholesale DB).
- MOQ left OPEN — **not** enforced in Week 3.
- No wholesale shipping/tracking system in Week 3.
- Simple admin quotation when mode = request quote.
- No payment / rate engine / ERP.

#### Phase 3 wholesale lifecycle (dedicated — not DealProposal statuses)

Request modes:
- `request_quote` — trader asks RARE OUD for a quotation (default when no applicable wholesale list price exists; platform does **not** invent wholesale pricing).
- `propose_price` — trader supplies their own proposed unit price (not a platform-invented discount/tier).

Statuses:
`submitted` → `under_review` → `quote_provided` → `confirmed` → `completed`
OR → `cancelled` from open stages.

Notes:
- No separate wholesale product catalog; Product ownership remains RARE OUD.
- Quantity: positive integer only; technical upper bound for abuse protection (not MOQ).
- Quotation acceptance creates fulfillment intent via `confirmed` on the same `WholesaleRequest` — never creates RetailRequest/DealProposal.
- Shipping/payment remain out of scope.

### Identity & access
- Minimal trader auth approved: admin-created accounts, hashed passwords, server sessions, own-records only.
- No public trader self-registration; no customer accounts.
- Portal: `/trader/*`
- Public offers: `/offers` (published `PublicCuratedOffer` only).

### Domain roots (final)
- Retail: `RetailRequest`
- Deals: `DealProposal`, `NegotiationEntry`, optional `PublicCuratedOffer`
- Wholesale: `WholesaleRequest`, `WholesaleRequestLine`

### Permanent non-goals
Payment, inventory, trader storefronts/products, commissions, shipping-rate engine, shipment tracking, WA Business API/inbox, real-time chat, auto deal→catalog conversion, customer accounts, public trader registration.

---

## Implementation order

1. **Phase 1** — Retail + WhatsApp Handoff  
2. **Phase 2** — Trader Deals + Negotiation  
3. **Phase 3** — Wholesale Ordering  
4. **Phase 4** — Security, validation, integration, regression  

After each phase: stop and report.

---

## Phase 1 detailed scope (this phase)

### Schema / domain
- Expand `RetailRequest.status` allowed values to approved lifecycle.
- Add fields: `handoffMessageText`, `whatsAppDeepLink` (nullable), `handoffPreparedAt`, `handoffOpenedAt` (as needed).
- Optional `RetailHandoffEvent` audit log for prepare/open/retrigger (preferred for auditability).

### Behavior
- On create / prepare: generate structured payload + message text; build `wa.me` link from `WHATSAPP_BUSINESS_E164` (or similar env).
- Customer confirmation UI: primary CTA opens deep link; status → `handoff_opened` when opened/acknowledged.
- Admin: view request; transition to `in_follow_up` / `completed` / `cancelled`; regenerate/retrigger handoff without new request.

### Out of Phase 1
- Trader auth, deals, wholesale, WA inbox, shipping rates, payments.
