# P0 — Reconciliation (read-only)

**Date:** 2026-10-10  
**Baseline:** git `master` (post plan commit `236801e`)  
**Rule:** No UI code changes in P0. Plan files 00–07 not edited.  
**Owner gate:** Review conflicts → approve proposed **D27+** → then `START PHASE 1`.

---

## 1. Routes & file paths (plan 03–05 vs codebase)

### 1.1 Storefront

| Plan ID | Path | Exists? | File / note |
|---------|------|---------|-------------|
| SF-01 | `/` | YES | `app/(storefront)/page.tsx` — stack differs from H1–H9; rewrite in P4c |
| SF-02 | `/catalog` | YES | `app/(storefront)/catalog/page.tsx` — query today: `category`, `q` only |
| SF-03 | `/product/[slug]` | YES | `app/(storefront)/product/[slug]/page.tsx` — **no product images rendered** |
| SF-04 | `/cart` | YES | `app/(storefront)/cart/page.tsx` — labels say cart; D7 keeps route |
| SF-05 | `/request` | YES | `app/(storefront)/request/page.tsx` + `RequestForm` |
| SF-06 | `/offers` | YES | `app/(storefront)/offers/page.tsx` |
| SF-07 | `/offers/[slug]` | YES | `app/(storefront)/offers/[slug]/page.tsx` |
| SF-08 | `/contact` | **NEW** | Missing — create in P4d |
| SF-09 | `/privacy` | **NEW** | Missing — create in P4d |
| SF-10 | `not-found` / `error` / `loading` | **NEW** | No `app/**/loading.tsx`, `error.tsx`, `not-found.tsx` found |
| — | `/en/*` locale prefix | **NEW** | Middleware has admin/trader JWT only — P3 |
| — | `/dev/ui` | **NEW** | P1 |

### 1.2 Admin

| Plan ID | Path | Exists? | Note |
|---------|------|---------|------|
| AD-01 | `/admin/login` | YES | EN hard-coded |
| AD-02 | `/admin` | YES | KPIs ≠ plan’s four nextActor KPIs |
| AD-03 | `/admin/inbox`, `/[id]` | YES | Health + list exist; 3-pane layout pending |
| AD-04 | `/admin/requests`, `/[id]` | YES | |
| AD-05 | `/admin/deals`, `/[id]` | YES | |
| AD-06 | `/admin/wholesale`, `/[id]` | YES | |
| AD-07 | `/admin/products`, `/new`, `/[id]` | YES | **No ImageUploader / ProductImage write path** |
| AD-08 | `/admin/categories` | YES | Labels only; **no category image field** |
| AD-09 | `/admin/offers`… | YES | |
| AD-10 | `/admin/customers` | YES | |
| AD-11 | `/admin/traders` | YES | |
| — | `/admin` 403 view | **NEW** | Today: redirect to login (middleware) |

### 1.3 Trader

| Plan ID | Path | Exists? | Note |
|---------|------|---------|------|
| TR-01 | `/trader/login` | YES | EN hard-coded |
| TR-02 | `/trader` | YES | No “بانتظارك” / TaskCards yet |
| TR-03 | `/trader/deals` | YES | |
| TR-04 | `/trader/deals/new` | YES | Form exists; Wizard UX pending |
| TR-05 | `/trader/deals/[id]` | YES | |
| TR-06 | `/trader/wholesale` | YES | |
| TR-07 | `/trader/wholesale/requests` | YES | |
| TR-08 | `/trader/wholesale/[id]` | YES | |
| TR-09 | `/trader/offers` | YES | |
| TR-10 | `/trader/profile` | YES | |
| — | Bottom tab bar T01 | **NEW** | Shell is top-nav only |

---

## 2. Schema / field mapping (critical UI items)

### 2.1 Product & images

