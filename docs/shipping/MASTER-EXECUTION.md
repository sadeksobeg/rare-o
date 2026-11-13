# SHIPPING — MASTER EXECUTION PLAN (build everything, then release to production)

Owner: Sadek (RARE OUD). This file REPLACES the step-by-step stops of CURSOR-SHIPPING-PLAN.md. SH0 audit is accepted.
You now execute the whole shipping track end-to-end with exactly TWO review stops and one release.

WRITTEN APPROVAL: build everything below. The additive migrations in section 5 are approved IN PRINCIPLE: you must still
post the exact migration SQL in the STOP-B report; production release happens only after the owner writes `DEPLOY NOW`.

```
PHASE 0  stabilization (known bugs)
PHASE 1  prototypes + engine + admin full control      -> STOP-A (owner reviews look + admin)
PHASE 2  storefront + trader + operations + tracking + docs + notifications + gates -> STOP-B (pre-deploy report)
         owner writes: DEPLOY NOW
PHASE 3  production release (web-only) + smoke + final report
```

---

## 0. Standing rules (unchanged) + additions
- Never print/commit secrets; never push `.env*`. No WhatsApp message to any real person from tests/smoke/scripts.
- Migrations additive only. Pre-release: `pg_dump`, rollback image tag, no destructive SQL, no data deleted in production.
- Evidence: every screenshot has one honest line "what I SEE"; never `ok:true` over a visible defect. Mandatory gates on every
  new/touched page: opacity/occlusion (`elementsFromPoint`), **no horizontal overflow** (`document.documentElement.scrollWidth <=
  innerWidth`) at 390/768/1280/1440, dark + light, zero console errors (the known benign WebGL/Three warnings aside), keyboard focus
  visible, contrast >= 4.5:1, `prefers-reduced-motion` respected, Arabic RTL first, Western digits everywhere (no mixed Arabic-Indic).
- Brand "Resonant Core" tokens; overlays through OverlayRoot. Flags = bundled local SVGs (MIT-licensed set, license file included).
- **WhatsApp must not be interrupted.** The session lives in the worker container. RELEASE IS WEB-ONLY (section 11).
- Shipment messages over WhatsApp: ban-risk rules in section 9 are mandatory.

## 1. Owner decisions CLOSED by this plan (do not re-ask)
| # | Decision |
|---|---|
| Money | USD. Notebook rates = FLAT per shipment (PER_PARCEL), same price for customers and traders, no markup. |
| Existing options | Keep ALL current code-based options live and behaving the same (zones per kg, AE air AED/kg, Oman, Iraq, domestic bus/babel/al-mufti). Import them into the DB as `verified=true`, `source=LEGACY`. Never overwrite. |
| Notebook seed | `shipping-rates-seed.json` (owner re-attaches it; it is AUTHORITATIVE; diff it against your reconstruction in `docs/shipping/` and report any difference). 7 rates, import as `verified=false`; hidden from customers/traders until the owner verifies in the admin manager. |
| AE | Both visible after verify: existing AED air per kg AND "مندوب الشارقة" $60. |
| Syrian Post | None exists in the platform; nothing to delete. Never add it. |
| Germany 11 kg floor | Keep legacy tiers as data. Below the floor do NOT show "no methods": show the inquiry card "اطلب عرض سعر". Admin may later set a minimum chargeable weight. |
| Domestic Syria | Keep as is (importable, editable in admin). |
| Flat-rate safety | `maxWeightKg` default **50 kg** pre-filled on the 7 notebook rates (owner-editable at verification). Above it -> "للأوزان الأكبر اطلب عرض سعر". |
| Free shipping | None by default; admin-configurable global and per country/method. |
| Insurance | OFF by default; admin toggle + percentage; invisible until enabled. |
| Packaging/volumetric | Volumetric divisor disabled by default (blank); packaging weight 0; existing oud-box weight heuristic stays the fallback weight source. |
| Product weight | Optional `weightKg`/dims/`shippingClass` per product. Weight resolution: product weight if set, else legacy heuristic. Admin product list shows a "بلا وزن" chip. |
| Shipping classes | Field exists, default `other`; restrictions enforced ONLY where the admin configures them per method. |
| ETAs | Not shown now (field exists, empty). |
| Shipment parents v1 | Retail request, Wholesale request, Brokerage request get full `Shipment` support. Deals: estimate snapshot only (no Shipment until it converts). Nullable FKs, no polymorphism hacks. |
| Other carriers | None yet: every country without an active method uses the first-class inquiry flow. |
| WhatsApp opt-in text | You draft the Arabic wording; shown in STOP-A prototypes; opt-in checkbox default OFF. |
| Documents | v1 = print-optimized HTML pages (A5/A6/A4, brand style, QR as SVG) -> browser "Save as PDF". No server-side PDF engine in v1 (Arabic shaping risk, no Chromium in prod). |

