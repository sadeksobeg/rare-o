# SH0 — Shipping read-only audit

**Branch:** `shipping/s1` (local only)  
**Date:** 2026-11-12  
**Scope:** Read-only. No migrations applied. No production deploy.  
**Seed input:** Owner attachment `shipping-rates-seed.json` was **not present** in the workspace; reconstructed from master-plan decisions into `docs/shipping/shipping-rates-seed.json` (7 notebook flats, `verified=false`). Syrian Post archive: `docs/shipping/shipping-rates-archive-syrian-post.json` (empty — none in platform).

---

## Workstream status

| Workstream | Status | One line |
|---|---|---|
| SH0 Read-only audit | **DONE** | Audit + seed reconstruction + Syrian Post finding + gaps + Prisma sketch; screenshots under `docs/shipping/shots/` |
| SH1 Design prototypes | STOP — wait | Do not start until owner approves SH0 |
| SH2–SH10 | STOP | Not started |

---

## 1. Existing shipping fields / tables / options

### 1.1 No dedicated shipping tables

There are **no** Prisma models for `ShippingMethod`, `ShippingRate`, `Shipment`, or `ShipmentEvent`. Pricing lives in **code**: `lib/shipping/rates.ts` + `lib/shipping/resolve-available-methods.ts`.

### 1.2 Retail (`RetailRequest`)

| Field | Role |
|---|---|
| `destinationCountry` | Display name |
| `destinationCode` | Zone/governorate code into `rates.ts` (nullable for pre-calculator rows) |
| `shippingMethodCode` / `shippingMethodLabel` | Snapshot of selected option |
| `shippingCostAmount` / `shippingCostCurrency` | Calculator **estimate** (not a charge; no payment gateway) |
| `shippingWeightKg` | Billable weight used at submit |

Status lifecycle is request/handoff oriented (`draft` → … → `completed`), **not** a shipment lifecycle.

### 1.3 Wholesale (`WholesaleRequest`)

Same estimate fields as retail, plus fulfillment:

| Field | Role |
|---|---|
| `carrier` / `trackingReference` / `shippedAt` | Manual admin entry (`adminUpdateWholesaleShipping`) |
| Events note | `Shipping: {carrier} / {tracking}` |
| In-app notify | `notifyTrader` on shipping update |

### 1.4 Brokerage

| Model | Shipping-related |
|---|---|
| `BrokerageRequest` | `carrier`, `trackingRef`, `shippedAt`, `deliveredAt`; status includes `SHIPPED` → `DELIVERED` |
| `BrokerageQuote` | `shippingUsd` (integer USD, admin-entered on quote — **not** from rate engine) |

### 1.5 Deals (`DealProposal`)

**No shipping fields.** Payment/handoff only. Deal detail has no destination, method, tracking, or cost.

### 1.6 Product

`Product` has **no** `weightKg`, dimensions, or `shippingClass`. Weight for quotes is a **heuristic** from oud unit count (`calculateOudShipmentWeightKg`: pairs @ 25 kg, leftover @ 20 kg).

### 1.7 UI component (unused tracker)

`components/admin/shipping-tracker.tsx` — horizontal step UI (`ShippingTracker`). Present as OPS-04 primitive; not a full shipment domain.

---

## 2. Flows, statuses, visibility, notifications

### 2.1 Storefront (retail request)

1. Customer builds cart → `/request`.
2. `ShippingCostSelector` (client) imports static `rates.ts`, picks destination + method, writes hidden fields.
3. Server re-resolves methods on submit (wholesale path explicitly; retail mirrors estimate fields) — amounts are estimates confirmed later on WhatsApp.
4. Customer never sees a public tracking page today.

**Defect / product gap:** empty cart → no shipping UI at all (only empty state). Shipping is buried inside the request form after items exist — no product-page “احسب الشحن” estimator.

### 2.2 Wholesale (trader)

- Form embeds same `ShippingCostSelector`.
- Admin can set carrier + tracking; trader sees estimate + carrier/tracking on detail.
- No multi-status shipment timeline beyond request status + one shipping note.

### 2.3 Brokerage

- Admin enters `shippingUsd` on quote (manual).
- Status transitions enforce `PURCHASED → SHIPPED → DELIVERED` (`lib/brokerage/status.ts`).
- Carrier/tracking free text on the request.

### 2.4 Deals

No shipping flow.

### 2.5 Notifications

