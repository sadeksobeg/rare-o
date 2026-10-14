# P0 — Reconciliation (read-only)

**Date:** 2026-10-12  
**Baseline:** git `master` @ `316beea` (`ui: hide out-of-scope promo features`)  
**Sources:** PLAN.md Parts 00–07 + Appendix S; `prisma/schema.prisma`; live routes under `app/`  
**Rule:** No application code in this phase. PLAN.md not edited.  
**Owner gate:** Review §7 conflicts → approve proposed **D27+** (via `DECISIONS-ADDENDUM.md`, not PLAN.md) → then next approved slice.

**Note on codebase maturity:** Much of P1–P7 already exists on `master` from prior UI work. This document re-reconciles the **locked plan** against **as-built now**, so remaining gaps and decision-lock items are explicit before further slices.

---

## 1. Routes & file paths (plan Parts 03–05 vs codebase)

### 1.1 Storefront

| Plan ID | Path | Exists? | File / note |
|---------|------|---------|-------------|
| SF-01 | `/` | YES | `app/(storefront)/page.tsx` — commerce-ordered stack (hero, shortcuts, spotlight, shop, categories, editorial, handoff, trader band). Differs from locked H1–H9 section names; treat as P4c drift to re-align or accept as implementation of same jobs |
| SF-02 | `/catalog` | YES | `app/(storefront)/catalog/page.tsx` — `type`/`category`, `q`, `min`/`max`, `sort` (D33-style) |
| SF-03 | `/product/[slug]` | YES | `app/(storefront)/product/[slug]/page.tsx` — gallery + `PriceBlock` |
| SF-04 | `/cart` | YES | `app/(storefront)/cart/page.tsx` — route kept (D7); UI naming = request list |
| SF-05 | `/request` | YES | `app/(storefront)/request/page.tsx` + `RequestForm` |
| SF-06 | `/offers` | YES | `app/(storefront)/offers/page.tsx` |
| SF-07 | `/offers/[slug]` | YES | `app/(storefront)/offers/[slug]/page.tsx` |
| SF-08 | `/contact` | YES | `app/(storefront)/contact/page.tsx` |
| SF-09 | `/privacy` | YES | `app/(storefront)/privacy/page.tsx` |
| SF-10 | system | PARTIAL | `app/not-found.tsx`, `app/(storefront)/{error,loading}.tsx` present; verify parity of all plan SF-10 copy/states in later gate |
| — | `/en/*` | YES | `middleware.ts` rewrite + `x-ro-locale` / `ro_locale` cookie |
| — | `/dev/ui` | YES | `app/dev/ui/page.tsx` (production `notFound` expected per plan) |
| — | `/forbidden` | YES | `app/forbidden/page.tsx` — cross-role 403 |

### 1.2 Admin

| Plan ID | Path | Exists? | Note |
|---------|------|---------|------|
| AD-01 | `/admin/login` | YES | Dictionary + locale toggle |
| AD-02 | `/admin` | YES | Four KPIs via `getAdminHomeData`; ActionQueue ≈ recent retail only (see §4) |
| AD-03 | `/admin/inbox`, `/[id]` | YES | Health banner + list/thread; confirm 3-pane vs stacked at breakpoints |
| AD-04 | `/admin/requests`, `/[id]` | YES | |
| AD-05 | `/admin/deals`, `/[id]` | YES | |
| AD-06 | `/admin/wholesale`, `/[id]` | YES | Shipping UI limited by schema (§2.4 / C13) |
| AD-07 | `/admin/products`, `/new`, `/[id]` | YES | `ImageUploader` + `lib/catalog/images.ts` write path |
| AD-08 | `/admin/categories` | YES | No category image field (Material Plate OK) |
| AD-09 | `/admin/offers`… | YES | Single optional `productId`; no validity dates |
| AD-10 | `/admin/customers` | YES | Regression fixtures filtered from UI (`lib/admin/ui-hidden.ts`) |
| AD-11 | `/admin/traders` | YES | No `lastSignIn` column in schema |
| — | `/admin/promos`… | YES (code) | **Hidden** when `RO_PROMO_FEATURES` off (default); not in Appendix S |