## 1b. THE 7 NOTEBOOK RATES — authoritative values, embedded here so nothing depends on an attachment
All USD, `basis = PER_PARCEL` (flat per shipment), audience BOTH (same price for customers and traders), `maxWeightKg = 50` pre-filled,
`verified = false`, `source = NOTEBOOK`, no ETA. Owner corrections (2026-11-12) already applied; ALL Syrian Post options removed.

| Country | Code | Method code | Arabic label | Mode | Speed / security | Consolidation | Price (USD) |
|---|---|---|---|---|---|---|---:|
| لبنان | LB | `LAND_PASSENGER_CAR` | شحن بري مع سيارة ركاب | LAND | — | no | 20 |
| الأردن | JO | `LAND_SLOW_MASRI` | شحن بري بطيء مع شركة المصري | LAND | SLOW | no | 30 |
| الأردن | JO | `LAND_FAST_PASSENGER_BUS` | شحن بري سريع مع باص ركاب | LAND | FAST | no | 70 |
| الأردن | JO | `LAND_FAST_SECURE_PRIVATE_CAR` | شحن بري سريع عالي الأمان مع سيارة خاصة | LAND | FAST / HIGH | no | 100 |
| السعودية | SA | `LAND_SLOW_CONSOLIDATED_RAQI` | شحن بري بطيء وتجميع شركة الراقي | LAND | SLOW | **yes** (shipment waits to be consolidated) | 50 |
| السعودية | SA | `LAND_PASSENGER_CAR` (speed FAST) | شحن بري سريع مع سيارة ركاب | LAND | FAST | no | 100 |
| الإمارات | AE | `SHARJAH_REP` | شحن مع مندوب الشارقة | LAND | — | no | 60 |

Rules: if `shipping-rates-seed.json` (owner attachment) differs from this table in any value, STOP and report the difference; do not guess.
Countries with no method (everything else, incl. Europe/Turkey/Iraq/Gulf/North Africa unless a legacy option exists) use the inquiry flow.
Existing legacy options for AE (air, AED 7.5/kg), Iraq/Oman (air, USD 3/kg), Europe/US zones (per kg) etc. stay live next to these.

## 2. Inputs
`CURSOR-SHIPPING-PLAN.md` (specs), `shipping-rates-seed.json`, `shipping-rates-archive-syrian-post.json` (not imported),
`docs/shipping/SHIPPING-AUDIT.md`.

## 3. PHASE 0 — Stabilization (do first, fix + test)
1. **Brokerage list 500 / "Unexpected end of JSON input"** (seen in the Next error overlay): find the ROOT CAUSE, reproduce in a
   production build (`next build && next start`), fix, add a regression check. State whether production is affected.
2. **"1 Issue" badges on trader pages** (wholesale form, deal proposal): list exact text of each issue; fix or classify as dev-only.
3. **Storefront `/request` at 1440 shows a horizontal scrollbar** (page wider than viewport): fix; add the overflow gate.
4. **Weight field styling:** "20 كغ" renders in a different, larger font and "١ × عود = ٢٠ كغ" uses Arabic-Indic digits while
   everything else is Western; unify typography and digits.
5. **Admin request detail shows raw country code "SY"**: show localized country name + flag everywhere a country appears.
6. **Germany/Austria floor (<11 kg) returns no methods**: becomes the inquiry card (see decisions).
7. Retail pricing is computed client-side and is tamperable: server must recompute at submit (section 6).
Report these as a table (bug, root cause, fix, test).

## 4. Existing system to migrate (from the audit)
Code-based pricing in `lib/shipping/rates.ts` + `resolve-available-methods.ts`: zones `germany` (DE, NL, BE, LU; tiered per kg
11-20 / 21+), `austria`, `sweden`, `britain`, `norway`, `america`, `uae` (air AED 7.5/kg), `oman`, `iraq`, domestic flats. Method
codes `intl:{zone}:{land|air}`, `domestic:{gov}:{carrier}`. Existing order fields keep working: `destinationCountry/Code`,
`shippingMethodCode/Label`, `shippingCostAmount/Currency`, `shippingWeightKg`; wholesale `carrier/trackingReference/shippedAt`;
brokerage `carrier/trackingRef/shippedAt/deliveredAt/shippingUsd`. Old methods codes must remain resolvable for historical rows.