| UI item (plan) | Schema / code | Status |
|----------------|---------------|--------|
| Product name AR/EN | `Product.nameAr/nameEn` | OK |
| Description | `descriptionAr/En` | OK |
| Specs structured / SpecTable / SpecEditor | **Only** `specsTextAr` / `specsTextEn` free text | **GAP** — render as prose / parse lines; no attribute schema |
| Price / null “Price on request” | `retailPrice Decimal` **required**; Zod `nonnegative` | **CONFLICT C2** |
| Availability chip | `availability` available\|unavailable | OK |
| Status draft/published/archived | `status` | OK |
| Wholesale eligible | `wholesaleEligible` | OK |
| Images path, alt, order | `ProductImage.path`, `altAr/En`, `sortOrder`, `kind` | OK model |
| Primary image flag | **No** `isPrimary` — use `sortOrder === 0` | OK convention |
| Image upload action | **No** app upload/write for ProductImage | **GAP C1** |
| Category image | **No** field on `Category` | Use Material Plate (plan allows) |

### 2.2 Retail request (SF-05 / AD-04)

| UI item | Schema | Status |
|---------|--------|--------|
| name | `customerName` | OK |
| phone | `customerPhone` | OK |
| note | `customerNotes` | OK |
| city (plan SF-05) | **Missing** | **CONFLICT C3** — use `destinationCountry` (+ optional notes); do not invent city |
| shipping method | `shippingMethodCode/Label` optional | OK — keep if form already uses it |
| lines | `RetailRequestLine` | OK |
| statuses | draft → cancelled (6 values) | OK — map in status.ts |
| handoff events | `RetailHandoffEvent` | OK |
| WhatsApp deep link | `whatsAppDeepLink`, `handoffMessageText` | OK |

### 2.3 Deals & negotiation

| UI item | Schema | Status |
|---------|--------|--------|
| dealKind catalog\|non_catalog | OK | |
| title, productId, proposedPrice, currency, quantity, conditionsNotes | OK | |
| statuses proposed\|negotiating\|accepted\|closed | OK | |
| NegotiationEntry actions | propose\|continue\|counter\|accept\|close | OK |
| nextActor | **Derived** (not stored) | Implement in `lib/ui/status.ts` |

### 2.4 Wholesale

| UI item | Schema | Status |
|---------|--------|--------|
| requestMode, lines, quote fields, events | OK | |
| statuses (6) | OK | |
| MOQ / discounts | Must not invent | Boundary OK |

### 2.5 Public curated offer

| UI item | Schema | Status |
|---------|--------|--------|
| slug, titles, summaries, status | OK | |
| Linked product | `productId` optional **single** | OK |
| Included products grid | **No** M2M | **CONFLICT C4** — show 0–1 product card |
| Validity / end date | **No field** | **CONFLICT C4** — omit validity UI |
| Image | Via product images or Material Plate | OK |

### 2.6 WhatsApp

| UI item | Source | Status |
|---------|--------|--------|
| Conversation list fields | `WhatsAppConversation` | OK |
| unreadCount | column | OK |
| Messages direction/status | inbound/outbound; received\|pending\|sending\|sent\|failed | OK |
| Link types | none\|retail_request\|deal_proposal\|wholesale_request | OK |
| Connection health | `WhatsAppConnectionHealth.state` + `getInboxHealthView` | OK |
| States vs plan A18 | Code also has `RECONNECTING` | Map → progress / CONNECTING |
| Outbound pause switch | `WHATSAPP_OUTBOUND_ENABLED` env via `isOutboundEnabled()` | **GAP C6** — read-only UI OK; toggle = scope decision |
| Rate-limit message | Partial via errorSafe | Soft |

### 2.7 Contact config

| UI item | Source | Status |
|---------|--------|--------|
| `lib/config/contact.ts` | **Missing** | **NEW** in P4d (number from env) |

---

## 3. Draft `lib/ui/status.ts` mapping (for owner approval)

Tone vocabulary (file 01): `neutral | info | progress | attention | success | danger | closed`.

### 3.1 RetailRequest

| value | tone | labelKey (proposed) | nextActor |
|-------|------|---------------------|-----------|
| `draft` | neutral | `status.retail.draft` | `admin` |
| `ready_for_handoff` | info | `status.retail.ready_for_handoff` | `customer` |
| `handoff_opened` | progress | `status.retail.handoff_opened` | `admin` |
| `in_follow_up` | attention | `status.retail.in_follow_up` | `admin` |
| `completed` | success | `status.retail.completed` | `none` |
| `cancelled` | closed | `status.retail.cancelled` | `none` |

### 3.2 DealProposal