### 1.3 Trader

| Plan ID | Path | Exists? | Note |
|---------|------|---------|------|
| TR-01 | `/trader/login` | YES | |
| TR-02 | `/trader` | YES | TaskCards / waiting block — verify against TR-02 acceptance |
| TR-03 | `/trader/deals` | YES | |
| TR-04 | `/trader/deals/new` | YES | |
| TR-05 | `/trader/deals/[id]` | YES | |
| TR-06 | `/trader/wholesale` | YES | |
| TR-07 | `/trader/wholesale/requests` | YES | |
| TR-08 | `/trader/wholesale/[id]` | YES | Shipping block blocked by missing schema fields |
| TR-09 | `/trader/offers` | YES | |
| TR-10 | `/trader/profile` | YES | |
| T01 | Bottom tabs | YES | `TraderBottomTabs` in `components/trader/shell.tsx` |

---

## 2. Schema / field mapping (Parts 04–05 columns & forms)

### 2.1 Product & images

| UI item (plan) | Schema / code | Status |
|----------------|---------------|--------|
| Name AR/EN | `Product.nameAr` / `nameEn` | OK |
| Description AR/EN | `descriptionAr` / `descriptionEn` | OK |
| Specs / SpecTable / SpecEditor | `specsTextAr` / `specsTextEn` only | **GAP** — free text + soft parse (`lib/catalog/specs.ts`); no attribute schema |
| Price + “Price on request” | `retailPrice` **Decimal required**; `currency` **String required** | **CONFLICT C2** — D6 needs empty/missing display path; seed uses fixture `TEST` (UI maps to on-request) |
| compareAtPrice / sale badge | `compareAtPrice Decimal?` | Present; **UI gated** by `RO_PROMO_FEATURES` (default off) — out of Appendix S |
| Availability | `availability` available\|unavailable | OK |
| Status | draft\|published\|archived | OK |
| Wholesale eligible | `wholesaleEligible` | OK |
| Featured toggle | **No field** | **MISSING** — omit or report if form shows it |
| Images | `ProductImage.path`, `altAr`, `altEn`, `sortOrder`, `kind` | OK |
| Primary image | No `isPrimary` — use lowest `sortOrder` | OK convention |
| Upload | `lib/catalog/images.ts` → `public/uploads/{productId}/` | OK (max 8, 8 MB, long side ≥ 1600) |
| Category image | **No** `Category` image field | Material Plate (plan allows) |

### 2.2 Retail request (SF-05 / AD-04)

| UI item | Schema | Status |
|---------|--------|--------|
| Name / phone / notes | `customerName`, `customerPhone`, `customerNotes` | OK |
| City (plan SF-05 wording) | **No city** — `destinationCountry` | **CONFLICT C3** |
| Shipping method | `shippingMethodCode` / `shippingMethodLabel` optional | OK if form exposes them |
| Lines | `RetailRequestLine` | OK |
| Statuses | draft → cancelled (6) | OK → §3.1 |
| Handoff | `RetailHandoffEvent`, `whatsAppDeepLink`, `handoffMessageText` | OK |
| List “التحويل” column | Derive from handoff events / timestamps | OK (read helper) |

### 2.3 Deals & negotiation

| UI item | Schema | Status |
|---------|--------|--------|
| `dealKind`, title, productId, price, currency, qty, conditionsNotes | OK | |
| Statuses | proposed\|negotiating\|accepted\|closed | OK |
| NegotiationEntry.action | propose\|continue\|counter\|accept\|close | OK |
| nextActor | **Derived** via `lib/ui/status.ts` + `dealNextActor` | OK draft |

### 2.4 Wholesale

| UI item | Schema | Status |
|---------|--------|--------|
| requestMode, lines, quote fields, events | OK | |
| Statuses (6) | OK | |
| Quote / MOQ / discounts | Must not invent | Boundary OK — show stored admin quote only |
| Carrier / tracking / shipped date (AD-06, TR-08) | **No fields** on `WholesaleRequest` | **CONFLICT C13 — MISSING** |

