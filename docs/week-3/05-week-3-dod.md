# Week 3 — Definition of Done

**Project B:** `D:\N I G H T\rare-oud-platform`  
**Date:** 2026-10-05  
**Phase 4:** Hardening + integration + regression complete  
**Week 4:** not started  

---

## Concise status table

| Area | Status | Evidence / Test |
|---|---|---|
| A. Retail + WhatsApp | Done | Lifecycle transitions; wa.me only; retrigger no duplicate — `npm run test:week3` |
| B. Trader Deals + Negotiation | Done | propose/continue/counter/accept/close; IDOR blocked; no auto Product/Offer |
| C. Wholesale | Done | Eligibility + quote workflow + qty limit; `test:week3` + `test:wholesale-security` |
| D. Auth & Authorization | Done | Role-separated JWTs; middleware role checks; session.sub ownership |
| E. Cross-domain isolation | Done | No auto Retail↔Deal↔Wholesale↔Product/Category coupling |
| F. Snapshot integrity | Done | Retail/wholesale name & price snapshots survive catalog edits |
| G. Security/regression tests | Done | 58 week3 checks + wholesale security script — all PASS |
| H. TypeScript / build | Done | `tsc` via build + `npm run build` PASS |
| I. Known risks | Documented | See section I |
| J. OPEN commercial decisions | Documented | See section J |
| K. Project A untouched | Confirmed | No production work in Vision Project A |

---

## A. Retail + WhatsApp

**Lifecycle verified:**  
`draft → ready_for_handoff → handoff_opened → in_follow_up → completed | cancelled`

- Invalid transitions rejected server-side (`canTransitionRetailRequest` / `transitionRetailRequestStatus`)
- Retrigger regenerates message/deep link on the **same** RetailRequest (no duplicate)
- WhatsApp number from `WHATSAPP_BUSINESS_E164`
- **No** WhatsApp Business API send path; **no** inbox
- **No** payment / shipping-rate engine
- Stored `handoffMessageText`, `whatsAppDeepLink`, `handoffPayloadJson`, `RetailHandoffEvent` remain auditable

---

## B. Trader Deals + Negotiation

**Lifecycle verified:**  
`proposed → negotiating → accepted | closed`

**Entries verified:** propose / continue / counter / accept / close

- Trader ownership enforced (`getDealForTrader`, negotiation actorTraderId check)
- Cross-trader read/write blocked
- Accepted deals do **not** create Product or PublicCuratedOffer
- Non-catalog deals cannot reference products and do not modify catalog
- Negotiation history auditable via `NegotiationEntry`
- PublicCuratedOffer only via explicit admin action

---

## C. Wholesale

**Lifecycle verified:**  
`submitted → under_review → quote_provided → confirmed → completed | cancelled`

- Auth: active trader session only; traderId from session
- Cross-trader IDOR blocked
- Eligibility revalidated: `published` + `wholesaleEligible`
- `request_quote` does not invent wholesale prices; catalog retail is reference snapshot only
- Technical qty max **10,000** (abuse limit, **not** MOQ)
- Quote required before confirm for `request_quote`
- No payment / shipping / ERP / MOQ / discounts / tiers

---

## D. Authentication & Authorization

### Phase 4 security fix (documented)

**Defect found:** Admin and trader JWTs shared `AUTH_SECRET`. A trader JWT placed in the admin cookie could pass middleware JWT verify and previously pass `getAdminSession()` without an `AdminUser` existence/`role` check, potentially exposing admin page data.

**Fix applied:**
1. Admin tokens now include `role: "admin"`
2. `verifyAdminSessionToken` rejects non-admin roles
3. `getAdminSession` also requires a living `AdminUser` row
4. Middleware requires `payload.role === "admin"` for `/admin/*` and `role === "trader"` for `/trader/*`

**Note:** Existing admin browser sessions issued before this fix must sign in again.

### Model
- Separate cookies: `ro_admin_session` / `ro_trader_session`
- Passwords hashed (bcrypt); no plaintext storage
- Server actions use `requireAdminSession` / `requireTraderSession`
- Client-supplied traderId never used as authorization source
- No public trader self-registration; no customer accounts

### Route posture
| Route group | Access |
|---|---|
| `/catalog`, `/product/*`, `/cart`, `/request`, `/offers` | Public (offers = published only) |
| `/admin/*` (except login) | Admin role JWT + AdminUser |
| `/trader/*` (except login) | Trader role JWT + active TraderAccount |

---

## E. Cross-domain isolation

Verified (runtime + code review):

| From → must not auto-create/modify | Result |
|---|---|
| RetailRequest → Deal / Wholesale / Product / Offer | Isolated |
| DealProposal → Retail / Wholesale / Product / Category | Isolated (accept ≠ catalog write) |
| WholesaleRequest → Retail / Deal / Product / Category / Offer | Isolated |
| PublicCuratedOffer | Explicit admin only |

No hidden conversion logic found or introduced.

---

## F. Snapshot integrity

- Retail lines keep `productName*` / price snapshots after product rename/price change
- Wholesale lines keep name + `catalogRetailPriceSnapshot` after catalog edits
- Catalog retail snapshot is **not** treated as wholesale commercial price
- Deal catalog references are optional FKs; commercial terms live on the deal/entries

---

## G. Security / regression tests

| Command | Result |
|---|---|
| `npm run test:week3` | **58 passed** |
| `npm run test:wholesale-security` | **All PASS** |

Suite covers: cross-trader auth, invalid transitions, offer draft/publish visibility, eligibility, qty bounds, snapshot stability, JWT role separation, no auto Product/Offer on deal accept.

---

## H. TypeScript / build results

- Production build (`npm run build`) including lint + typecheck: **PASS**
- No Week 4 dependencies added

---

## I. Known risks

1. **Admin re-login required** after role-claim fix for pre-existing sessions.
2. Storefront `markRetailHandoffOpened` relies on knowing `requestId` from create response (acceptable for Week 3; not a public enumerable API).
3. Middleware is first gate; sensitive mutations also require server action session checks — keep both in sync when adding routes.
4. Seed credentials are local fixtures only — must never ship as production secrets.
5. OPEN commercial fields (currency defaults, MOQ, wholesale list prices) remain unresolved — do not invent in Week 4 without client decisions.

---

## J. Remaining OPEN commercial decisions

- Currency commercial default  
- MOQ values / new vs regular trader definition  
- Wholesale list / discount / tier pricing  
- Shipping availability & rates  
- Non-catalog → catalog conversion workflow  
- Finer negotiation/wholesale closure taxonomies (if client needs more than current)  
- Exact WhatsApp message template beyond current structured text  

---

## K. Project A confirmation

**Project A (Vision / instrumental platform) was completely untouched** during Week 3 implementation and Phase 4 hardening. All production work remains in Project B (`rare-oud-platform`).

---

## Phase 4 code changes (hardening only)

- `lib/auth/admin-session.ts` — admin role claim + AdminUser-backed session
- `middleware.ts` — explicit role checks for admin/trader
- `lib/offers/service.ts` — clear `publishedAt` on unpublish/draft
- `scripts/week3-regression.ts` — repeatable Week 3 suite
- `package.json` — `test:week3`, `test:wholesale-security`
- `prisma/seed.ts` / `.env.example` — development-only credential warnings

No new commercial features. No Week 4 work.

---

## STOP

Week 3 is complete for DoD purposes.  
**Do not begin Week 4 without a new go-ahead.**