| value | tone | labelKey | nextActor |
|-------|------|----------|-----------|
| `proposed` | info | `status.deal.proposed` | `admin` |
| `negotiating` | progress | `status.deal.negotiating` | **last NegotiationEntry.actorRole inverted** (if last=admin → trader; if last=trader → admin); if none → admin |
| `accepted` | success | `status.deal.accepted` | `none` |
| `closed` | closed | `status.deal.closed` | `none` |

### 3.3 WholesaleRequest

| value | tone | labelKey | nextActor |
|-------|------|----------|-----------|
| `submitted` | info | `status.wholesale.submitted` | `admin` |
| `under_review` | progress | `status.wholesale.under_review` | `admin` |
| `quote_provided` | attention | `status.wholesale.quote_provided` | `trader` |
| `confirmed` | success | `status.wholesale.confirmed` | `admin` |
| `completed` | success | `status.wholesale.completed` | `none` |
| `cancelled` | closed | `status.wholesale.cancelled` | `none` |

### 3.4 WhatsApp message status (delivery footer)

| value | tone | labelKey | nextActor |
|-------|------|----------|-----------|
| `received` | info | `status.wa.received` | `none` |
| `pending` | progress | `status.wa.pending` | `none` |
| `sending` | progress | `status.wa.sending` | `none` |
| `sent` | success | `status.wa.sent` | `none` |
| `failed` | danger | `status.wa.failed` | `admin` |

### 3.5 Connection health → Banner tones

| state | Banner tone |
|-------|-------------|
| `CONNECTED` | success (collapsed) |
| `CONNECTING` / `RECONNECTING` | progress |
| `DISCONNECTED` / `ERROR` | danger |
| `AUTHENTICATION_REQUIRED` | attention |

**Action required:** Approve or edit nextActor rules especially for `negotiating` and `ready_for_handoff` (customer vs admin).

---

## 4. Data availability (dashboard & feeds)

| Need (plan AD-02) | Source today | Status |
|-------------------|--------------|--------|
| KPI: طلبات جديدة (nextActor=admin) | Derive from RetailRequest statuses in §3.1 | **Extend** `getDashboardCounts` or add `getAdminActionCounts` in P5a (allowed read helper) |
| KPI: صفقات بانتظار الرد | Derive from DealProposal + last entry | **NEW query** P5a |
| KPI: جملة بانتظار الرد | Wholesale where nextActor=admin | **NEW query** P5a |
| KPI: محادثات غير مقروءة | `unreadCount > 0` count | **OK** via prisma |
| ActionQueue (max 8, age sort) | Merge three domains | **NEW** read helper P5a — no invented metrics |
| ActivityFeed last 10 | No unified Activity table | **GAP C5** — union recent `RetailHandoffEvent` + `NegotiationEntry` + `WholesaleRequestEvent` + inbound WA (minimal) |
| ConnectionCard state | `getInboxHealthView` | OK |
| Outbound switch | env only | **C6** |
| Existing `getDashboardCounts` | product + retail buckets | Keep for secondary or replace UI with new four KPIs |

---

## 5. Image model notes

| Topic | Finding |
|-------|---------|
| Model | `ProductImage`: path, altAr, altEn, sortOrder, kind (`image`\|`video`) |
| Storage | `public/uploads/` gitignored except `.gitkeep` |
| Write path | **Missing** — ProductForm does not attach images |
| Primary | Convention: lowest `sortOrder` |
| Plan limits | Max 8 images; min long side 1600 px — enforce in upload action when added |
| Storefront today | Catalog/PDP use empty surface boxes; discovery uses `<img>` sometimes |
| P4a requirement | `next/image` + Material Plate; upload can ship in P5d if products seeded with paths earlier |

---

## 6. Middleware design (P3 — no JWT logic change)

Current (`middleware.ts`): JWT verify for `/admin/*` (except login) and `/trader/*` (except login); wrong role → redirect to that portal’s login.

**Proposed additions (without weakening auth):**

1. **Storefront locale rewrite:** if path starts with `/en/` or equals `/en`, strip prefix, set request header/cookie `ro_locale=en`, rewrite to unprefixed path. Arabic paths leave locale `ar` (default). Do **not** auto-redirect by `Accept-Language`.
2. **Cross-role 403:** if valid **trader** JWT hits `/admin/*` → rewrite/redirect to a dedicated **403 page** (not login). Same for **admin** JWT on `/trader/*`. Today both go to login — plan wants explicit 403 copy.
3. JWT secret/role checks remain unchanged.

