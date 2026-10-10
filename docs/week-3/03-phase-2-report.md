# Week 3 — Phase 2 Report: Trader Deals + Negotiation

**Project B:** `D:\N I G H T\rare-oud-platform`  
**Project A:** untouched  
**Status:** Complete — STOP before Wholesale (Phase 3)  

---

## 1. Phase 2 summary

Implemented the approved Trader Deals domain as a separate root from Retail:

- Minimal admin-provisioned `TraderAccount` + secure trader sessions
- `DealProposal` + auditable `NegotiationEntry` (propose / continue / counter / accept / close)
- Optional `PublicCuratedOffer` with explicit admin create/publish only
- Trader portal `/trader/*`, admin deal/trader/offer management, public `/offers`
- No connection to RetailRequest, payment, inventory, commissions, or auto catalog conversion

---

## 2. Database / schema changes

Migration: `20261005110359_week3_phase2_trader_deals`

| Model | Role |
|---|---|
| `TraderAccount` | Minimal trader identity (email, hashed password, profile fields, active/disabled) |
| `DealProposal` | Structured v1 deal (kind, title, optional product, commercial snapshot, status) |
| `NegotiationEntry` | Structured negotiation history tied to one deal |
| `PublicCuratedOffer` | Optional curated public layer (draft/published/unpublished) |

`Product` gained optional reverse relations for catalog deal references and curated offers — ownership remains RARE OUD.

Retail models (`RetailRequest`, `RetailHandoffEvent`, …) unchanged in behavior.

---

## 3. Routes / UI added

### Public
- `/offers` — published curated offers only
- `/offers/[slug]` — offer detail (premium, non-marketplace presentation)

### Trader (`/trader/*`)
- `/trader/login`
- `/trader` — overview
- `/trader/profile`
- `/trader/deals`, `/trader/deals/new`, `/trader/deals/[id]`
- `/trader/offers` — link into published public offers

### Admin
- `/admin/traders` — create / enable / disable traders
- `/admin/deals`, `/admin/deals/[id]` — negotiation workspace
- `/admin/offers`, `/admin/offers/new`, `/admin/offers/[id]` — curate + publish/unpublish

Storefront nav: quiet “Curated offers” link. Admin nav: Traders / Deals / Offers.

---

## 4. Authentication / authorization model

- **No** public trader self-registration; admin creates accounts
- Passwords hashed with bcrypt (same helper path as admin)
- Separate httpOnly cookie session: `ro_trader_session` (JWT with `role: "trader"`)
- Middleware protects `/trader/*` except `/trader/login`
- Server actions call `requireTraderSession()` / `requireAdminSession()`
- **traderId always from session** — never trusted from client body
- Deal reads for traders use `getDealForTrader(dealId, session.sub)` (ownership filter) → prevents IDOR via URL id swap
- Negotiation writes re-check `actorTraderId === deal.traderId`

Customer accounts: still out of scope.

---

## 5. Deal lifecycle implemented

Statuses: `proposed` → `negotiating` → `accepted` | `closed`

| Action | Effect on status |
|---|---|
| `propose` (create only) | `proposed` |
| `continue` / `counter` | `negotiating` (while open) |
| `accept` | `accepted` |
| `close` | `closed` |

Kinds:
- `catalog` — requires existing Product reference (no ownership transfer)
- `non_catalog` — **forbids** productId; never creates/modifies Product/Category

---

## 6. Negotiation lifecycle implemented

- Structured `NegotiationEntry` rows only (not chat / WebSocket / inbox / presence)
- Actors: `trader` | `admin` recorded on every entry
- Admin participation visible in history
- Counter may update deal commercial snapshot (price/currency/qty/conditions) when provided
- Open deals only; terminal deals reject further negotiation

---

## 7. Public offer behavior

- Never auto-created on deal accept
- Explicit admin create (blank or “Create draft offer from this deal”)
- Explicit publish / unpublish / draft status actions
- `/offers` lists **published** only
- Not a trader storefront; trader identity not shown as seller

---

## 8. Security / IDOR checks

| Check | Result |
|---|---|
| Client-supplied traderId ignored on create | Enforced (session.sub only) |
| Trader A cannot load Trader B deal by URL | `getDealForTrader` + `notFound()` |
| Trader cannot negotiate on another’s deal | `FORBIDDEN` if traderId mismatch |
| Disabled trader cannot keep using session | `requireTraderSession` checks `status === active` |
| Admin routes still require admin session | Middleware + `requireAdminSession` |
| Retail/WhatsApp paths untouched by deal auth | Separate domains |

---

## 9. Tests / typecheck / build

- `npx tsc --noEmit` — pass  
- `npm run build` — pass (lint + types)  
- `npm run db:seed` — pass (admin + demo trader fixture)

Demo trader (local): `trader@rareoud.local` / `ChangeMeNow!` (or `TRADER_EMAIL` / `TRADER_PASSWORD`)

---

## 10. Remaining open decisions (flagged, not invented)

1. Exact commercial semantics beyond optional price/currency/qty/notes (payment terms, commissions, etc.) — **OPEN**
2. Final closure taxonomy beyond `accepted` / `closed` if client later needs more — **OPEN** (Week 1 noted closure states OPEN)
3. Non-catalog → future catalog conversion workflow — **OPEN**; Phase 2 only forbids auto conversion
4. New vs regular trader classification — deferred to Wholesale / later (MOQ OPEN)

---

## 11. Files changed (primary)

- `prisma/schema.prisma`, migration `20261005110359_week3_phase2_trader_deals`, `prisma/seed.ts`
- `lib/auth/trader-session.ts`
- `lib/deals/constants.ts`, `lib/deals/service.ts`
- `lib/offers/service.ts`
- `lib/validation/schemas.ts`
- `lib/i18n/dictionaries.ts`
- `middleware.ts`
- `app/deal-actions.ts`
- `app/trader/**`, `app/admin/(protected)/{traders,deals,offers}/**`
- `app/(storefront)/offers/**`
- `components/{trader,deals,admin}/*`
- `components/admin/shell.tsx`, `components/storefront/header.tsx`

---

## 12. Phase 3 recommendation

Proceed to **Wholesale Ordering** only after Phase 2 approval:

- `WholesaleRequest` + `WholesaleRequestLine` as a **separate** domain root
- Eligibility: published + `wholesaleEligible`
- Trader auth reuse (own wholesale records only)
- Request quote → simple admin quotation workflow
- **Do not** enforce MOQ; **do not** build shipping/tracking/payment
- Keep Retail + Deals untouched except shared trader session if needed

---

## Conflicts

**None** with Week 1 negotiation rules, Week 2 foundations, Phase 1 retail handoff, or the approved Week 3 architecture decisions.