| Channel | Shipping today |
|---|---|
| In-app trader | Wholesale shipping update via `notifyTrader` |
| WhatsApp outbox | **Not** wired to shipment status events (handoff deep-links for payment/request only) |
| Customer in-app | None for shipping |
| Public tracking link | None |

Rate limits / kill switch: existing WhatsApp outbox infrastructure must be reused later (SH7); do not invent a second path.

---

## 3. UI screenshots (1440 + 390)

Evidence folder: `docs/shipping/shots/` (+ `NOTES.json`)  
Scripts: `scripts/sh0-shipping-shots.mjs`, `scripts/sh0-capture-remainder.mjs`, `scripts/sh0-trader-shots.mjs`

| Shot | What I SEE (honest) |
|---|---|
| `sh0-storefront-request-empty-1440-ar.png` | Empty cart RTL: “لا توجد قطع في طلبك” — **no shipping calculator** until items exist |
| `sh0-storefront-request-shipping-1440-ar.png` | DE selected: 20 kg oud heuristic; land **130 USD** / air **150 USD** cards + EUR alternate notes |
| `sh0-storefront-request-shipping-390-ar.png` | Same cards stacked on 390; sticky تقدير الشحن **130 USD** |
| `sh0-admin-request-detail-1440-ar.png` / `390` | Retail detail: shipping method **«غير محددة — يُؤكَّد مع الفريق»**; handoff timeline ≠ shipment lifecycle; no carrier/tracking |
| `sh0-admin-wholesale-list-1440-ar.png` / `390` | Wholesale list **empty** in this local DB — carrier/tracking UI exists on detail in code, not shown here |
| `sh0-admin-deal-list-1440-ar.png` / `390` | Deals list — **no shipping columns** (DealProposal has no shipping fields) |
| `sh0-admin-brokerage-detail-1440-ar.png` | Brokerage BR-SEED: timeline includes **قيد الشحن**; price line shows goods + % + **60 US$** shipping leg (manual quote, not rate engine) |
| `sh0-admin-brokerage-list-390-ar.png` | Brokerage list at 390 after a 500 on list reload (dev JSON parse) — fragile |
| `sh0-trader-wholesale-form-1440-ar.png` / `390` | Trader wholesale **first viewport = product picker**; ShippingCostSelector is below the fold / after qty — not visible in this shot |
| `sh0-trader-deal-detail-1440-ar.png` / `390` | Trader deal detail — **no** shipping destination/method/cost UI |

**Visible defects to flag**

1. Client-side pricing in `ShippingCostSelector` (tamperable; server must stay authoritative — wholesale re-quotes; retail must match in SH2).
2. Germany/Austria-style packages refuse weights **below 11 kg** (tiers start at `minKg: 11`) → accessories-only carts can show **no methods**.
3. Country list is **only** shippable zones + Syria governorates — not full ISO; unmapped destinations get empty methods (soft WhatsApp path), not a first-class “اطلب عرض سعر” inquiry object.
4. Flags: text labels only (no SVG flags).
5. `/ar/request` is **not** a real route (locale via cookie/header); storefront path is `/request`.
6. Admin wholesale empty locally → cannot screenshot carrier/tracking panel without seed data (code path exists: `adminUpdateWholesaleShipping`).
7. Dev console: brokerage list hit **500 / Unexpected end of JSON input** during capture (noted; not ok:true).
8. Trader Playwright form-login flaky (server action); shots used a local session cookie. Storefront empty cart gates all shipping UI.

---

## 4. Invoice PDF / documents

**Finding:** No commercial invoice, packing slip, or waybill PDF generators in `app/` or `lib/` for orders/deals/wholesale.  
WhatsApp media supports PDF mime for chat attachments only.  
**Gap P0 for SH6:** brand-style waybill + packing slip + commercial invoice + QR to public tracking.

---

## 5. Currency / exchange / product weight

| Topic | Today |
|---|---|
| Catalog currencies | `USD` and `SYP` only (`lib/catalog/currency.ts`) — **no live FX** |
| Shipping currencies | `USD` / `EUR` / `AED` on rate legs; primary prefers USD; UAE air is **AED-only** |
| SYP shipping legs | Explicitly **not** modeled (comment in `rates.ts`: no live SYP rate) |
| Exchange mechanism for display | **None** — do not hard-code FX in the new engine |
| Product weight / dims | **Absent** on `Product` |
| Billable weight | Oud-count box heuristic only |

---

## 5b. Existing per-kg (and domestic flat) options

### International (stored as code constants — zone packages)