## 5. Data model — additive migrations (post exact SQL at STOP-B)
- `ShippingCountry`: code (ISO), nameAr, nameEn, region, active, note (customer-facing), inquiryEnabled, sortOrder.
- `ShippingMethod`: code, labelAr, labelEn?, mode (AIR|LAND|SEA|OTHER), speed, security, consolidation, consolidationNote,
  carrierLabel, trackingUrlTemplate?, etaMinDays?, etaMaxDays?, icon?, description?, allowedClasses[], active, sortOrder, source (LEGACY|NOTEBOOK|ADMIN).
- `ShippingRate`: countryCode, methodId, basis (PER_PARCEL | PER_KG | TIERED_PER_KG | TIERED_PER_PARCEL), amount, currency,
  altAmounts json? (preserves legacy "عند التسديد هناك EUR/AED" notes), tiers json?, firstKgAmount?/additionalKgAmount?, minCharge?,
  maxWeightKg?, minChargeableWeightKg?, handlingFee?, freeShippingOver?, audience (CUSTOMER|TRADER|BOTH), validFrom?/validTo?,
  active, verified, verifiedAt?, verifiedBy?, source, packageLabel?, note?.
- `ShippingRateHistory`: rateId, action, before json, after json, actor, at (enables one-click revert).
- `ShippingConfig` singleton: defaultCurrency, rounding rule, volumetricDivisor?, packagingKg, globalFreeShippingOver?, insurance
  {enabled, percent}, whatsappOptInText, inquiryNote.
- `ShippingInquiry`: destination, items snapshot, contact (name/phone), status (NEW|CONTACTED|QUOTED|CLOSED), assignee?, notes, createdAt.
- `Shipment`: nullable FKs retailRequestId / wholesaleRequestId / brokerageRequestId / dealId(reserved), status, methodCode + label snapshot,
  quoteSnapshot json, destination fields, recipient name/phone, trackingNumber?, carrierLabel, parcels json (count/weight/dims),
  declaredValue?, priceCharged, currency, actualCost?, publicToken (unique, >=128-bit), createdBy, shippedAt?, deliveredAt?.
- `ShipmentEvent`: shipmentId, status, note?, photoUrl?, actor, at, notified bool.
- `Product`: weightKg Decimal?, lengthCm/widthCm/heightCm?, shippingClass String? (default other).
- Request tables (Retail/Wholesale/Brokerage): `shippingQuoteSnapshot` json? (immutable price breakdown + rateId).
Backfill (dry-run first, counts only): create `Shipment` rows for existing wholesale/brokerage records that already have carrier/tracking.
Prove old code ignores the new tables/columns (rollback safety) and old worker code runs against the new schema.

## 6. Pricing engine (server-authoritative)
`quote({ destination, items[{productId, qty}] | weightKg, declaredValue?, audience })` -> per active method: `{ methodCode, label, mode,
speed, security, consolidation, note, price:{ base, weightCharge, handling, insurance, discount, total, currency, alt? }, rateId,
warnings[], reason? }`, plus inquiry card when applicable. Rules:
1. MIXED bases per country (flat + per kg + tiered) side by side; identical results for customers and traders.
2. Weight: sum of resolved weights; per-parcel packaging weight and volumetric only if configured; flat-only destinations work with unknown weights.
3. `maxWeightKg` guard and legacy floors -> inquiry card, never a silent empty list or a misleading price.
4. Rounding per config (default: legacy 2-decimals); `minCharge`; free-shipping thresholds; handling; insurance (if enabled).
5. Unverified, inactive, out-of-validity or wrong-audience rates are never returned to customers/traders (admin simulator may preview them, labeled).
6. Server re-quotes on every submit (retail, wholesale, brokerage quote lines, deal estimates); client totals are ignored; snapshot stored immutably.
7. Restricted product class for a method -> hidden or flagged with the admin-written reason.
8. **LEGACY PARITY TEST (blocking gate):** for every legacy zone x {land, air} x weights {1, 5, 10, 11, 15, 20, 21, 40, 100} and every domestic
   governorate x carrier, the new engine must equal the old one to 0.01 (except the intentional floor -> inquiry change, listed explicitly).
