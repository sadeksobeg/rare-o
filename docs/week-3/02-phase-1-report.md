# Week 3 — Phase 1 Report: Retail + WhatsApp Handoff

**Project B:** `D:\N I G H T\rare-oud-platform`  
**Project A:** untouched  
**Status:** Complete — STOP for review before Phase 2  

---

## What changed

- Evolved existing `RetailRequest` into the operational record (no separate Order).
- Full lifecycle statuses with server-side transition rules + audit events.
- WhatsApp Week 3: generate stored message text + `wa.me` deep link from `WHATSAPP_BUSINESS_E164`.
- Storefront confirmation: primary CTA opens handoff and marks `handoff_opened`.
- Admin: transition status, retrigger handoff (same request), reopen WhatsApp link.
- No “contacted” dashboard metric (uses status counts only).
- No WhatsApp Business API, no inbox, no payment/stock.

---

## Database / schema changes

Migration: `20261005105544_week3_phase1_retail_handoff`

`RetailRequest` added:
- `handoffMessageText`
- `whatsAppDeepLink`
- `handoffPreparedAt`
- `handoffOpenedAt`
- Status comment updated to full lifecycle

New model: `RetailHandoffEvent`
- `eventType`: prepared | opened | retriggered | status_changed
- `fromStatus` / `toStatus`
- `actor`: customer | admin
- `actorAdminId`, `note`, timestamps

---

## Routes / UI changes

| Surface | Change |
|---|---|
| `/request` | Success shows prepared message + Open WhatsApp CTA |
| `/admin/requests` | Lifecycle copy updated |
| `/admin/requests/[id]` | Operations controls, stored message, audit log |
| `/admin` | Counts: ready / handoff opened / in follow-up (no “contacted”) |

Env:
- `WHATSAPP_BUSINESS_E164` (required for handoff prepare/retrigger)

---

## Business rules implemented

1. RetailRequest remains non-paid request (no payment/stock).
2. Statuses: `draft` → `ready_for_handoff` → `handoff_opened` → `in_follow_up` → `completed` \| `cancelled`.
3. Transitions enforced server-side via `RETAIL_REQUEST_TRANSITIONS`.
4. Handoff = wa.me + stored text + structured `handoffPayloadJson`.
5. Business number from env only.
6. Customer storefront is primary open path; admin may reopen/retrigger **without** creating a duplicate request.
7. Opening again after `handoff_opened` / `in_follow_up` is audited but does not invent a new status machine path beyond allowed transitions.

---

## Tests / typecheck / build

- `npx tsc --noEmit` — pass  
- `npm run build` — pass (lint + types included)  

---

## Security considerations

- Admin transitions / retrigger require admin session (`requireAdminSession`).
- Storefront `markRetailHandoffOpened` requires knowing `requestId` (returned only after create); no public listing.
- No Business API credentials; only public wa.me deep link construction.
- Passwords / payment / trader auth unchanged in this phase.

---

## Remaining open decisions

None blocking Phase 1. Still open for later phases (already approved at architecture level, not invented here):

- Exact commercial fields for DealProposal v1 (Phase 2 — flag any ambiguity rather than invent).
- MOQ remains OPEN (Phase 3 — do not enforce).
- Currency commercial default remains OPEN (Week 2 carry-forward).

---

## Conflicts with Week 1 / Week 2 / approval decisions

**None found.** Proceeded after architecture doc update.

---

## Next

Await go-ahead for **Phase 2 — Trader Deals + Negotiation**.