| Zone id | Countries | Modes | Pricing | Notes |
|---|---|---|---|---|
| `germany` | DE, NL, BE, LU | land + air | **PER_KG tiered** (11–20 / 21+) USD+EUR | Below 11 kg → no quote |
| `austria` | AT, DK, FR | land + air | **PER_KG flat** USD+EUR | |
| `sweden` | SE, IT, ES, MT | land + air | PER_KG flat | |
| `britain` | GB, IS, PT, HR, EE, HU, LV, LT, RO, SI, RS, SK | land + air | PER_KG flat | |
| `norway` | CH, NO, CY, GR | land + air | PER_KG flat | |
| `america` | US, CA, CN, TH, PS, DZ, MA | land + air | PER_KG flat | |
| `uae` | AE | air only | PER_KG **AED 7.5** | No land; no USD leg |
| `oman` | OM | air | PER_KG USD 3 | |
| `iraq` | IQ | air | PER_KG USD 3 | |

Rounding today: `Math.round(perKg * weightKg * 100) / 100` (2 decimals). **No** minimum charge, **no** free-shipping threshold, **no** volumetric divisor, **no** packaging add-on beyond the oud-box heuristic.

Method codes emitted: `intl:{zoneId}:{land|air}`.

### Domestic Syria (flat per shipment USD)

| Carrier | Amount | Coverage |
|---|---|---|
| `bus` | $2 | damascus, tartus, latakia, aleppo, idlib, raqqa, hama, homs — office pickup |
| `babel` | $10 | damascus, tartus, latakia, aleppo, hama, homs, daraa — home |
| `al-mufti` | $5 | suwayda, daraa — home |

Codes: `domestic:{gov}:{carrierId}`. Sorted cheapest-first.

### Notebook overlap audit (same country + carrier)

| Notebook | Existing | Overlap? |
|---|---|---|
| LB — سيارة ركاب $20 flat | *none* | No existing LB option |
| JO — المصري / باص / سيارة خاصة | *none* | No existing JO option |
| SA — الراقي / سيارة ركاب | *none* | No existing SA option |
| AE — مندوب الشارقة $60 LAND flat | AE air package AED 7.5/kg | **Country overlap, different carrier/mode** — must ADD beside existing; show both; never overwrite. Flag in admin UI for owner (D2) |

**Syrian Post (البريد السوري):** **ZERO** options in `lib/shipping`, Prisma, or UI. Domestic uses bus / babel / al-mufti only. Nothing to deactivate in local data for Syrian Post. Production: delete nothing until owner-approved release list (empty for Syrian Post unless something appears outside this repo).

---

## 5c. Admin control coverage vs SH3

| SH3 capability | Today | Where | Admin-only / audited? |
|---|---|---|---|
| Countries add/disable/delete + ISO + AR names + flags | **Not at all** | Hardcoded in `rates.ts` | N/A |
| Per-country note / inquiry toggle | **Not at all** | Soft empty-methods → WhatsApp | N/A |
| Methods CRUD (mode/speed/security/consolidation/ETA/icon/classes) | **Not at all** | Code labels only | N/A |
| Rates FIXED / PER_KG / TIERED in DB | **Partial** | PER_KG (+ tier bands) + domestic FIXED in code only; no FIXED intl; no TIERED-by-price-bands UI | No UI |
| Min charge / max weight / free-shipping | **Not at all** | — | — |
| Volumetric divisor / packaging weight | **Not at all** | Heuristic only | — |
| Audience (customer/trader/both) | **Not at all** | Same selector both portals | — |
| Verified flag / bulk اعتماد | **Not at all** | — | — |
| Matrix countries × methods | **Not at all** | — | — |
| Bulk copy / % change / CSV import-export | **Not at all** | — | — |
| History / one-click revert | **Not at all** | — | — |
| Simulator “جرّب السعر” | **Not at all** | — | — |
| Soft delete / unused hard-delete rules | **Not at all** | — | — |
| Product weight + shipping class fields | **Not at all** | Product form has no weight | — |
| Wholesale carrier/tracking entry | **Partial** | `adminUpdateWholesaleShipping` + admin wholesale detail | Admin; event note; in-app notify (not full audit log of rate cards) |
| Brokerage shippingUsd | **Partial** | Quote form integer | Admin |
| Retail carrier/tracking | **Not at all** | Estimate fields only | — |

---

## 6. Gap list vs master plan

### P0