9. Golden tests for the 7 notebook rates (LB, JO x3, SA x2, AE), each basis, tampered prices, snapshot immutability, no-method country -> inquiry.

## 7. Admin FULL CONTROL (hard requirement; see SH3 in CURSOR-SHIPPING-PLAN.md)
Routes under admin shipping: **Countries** (full ISO list, AR names, flags, active, note, inquiry toggle, region), **Methods** (CRUD),
**Rates matrix** (countries x methods, inline edit, filters region/method/mode/verified/active, search, mobile layout), rate editor with
basis FIXED / PER_KG / first-kg+additional / TIERED, min charge, max weight, free-shipping, handling, insurance, audience, validity, verified,
**bulk tools** (copy method to many countries, duplicate package, bulk % or fixed change, **CSV import with dry-run diff** + export, regional
templates, "edit package" for legacy zone groups), **history + one-click revert**, **simulator "جرّب السعر"**, bulk **اعتماد** with a confirmation
step, unverified/`needsConfirm` badges, soft delete by default (hard delete only if never used by an order, with confirmation), warnings for
missing/zero/duplicate/overlapping rates, **Inquiries** inbox, **Config** screen, product form weight/class fields. Admin-only server actions,
every change audited, rate-limited, CSRF-safe. A short "ما الجديد" banner lists the 7 rates waiting for verification.

## 8. Customer / trader / operations UX
**Storefront:** (a) product page "احسب الشحن" estimator with country autocomplete (local flags, remembered choice), cheapest/fastest summary
and a drawer with all methods; (b) standalone **`/shipping` calculator page** (no cart needed; linked from nav/footer); (c) request/checkout
step with comparison cards (carrier, air/land, speed, security, consolidation tooltip, price, ETA only if set), data-driven badges
(الأرخص / الأسرع / الأعلى أماناً), "الطريقة الوحيدة المتاحة" when single, free-shipping progress if enabled, optional declared value/insurance if
enabled, sticky summary (bottom sheet on mobile), inquiry card for unsupported countries, WhatsApp opt-in checkbox (default off).
**Trader:** shipping quote tool (standalone + inside wholesale/brokerage/deal forms), delivered-total, share as text/print; "شحناتي" board
(filters, status chips, timeline, docs), saved addresses; sees only own data.
**Operations (admin):** create shipment from request, tracking number + carrier link, status transitions with note + photo, exceptions queue
(no update > N days / FAILED / RETURNED), bulk status update, shipment detail with timeline.
**Tracking page** `/track/[token]`: noindex, rate-limited, minimal PII (first name + country), route timeline (Salamiyah -> destination, icon by mode),
proof photo, WhatsApp contact button, calm motion. **Lifecycle:** CONFIRMED -> PACKED -> HANDED_OVER -> IN_TRANSIT -> ARRIVED -> DELIVERED
(+ FAILED, RETURNED, CANCELLED), transitions enforced server-side.
**Documents (print pages):** waybill (A6/A5), packing slip, commercial invoice (A4) in the brand style with QR to the tracking page; bulk print.

## 9. Notifications, security and ban-risk
- In-app notifications for admin/trader/customer where accounts exist.
- WhatsApp shipment updates ONLY through the EXISTING outbox (kill switch + rate limits respected; platform fallback for traders) and ONLY to
  contacts who (a) ticked the opt-in at checkout AND (b) already have an inbound WhatsApp conversation with us. Max one message per milestone
  (shipped with tracking link, delivered, delayed), global daily cap configurable, never bulk, never in tests (fake data + a stub outbox).
- Public endpoints (quote, inquiry, tracking) rate-limited, validated, no enumeration (uniform responses), tokens never logged.
- **`shipping-security-checks`:** trader A cannot reach trader B shipments/quotes/addresses by forged ids; tracking token guessing fails; rate edits,
  imports, deletes, verification are admin-only and audited; CSV import cannot inject formulas/HTML; admin XSS-safe notes.