### 2.5 Public curated offer

| UI item | Schema | Status |
|---------|--------|--------|
| slug, titles, summaries, status | OK | |
| Linked product | optional single `productId` | OK |
| Multi-product inclusion grid | **No M2M** | **CONFLICT C4** |
| Validity / end date | **No field** | **CONFLICT C4** |
| Dedicated offer image | **No** — product images or Material Plate | OK |

### 2.6 Customers & traders

| UI item | Schema | Status |
|---------|--------|--------|
| Customer notes | `Customer.notes` | OK |
| Request count / last request | Aggregate on `RetailRequest` | OK |
| Trader company / phone / status | `TraderAccount` | OK |
| Last sign-in | **No field** | **MISSING** — omit column |
| Temporary password show-once | Auth/create action (not a stored cleartext field) | Process OK if UI matches |

### 2.7 WhatsApp

| UI item | Source | Status |
|---------|--------|--------|
| Conversation fields | `WhatsAppConversation` | OK |
| unreadCount | column | OK |
| Message direction / type / status | inbound\|outbound; text\|unsupported; received\|pending\|sending\|sent\|failed | OK |
| Link types | none\|retail_request\|deal_proposal\|wholesale_request | OK |
| Connection health | `WhatsAppConnectionHealth` + `getInboxHealthView` | OK — **UI shows dictionary state only** (no `detailSafe`) |
| Extra adapter state `RECONNECTING` | In Baileys adapter | Map to progress / CONNECTING in banner |
| Outbound pause | `WHATSAPP_OUTBOUND_ENABLED` via `isOutboundEnabled()` | **CONFLICT C6** — read-only in UI |

### 2.8 Out-of-scope present in schema (not Appendix S)

| Item | Status |
|------|--------|
| `PromoBand` model + `/admin/promos` + storefront bands | Code+data kept; **hidden** behind `RO_PROMO_FEATURES` (default off) — prior owner decision |
| `Product.compareAtPrice` + discount badges | Same gate |

---

## 3. Draft `lib/ui/status.ts` (owner approval)

Tone vocabulary (Part 01 §3.3): `neutral | info | progress | attention | success | danger | closed`.  
File already exists at `lib/ui/status.ts` with the table below (proposed defaults). **Owner must still approve** tone / `nextActor` (especially negotiating + ready_for_handoff).

### 3.1 RetailRequest

| value | tone | labelKey | nextActor |
|-------|------|----------|-----------|
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
| `negotiating` | progress | `status.deal.negotiating` | **Invert last `NegotiationEntry.actorRole`** (`dealNextActor`); if none → `admin` |
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

### 3.4 WhatsApp message status

| value | tone | labelKey | nextActor |
|-------|------|----------|-----------|
| `received` | info | `status.wa.received` | `none` |
| `pending` | progress | `status.wa.pending` | `none` |
| `sending` | progress | `status.wa.sending` | `none` |
| `sent` | success | `status.wa.sent` | `none` |
| `failed` | danger | `status.wa.failed` | `admin` |

### 3.5 Connection health → banner

| state | Banner tone |
|-------|-------------|
| `CONNECTED` | success |
| `CONNECTING` / `RECONNECTING` | progress |
| `DISCONNECTED` / `ERROR` | danger |
| `AUTHENTICATION_REQUIRED` | attention |

**Action required:** Approve or edit `nextActor` for `negotiating` and `ready_for_handoff`.

---

## 4. Data availability (dashboard & feeds)