1. DB models + mixed-basis engine (PER_KG + PER_PARCEL + TIERED) with immutable snapshots.
2. Seed import of 7 notebook rates as `verified=false`; keep existing per-kg; AE coexistence UI.
3. First-class inquiry flow for countries with no active method (majority of ISO list).
4. Admin rate-card matrix + verified bulk اعتماد (owner hard requirement).
5. Product `weightKg` (+ optional dims/class) for non-heuristic pricing.
6. Server-authoritative `quote()`; ignore client totals.
7. `maxWeightKg` guard copy: “للأوزان الأكبر اطلب عرض سعر”.

### P1

1. Storefront estimator on product + checkout cards with badges (أرخص/أسرع/أمان).
2. Trader quote tool + شحناتي board + saved addresses.
3. Shipment lifecycle + events + public token tracking page.
4. Docs: waybill / packing / commercial invoice PDFs.
5. Notifications (in-app + existing WhatsApp outbox, opt-in).

### P2

1. Reports (charged vs actual, delays, returns).
2. SVG flag pack, regional templates, CSV polish.
3. SH8 compliance research report; SH9 gates.

### Exact Prisma changes needed (proposal only — **do not migrate in SH0**)

Additive models (names subject to SH1/SH2 approval):

- `ShippingMethod` — code, labels, mode, speed, security, consolidation, carrierLabel, trackingUrlTemplate, etaMin/Max, allowedClasses, active, sortOrder, …
- `ShippingRate` — countryCode, methodId, basis, amount, currency, tiers JSON, minCharge, maxWeightKg, verified*, validity, audience, history table or version rows
- `ShippingInquiry` — destination, items snapshot, contact, status (for “اطلب عرض سعر”)
- `Shipment` + `ShipmentEvent` — link `orderId`/`dealId`/`wholesaleRequestId`/`brokerageRequestId` (polymorphic or nullable FKs — **owner Q** below)
- `Product`: `weightKg Decimal?`, dims optional, `shippingClass String?`
- Config singleton or `ShippingConfig` for volumetric divisor, packaging weight, rounding rule (refuse quote if missing)

**Migrations to apply later:** LIST explicitly in SH2 and **STOP for written approval** before `prisma migrate` anywhere.

### Questions for the owner

1. **Polymorphic shipment parent:** attach `Shipment` to retail request, wholesale, brokerage, and/or deal — which are in scope for SH6 first?
2. **AE coexistence:** keep AED air per-kg **and** مندوب الشارقة $60 — confirm both customer-visible after verify?
3. **Germany min 11 kg:** keep as-is when importing existing options into DB, or lower floor?
4. **Domestic Syria:** keep bus/babel/al-mufti as-is until D5, or hide until notebook domestic rates arrive?
5. Open decisions remain: **D2, D4b, D5–D12** (see plan §7).

---

## Gate results (SH0)

| Gate | Result |
|---|---|
| Read-only (no migrate / no prod) | PASS |
| Secrets not printed | PASS |
| Syrian Post inventory | PASS — **0** in platform |
| Seed reconstructed + archive filed | PASS (reconstructed from plan text; **owner must confirm** vs notebook) |
| Screenshots 1440/390 | PASS — storefront + admin + trader under `docs/shipping/shots/` with honest SEE lines |
| Console / defects | PARTIAL — brokerage list 500 during capture; trader wholesale shows Next “1 Issue”; wholesale admin empty locally |

---

## Findings the owner must decide

| ID | Topic | Status |
|---|---|---|
| D2 | Verify 7 imported rates in manager | OPEN |
| D4b | Free-shipping threshold | OPEN (none) |
| D5 | Domestic Syria rates | OPEN (code flats exist) |
| D6 | Insurance | OPEN |
| D7 | Packaging + volumetric | OPEN |
| D8 | Who enters product weights | OPEN |
| D9 | Shipping classes per method | OPEN |
| D10 | WhatsApp opt-in wording | OPEN |
| D11 | maxWeightKg per flat method | OPEN |
| D12 | Other carriers for countries with no method | OPEN |
| — | Confirm reconstructed seed matches notebook | **OWNER CHECK** |
| — | AE dual methods OK | OWNER |
| — | Shipment parent entities for v1 | OWNER |

---

## Exact next step

**STOP.** Wait for owner written approval of this audit (and seed reconstruction).  
Then start **SH1 only**: static fake-data prototypes (dark+light, 1440+390) for estimator/checkout cards, tracking timeline, trader board, admin matrix — screenshots + honest lines — **no engine**.
