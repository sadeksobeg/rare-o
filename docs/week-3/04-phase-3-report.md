# Week 3 — Phase 3 Report: Wholesale Trader Ordering

**Project B:** `D:\N I G H T\rare-oud-platform`  
**Project A:** untouched  
**Status:** Complete — STOP before Phase 4  

---

## 1. Phase 3 summary

Implemented wholesale as an independent domain root:

- `WholesaleRequest` + `WholesaleRequestLine` + audit `WholesaleRequestEvent`
- Reused existing trader session auth only (no DealProposal redesign)
- Eligibility: `published` **and** `wholesaleEligible` (same catalog)
- Modes: `request_quote` | `propose_price` (trader-supplied price only — no invented wholesale list/discount/tier pricing)
- Simple admin quotation → trader accept/decline → confirmed fulfillment intent on the **same** WholesaleRequest
- MOQ not enforced; technical qty max documented
- No payment, shipping engine, inventory, ERP, or cross-domain auto-creation

Architecture proposal updated with the dedicated wholesale lifecycle.

---

## 2. Database / schema changes

Migration: `20261005111015_week3_phase3_wholesale`

| Model | Purpose |
|---|---|
| `WholesaleRequest` | Mode, status, quote fields, trader notes, timestamps |
| `WholesaleRequestLine` | Product snapshots, qty, proposed/quoted unit prices, catalog retail ref. |
| `WholesaleRequestEvent` | Auditable lifecycle events |

`TraderAccount.wholesaleRequests` and `Product.wholesaleLines` relations added.  
Retail / Deal models unchanged in behavior.

---

## 3. Wholesale lifecycle

Statuses (dedicated — **not** DealProposal statuses):

`submitted` → `under_review` → `quote_provided` → `confirmed` → `completed`  
OR → `cancelled` from open stages.

| Transition notes |
|---|
| Admin moves `submitted` → `under_review` |
| Admin provides quotation → `quote_provided` |
| `request_quote` cannot admin-confirm from `under_review` without a quote (`QUOTE_REQUIRED_BEFORE_CONFIRM`) |
| `propose_price` may admin-confirm from `under_review` after review |
| Trader accept quote → `confirmed` (fulfillment intent) |
| Trader decline quote → `cancelled` |
| Trader may cancel while `submitted` / `under_review` |
| Admin completes/cancels where transitions allow |

Modes:
- **request_quote** — default commercial path when no wholesale list price exists
- **propose_price** — trader proposes unit price (platform does not invent discounts)

---

## 4. Trader UI changes

Under `/trader/*` (distinct from Deals):

| Route | Capability |
|---|---|
| `/trader/wholesale` | Browse eligible products; submit request |
| `/trader/wholesale/requests` | List own requests |
| `/trader/wholesale/[id]` | Detail, snapshots, quotation, accept/decline/cancel |

Nav: Wholesale / Wholesale requests. Overview links to wholesale.

---

## 5. Admin UI changes

| Route | Capability |
|---|---|
| `/admin/wholesale` | Queue of wholesale requests |
| `/admin/wholesale/[id]` | Inspect trader, lines/snapshots, transitions, provide quotation |

Admin nav: Wholesale.

---

## 6. Quote workflow

1. Trader submits (`request_quote` or `propose_price`)  
2. Admin reviews (`under_review`)  
3. Admin saves per-line quoted unit prices + message → `quote_provided`  
4. Trader accepts → `confirmed` (fulfillment intent on WholesaleRequest only)  
5. Admin → `completed`  
Decline / cancel paths set `cancelled`  

No payment, invoice, shipping rate, or ERP.

---

## 7. Product eligibility enforcement

Server-side at submission:

- Product must exist  
- `status === "published"`  
- `wholesaleEligible === true`  
- Otherwise `PRODUCT_NOT_WHOLESALE_ELIGIBLE`  

Catalog retail is snapshotted as **informational reference only**, labeled as not wholesale pricing.  
No separate wholesale catalog. Seed demo product set `wholesaleEligible: true` for verification.

---

## 8. Authorization / IDOR test results

Script: `npx tsx scripts/wholesale-security-checks.ts` — **all PASS**

| Check | Result |
|---|---|
| Trader B cannot read Trader A request | PASS (`getWholesaleRequestForTrader`) |
| Trader B cannot modify Trader A request | PASS |
| Ineligible/draft product rejected | PASS |
| Qty 0 rejected | PASS |
| Qty > technical max (10000) rejected | PASS |
| Admin quotation → quote_provided | PASS |
| Owner trader can accept quote | PASS |
| Unauthenticated create | Guarded by `requireTraderSession` + `/trader` middleware |
| Client traderId override | Not accepted — session.sub only in actions |
| Admin quote/transition | `requireAdminSession` on actions |

---

## 9. TypeScript / build / test results

- Security script — pass  
- `npx tsc --noEmit` — pass (via build typecheck)  
- `npm run build` — pass  

---

## 10. Files changed (primary)

- `docs/week-3/01-architecture-proposal.md` (Track 3 lifecycle detail)
- `prisma/schema.prisma`, migration `week3_phase3_wholesale`, `prisma/seed.ts`
- `lib/wholesale/constants.ts`, `lib/wholesale/service.ts`
- `lib/validation/schemas.ts` (wholesale schemas)
- `app/wholesale-actions.ts`
- `app/trader/(protected)/wholesale/**`
- `app/admin/(protected)/wholesale/**`
- `components/trader/wholesale-*.tsx`, `components/admin/wholesale-controls.tsx`
- `components/trader/shell.tsx`, `components/admin/shell.tsx`
- `scripts/wholesale-security-checks.ts`

Deal domain files not redesigned.

---

## 11. Remaining open decisions

- MOQ (values / new vs regular) — **OPEN**, not enforced  
- Wholesale discount / tier / list pricing — **OPEN**, not invented  
- Shipping rates / carriers / tracking — **OUT OF SCOPE**  
- Warehouse / ERP / payment — **OUT OF SCOPE**  
- Non-catalog wholesale products — **not supported** (catalog eligibility only)

**Technical safety limit (not MOQ):** `WHOLESALE_QTY_TECHNICAL_MAX = 10_000`

---

## 12. Risks / recommended Week 3 Phase 4 hardening

- End-to-end regression across Retail + Deals + Wholesale sessions  
- Confirm admin product form wholesaleEligible UX is clear enough for ops  
- Optional: rate-limit wholesale submission; tighten quote currency rules  
- Optional: integration tests for middleware unauthenticated redirects  
- Document that catalog retail snapshot must never be treated as wholesale price in reporting  

---

## Conflicts

**None.** Lifecycle implements the approved simple quotation workflow without collapsing domains or inventing MOQ/pricing/shipping.