## 10. PHASE 1 (then STOP-A)
1. Phase 0 fixes. 2. Branch `shipping/s1` rebased/merged on current main. 3. Schema + migrations locally (post SQL later). 4. Engine + legacy parity +
golden tests. 5. Import legacy options (verified) + notebook rates (unverified) via an idempotent importer. 6. Admin full control (section 7).
7. **Static prototypes** (fake data, dark+light, 1440+390): storefront estimator + `/shipping` page + checkout cards, tracking page, trader quote tool +
shipments board, admin matrix + simulator + shipment queue. 8. Admin screenshots of the real implemented screens.
STOP-A REPORT: workstream table (DONE/PARTIAL/BLOCKED), Phase 0 table, gate results (parity, golden, admin actions), screenshots with honest lines,
decisions needed. Then STOP. (Owner replies with design notes or `PROCEED`.)

## 11. PHASE 2 then STOP-B, PHASE 3 release
**Phase 2:** implement all customer/trader/operations UX, tracking page, documents, notifications, inquiry flow, backfill dry-run; compliance notes
(`docs/shipping/COMPLIANCE-NOTES.md`: CITES for Aquilaria/Gyrinops wood/chips/oil and retail-packaged exemptions, customs/HS, postal limits on
liquids/flammables, carrier path availability; cite sources, label anything unverified, no legal claims); runbook `docs/ops/SHIPPING-RUNBOOK.md`
(how to add a country/method/rate, verify, import CSV, revert, handle inquiries, create shipments, print documents, tracking, rollback).
Regression: ALL existing gates (wa-v seed/overlay, chat-f1/f2, security, kill-switch, alert checks) + `shipping-engine-checks`, `shipping-security-checks`,
admin-actions tests, tracking tests, UI/overflow/a11y gates, typecheck, lint, production build.
**STOP-B PRE-DEPLOY REPORT must contain:** gates table, exact migration SQL list, seed/import dry-run counts (legacy N rates, notebook 7), backfill dry-run
counts, production READ-ONLY checks (shipping-related counts, no PII), worker-compatibility analysis (below), screenshots with honest lines, rollback plan,
open decisions. Then STOP and wait for the owner's `DEPLOY NOW`.
**Worker-compatibility analysis:** list every changed file reachable from the worker entry (imports). The release is **web-only**
(`docker compose ... up -d --no-deps web`, worker untouched so the WhatsApp session is NOT dropped). If any worker-reachable file changed in a
non-backward-compatible way, STOP-B must say so and ask the owner whether to restart the worker (a restart disconnects WhatsApp until manually reconnected).
Remember a future worker restart will pick up the new image: prove the old worker code AND the new code both run against the new schema.

**Phase 3 (only after `DEPLOY NOW`):** `pg_dump` -> rollback tag `rare-oud-web:pre-shipping-<timestamp>` -> one build -> apply additive migrations -> run importer
(idempotent: legacy verified, notebook unverified) -> web-only up -> `CONNECT_ON_START` unchanged -> nginx unchanged -> NO WhatsApp sends.
Smoke: `/api/health` 200 (+ WhatsApp state unchanged, worker container ID and uptime unchanged); Permissions-Policy once with `microphone=(self)`;
quotes for LB, JO, SA, AE (notebook unverified rows must NOT appear to the public), DE legacy value equal to before, a no-method country -> inquiry;
`/shipping` page; checkout step; admin matrix loads with the 7 "needs verification" rows; trader isolation check; tracking page opens with a test token
(fake shipment, removed after); no new errors in web logs for 5 minutes; production screenshots 1440 + 390 with honest lines. Failure -> roll back to the tagged
image (additive schema stays) and report. FINAL REPORT: `docs/shipping/SHIPPING-CLOSURE-REPORT.md` with everything shipped, rollback tag, SHA, immutable tag
`shipping-deployed-<sha>`, owner follow-ups (verify the 7 rates, set max weights, enter product weights, test list). Merge to main and tag; never move tags.

## 12. Out of scope
Carrier APIs, automatic tracking sync, server-side PDF engine, payments/COD gateway, ETAs data, Syrian Post, anything WhatsApp-core, unique `traderId` index.

## 13. Definition of done
All gates green; zero horizontal overflow and zero console errors on new/touched pages; legacy parity proven; owner can add/disable/delete countries and
methods and set FIXED / PER_KG / TIERED prices from the admin without a developer; no unverified rate is ever public; production runs the tagged commit;
WhatsApp session never dropped by the release.

---

**Persisted:** 2026-11-13 from owner paste into chat (session after trader R9.1 merge). Authoritative notebook JSON lives in `shipping-rates-seed.json`.