| Need (AD-02) | Source today | Status |
|--------------|--------------|--------|
| KPI: طلبات جديدة (`nextActor = admin`) | `getAdminHomeData` counts statuses `draft`, `handoff_opened`, `in_follow_up` | **PARTIAL** — not driven by `status.ts`; omits/includes may drift from approved nextActor (e.g. `draft` vs `ready_for_handoff`) |
| KPI: صفقات بانتظار الرد | counts `proposed`, `negotiating` | **PARTIAL** — negotiating should use `dealNextActor` + last entry |
| KPI: جملة بانتظار الرد | counts `submitted`, `under_review`, `confirmed` | **PARTIAL** — `confirmed` may or may not be admin-next after approval |
| KPI: محادثات غير مقروءة | `whatsAppConversation.unreadCount > 0` | OK |
| ActionQueue (max 8, merge 3 domains, oldest first) | `recentRequests` = retail only, newest first | **GAP C5b** |
| ActivityFeed last 10 | No Activity table | **GAP C5** — union `RetailHandoffEvent` + `NegotiationEntry` + `WholesaleRequestEvent` (+ optional inbound WA) |
| ConnectionCard | `getInboxHealthView` | OK |
| Outbound pause flag | `isOutboundEnabled()` / env | Read-only (**C6**) |
| Published product count | Secondary metric on dashboard today | Extra vs plan four KPIs — hide or keep as non-KPI meta (**report, do not invent**) |

---

## 5. Image model notes

| Topic | Finding |
|-------|---------|
| Model | `ProductImage`: `path`, `altAr`, `altEn`, `sortOrder`, `kind` (`image`\|`video`) |
| Primary | Lowest `sortOrder` |
| Storage | `public/uploads/{productId}/` |
| Limits | Max 8 images; 8 MB; longest side ≥ 1600 px (`lib/catalog/images.ts`) |
| Admin UI | `components/admin/image-uploader.tsx` on product edit |
| Storefront | Prefer `next/image` + Material Plate when empty (Part 01 §10) |
| Brand marks | PNG in `public/brand/`; SVG delivery still A1/A2 (D26) |

---

## 6. Middleware design (locale + 403; JWT untouched)

**As built** (`middleware.ts`):

1. **Storefront English:** `/en` and `/en/*` → strip prefix, `rewrite` to unprefixed path, set `x-ro-locale=en` + cookie `ro_locale`. Arabic storefront paths get `withLocale(ar)`. No `Accept-Language` auto-redirect (matches D11).
2. **Admin / trader guards:** JWT verify via existing cookies (`ro_admin_session` / `ro_trader_session`). Missing/invalid → login + `returnTo`. **Cross-role** → `/forbidden?portal=…` (not login). Crypto/secret checks unchanged.
3. **Matcher** covers storefront pages + portals; `/forbidden` short-circuits.

**Fit to plan P3:** Locale rewrite and 403 handling are already in place. Remaining work is acceptance verification (equivalent URLs on language switch, trader on admin sees 403 copy), not a new JWT design.

---

## 7. Conflict list & proposed minimal resolutions (→ D27+)

| ID | Conflict | Severity | Proposed resolution (needs owner) |
|----|----------|----------|-----------------------------------|
| **C2** | D6 “Price on request” vs required `retailPrice` + `currency` | Medium | **D28a:** Keep required price; on-request only when currency missing/fixture/`TEST`. **D28b:** Nullable `retailPrice` + optional currency (schema migration). Prefer **D28a** unless owner wants true empty prices. |
| **C3** | Plan “city” vs `destinationCountry` | Medium | **D29:** Label/UI = country; city only inside optional notes. No schema change. |
| **C4** | Offer validity + multi-product grid | Medium | **D30:** Omit validity UI; show 0–1 linked product; no invented lists. |
| **C5** | No ActivityFeed table | Low | **D31:** Read-only union of existing event tables; if heavy, retail handoff events only in v1. |
| **C5b** | ActionQueue not merged / not age-sorted | Medium | **D31b:** New read helper merging retail/deal/wholesale where `nextActor=admin`, oldest first, max 8. |
| **C6** | Outbound kill-switch env-only | Medium | **D32a (recommended):** ConnectionCard read-only outbound state. **D32b:** Persist in-app toggle — needs explicit backend/scope approval. Prefer **D32a**. |
| **C8** | SpecEditor “attributes” | Low | **D34:** Bilingual textarea for `specsText*`; SpecTable soft-parses `label: value` lines. |
| **C13** | Wholesale shipping (carrier, tracking, shipped date) absent from schema | High for AD-06 / TR-08 | **D37a:** Omit shipping UI until schema exists. **D37b:** Minimal schema fields + migration (scope change). Prefer **D37a** unless owner adds fields. |
| **C14** | Trader “last sign-in” column absent | Low | **D38:** Omit column; no invented timestamp. |
| **C15** | Product “featured” toggle absent | Low | **D39:** Omit; featured = first published / homepage helper only. |
| **C16** | Dashboard KPI status sets ≠ `status.ts` nextActor | Medium | **D40:** Drive KPI counts from approved §3 tables (and `dealNextActor`). |
| **C17** | Home stack vs locked H1–H9 naming | Low | **D41a:** Accept current ordered commerce home as fulfilling the same jobs. **D41b:** Re-slice to exact H1–H9 labels in a storefront pass. |
| **C18** | PromoBand / compareAt / discount badges | Process | **Already decided:** hide behind `RO_PROMO_FEATURES` (default off); code+data kept. Record as **D42** in addendum. |
| **C10** | Cost breakdown scope file | Resolved | `docs/scope/cost-breakdown-scope.md` exists (Appendix S extract). |