---

## 7. Conflict list & proposed resolutions (→ D27+)

| ID | Conflict | Severity | Proposed resolution (needs owner) |
|----|----------|----------|-----------------------------------|
| **C1** | No ProductImage upload UI/API | P0 for catalog quality | **D27:** Allow minimal server action + local `public/uploads` write in P5d (or P4a if needed for demo). Types/size limits per plan. No cloud CDN required. |
| **C2** | Null price / “Price on request” vs required Decimal | Medium | **D28a (recommended for launch):** Keep required price; dictionary string unused until schema opens. **D28b:** Allow `retailPrice` nullable + Zod optional — small schema migration. |
| **C3** | Plan “city” vs schema `destinationCountry` | Medium | **D29:** UI labels country (not city); optional note covers city. No schema change. |
| **C4** | Offer validity + multi-product inclusion | Medium | **D30:** Omit validity; show single linked product only; no fake product lists. |
| **C5** | No ActivityFeed table | Low | **D31:** Read-only union query of existing event tables; if too heavy, show retail handoff events only in v1. |
| **C6** | Outbound kill-switch is env-only | Medium | **D32a:** ConnectionCard shows read-only outbound state. **D32b (scope):** Persist toggle — **out of UI-only scope**; require explicit backend approval. Prefer **D32a**. |
| **C7** | Catalog filters `type/min/max/sort` vs `category/q` | Medium | **D33:** Map `type`→category slug; add price/sort in `listPublishedProducts` (read filter only, no new entities). |
| **C8** | SpecEditor “schema-defined attributes” | Low | **D34:** SpecEditor = bilingual textarea for `specsText*`; SpecTable = split lines `label: value` when `:` present, else single block. |
| **C9** | SF-05 omits shipping fields present in Zod | Low | **D35:** Keep destination country (+ shipping picker if already in form); do not remove domain fields to match short copy. |
| **C10** | Cost breakdown file missing | Process | **D36:** Proceed on locked UI plan; insert `docs/scope/cost-breakdown-scope.md` when available; no silent scope add. |
| **C11** | Home discovery modules vs H1–H9 | Low | Replace in P4c; delete dead modules in P7 (already planned). |
| **C12** | Compare feature | None | Keep dormant behind flag (D9). |

---

## 8. Business boundary check

| Rule | Plan vs code | Result |
|------|--------------|--------|
| No payment UI | D7/D8 + explainer | OK |
| No trader inventory/storefront | Trader routes deals/wholesale only | OK |
| No self-registration | WhatsApp “request account” link only | OK |
| Three domains, no Order | Schema separate | OK |
| WhatsApp Baileys, no broadcast | Inbox text only | OK |
| No invented MOQ/discounts | QuoteCard shows admin values only | OK |

No boundary violation requiring plan rewrite.

---

## 9. Recommended Decision Lock additions (paste into `00-index.md` after approval)

| # | Decision | Value |
|---|----------|--------|
| D27 | Product image upload | Minimal local upload to `public/uploads` + ProductImage rows in P5d |
| D28 | Missing price | **Choose:** (a) required price at launch **or** (b) nullable + “Price on request” |
| D29 | Request address fields | Country (+ notes); no city field |
| D30 | Offer model UI | Single optional product; no validity date |
| D31 | Activity feed | Union of existing domain events |
| D32 | Outbound control | Read-only in UI (env); no in-app toggle in v1 |
| D33 | Catalog query | Extend list filters for category/price/sort |
| D34 | Specs | Free-text bilingual; soft parse for table |
| D35 | Request form | Keep destinationCountry / shipping as in Zod |
| D36 | Cost breakdown file | Deferred; plan remains SoT for UI |

---

## 10. P0 gate checklist

- [x] Route existence table  
- [x] Schema field mapping  
- [x] Status draft for owner  
- [x] Dashboard / WA / image / middleware notes  
- [x] Conflict list with minimal resolutions  
- [ ] **Owner approval of D27–D36 (especially D28, D32)**  
- [ ] Then: `START PHASE 1 — FOUNDATIONS`

---

## 11. Explicit stop

**P0 complete as documentation.** No application code was changed in this phase.  
Awaiting: conflict resolutions → then Phase 1 only.