**Closed / mitigated since prior P0 draft:** ProductImage upload (was C1) — present; locale + 403 middleware — present; catalog price/sort filters — present; cost-breakdown file — present.

---

## 8. Business boundary check

| Rule | Plan vs code | Result |
|------|--------------|--------|
| No payment UI | D7/D8 + handoff explainer | OK |
| Traders own no products | Trader deals/wholesale against client stock | OK |
| No trader self-registration | Admin-provisioned `TraderAccount` | OK |
| Three domains, no generic Order | Separate models/routes | OK |
| WhatsApp via Baileys only | Adapter + worker paths | OK |
| WA text never changes business status | Linking/composer do not transition domain status | OK |
| No invented MOQ/discounts/shipping rates | Quote/shipping only from stored fields | OK — shipping fields themselves missing (C13) |
| Appendix S extras (Promos/compareAt) | Hidden by flag | OK pending D42 record |

No boundary violation requiring a plan rewrite.

---

## 9. Recommended Decision Lock additions (after approval → `DECISIONS-ADDENDUM.md`)

| # | Decision | Value |
|---|----------|--------|
| D28 | Missing / on-request price | **Choose D28a or D28b** (§7 C2) |
| D29 | Request geography | Country (+ notes); no city field |
| D30 | Offer model UI | Single optional product; no validity date |
| D31 | Activity feed | Union of existing domain events |
| D31b | ActionQueue | Merged nextActor=admin rows, oldest first, max 8 |
| D32 | Outbound control | Read-only in UI (env); no in-app toggle in v1 unless D32b approved |
| D34 | Specs | Free-text bilingual; soft parse for table |
| D37 | Wholesale shipping | Omit UI (**D37a**) or add schema (**D37b**) |
| D38 | Trader last sign-in | Omit |
| D39 | Product featured flag | Omit |
| D40 | Dashboard KPIs | Derive from approved status/`nextActor` table |
| D41 | Home section stack | Accept current (**a**) or re-align to H1–H9 (**b**) |
| D42 | Promo / compareAt / discount UI | Hidden behind `RO_PROMO_FEATURES` (default off); code+data kept |

---

## 10. P0 gate checklist

- [x] Route existence table (Parts 03–05)
- [x] Schema field mapping for columns / forms / KeyValueList sources
- [x] Draft status table (tone, labelKey, nextActor) for owner approval
- [x] Dashboard / unread / activity / WA connection / outbound-pause
- [x] Image model notes
- [x] Middleware locale + 403 design (as-built + fit)
- [x] Conflict list with minimal resolutions
- [ ] **Owner approval of remaining D28–D42 (especially D28, D32, D37, D40, D41)**
- [ ] Then: proceed only on the next user-approved step (Decision Lock addendum / next phase)

---

## 11. Explicit stop

**P0 complete as documentation.** `docs/ui-planning/plan/RECONCILIATION.md` produced; PLAN.md not edited; no application code in this phase.

**Awaiting:** conflict resolutions + status-table approval → then STOP until you confirm the next step.
