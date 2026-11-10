# Section 02 — Core Storefront evidence (client report)

**Mode:** evidence extraction only. No application code changed for this document.  
**Verified:** 2026-10-15 against local app `http://127.0.0.1:3000` + Prisma SQLite seed DB.  
**Contract:** Cost Breakdown §02 items 2.1–2.6 (Arabic wording below).

---

## Inventory snapshot (this session)

Command: `node docs/client-report/_tmp-count.mjs` (Prisma).

| Metric | Value |
|--------|------:|
| Published products | **10** |
| Launch categories | **2** (`string-instruments`, `accessories`) |
| Products with `kind: "video"` media | **0** |
| Products with atelier cutout images (`hero-oud-*`) | **3** (demo-string-instrument, oud-classic-21, oud-concert-premium) |
| Products with shared editorial photos only (`/brand/editorial/…`) | **7** |
| Products with zero images (Material Plate only) | **0** in current seed |
| Products with specs text (AR or EN) | **10** |
| Currency on published seed rows | **USD** (10); **TEST** currency on published storefront rows: **0** |
| Unavailable products | **1** (`cello-studio`) |

HTTP this session (`node docs/client-report/_tmp-http.mjs`): `/`, `/en/catalog`, `/catalog`, filtered catalog, search, PDP classic, PDP cello, `/en/cart`, `/en/request`, `/en/privacy` → all **200**. PDP HTML for `oud-classic-21` contains `Soundboard`, Specifications heading, `hero-oud-atelier-f`, and **no** `<video` tag.

Filter counts (Prisma, same predicates as `lib/catalog/service.ts` `publishedWhere`):

| Query | Count |
|-------|------:|
| all published | 10 |
| type=string-instruments | 6 |
| type=accessories | 4 |
| min=2000 | 6 |
| max=500 | 4 |
| min=2000&max=4000 | 4 |
| q=oud | 3 |
| q=tuner | 1 |
| q=zzzz-no-match | 0 |
| type=accessories&min=100&max=200 | 1 |

Screenshots: see `docs/client-report/screens/` + `SCREENS-SOURCE.md` (live Chrome headless capture of localhost failed; copies from prior FINAL-QA / slice-g).

Lighthouse: **not measured** (no lighthouse dependency; not run).

---

## 2.1 Product Catalog Engine  
**Contract:** عرض المنتجات (الأعواد والآلات) مصنّفة بفئات  

### Status: **DONE**  
Published catalog lists instruments and accessories by launch category.

### What a visitor can do
- Browse all published pieces on the catalog page.  
- Filter by category chips (string instruments / accessories / all).  
- Open any card into a product detail page.  
- Load more when the list is longer than the page size.  
- See empty / no-results messaging when filters exclude everything.

### Where to see it
- AR: `/catalog`  
- EN: `/en/catalog`  
- Demo: open Catalog → choose category chip → open a product.

### Evidence
- Route: `app/(storefront)/catalog/page.tsx`  
- Data: `lib/catalog/service.ts` (`listPublishedProducts`, `listLaunchCategories`)  
- UI: `components/storefront/catalog/product-grid.tsx`, `product-card.tsx`, `load-more.tsx`  
- Loading UI: `app/(storefront)/catalog/loading.tsx`  
- HTTP 200: `/en/catalog`, `/catalog` (this session).

### States covered
| State | Evidence |
|-------|----------|
| Loading | `catalog/loading.tsx` skeleton filter + 8 cards |
| Empty collection | `dict.catalog.empty` / `emptyHint` when total=0 |
| No results | `dict.catalog.noResults` when filters match 0 (verified count `q=zzzz-no-match` → 0) |
| Success | 10 published products rendered |
| Unavailable product | Shown in grid with availability chip (`cello-studio`) |
| Null / TEST price | `formatCurrency` / `PriceBlock` hide `TEST` and show `priceOnRequest` (`lib/i18n/format.ts`, `price-block.tsx`) — seed now uses USD so prices display |

### AR/EN + responsive
- Locale routing: `/catalog` (ar) and `/en/catalog` (en).  
- Screens: `screens/2.1-catalog-{390\|768\|1440}-{ar\|en}.png` (from FINAL-QA).

### Gaps
- Photos for 7/10 SKUs are shared editorial stand-ins, not unique product photography.  
- No “source / trader” classification (out of launch filter design).

### Difference from contract wording
None material — categories are type categories (آلات / إكسسوارات), not seller sources.

---

## 2.2 Product Detail Pages  
**Contract:** صفحة تفاصيل كل منتج بصور وفيديو ومواصفات  

### Status: **DONE WITH NOTES**  
Images + specifications work on live PDPs. **Video is supported in code but not present in seed data**, so a visitor cannot play a product video today.

### What a visitor can do
- Open a PDP with gallery (swipe/thumbs/lightbox for images).  
- Read bilingual specs table (`label: value` lines).  
- See price / availability / add-to-request CTA when available.  
- See related pieces.  
- On unavailable SKUs, see unavailable treatment without add.

### Where to see it
- `/product/oud-classic-21` or `/en/product/oud-classic-21`  
- Unavailable: `/en/product/cello-studio`  
- Click path: Catalog → product card → gallery thumbs → specs block → Add to request list.

### Evidence
- Route: `app/(storefront)/product/[slug]/page.tsx`  
- Gallery: `components/storefront/product-gallery.tsx` (renders `<video>` when `kind === "video"`; lightbox/thumbs updated for video).  
- Specs: `lib/catalog/specs.ts`, `components/storefront/catalog/spec-table.tsx`  
- Empty media fallback: `MaterialPlate` when `images.length === 0` (`product-gallery.tsx`, `product-media.tsx`)  
- HTTP this session: PDP classic **200**, HTML has Soundboard + specs + atelier image path; **`hasVideoTag: false`**.  
- DB: `withVideo: 0`.

### States covered
| State | Evidence |
|-------|----------|
| 0 images | Code path → MaterialPlate (no seed SKU currently has 0 images) |
| 1 image | e.g. `cello-studio`, accessories with single editorial |
| 2 images | e.g. `oud-classic-21` |
| 3 / 8 images | **Not present in seed** — gallery code loops `images.map`; not demoed live with 3 or 8 |
| Video play | **Not demoable** — no video rows; admin upload allows jpeg/png/webp only (`components/admin/image-uploader.tsx` ALLOWED set — verified by prior audit; not re-opened this session for mutation) |
| Unavailable | `cello-studio` |
| Specs empty | Would hide SpecTable (`SpecTable` returns null if no rows/prose) — seed now fills all 10 |

### AR/EN + responsive
- Screens: `2.2-product-{390\|768\|1440}-ar.png` (slice-g). EN PDP screenshots not copied this session.

### Gaps
- No playable product video in demo data.  
- Non-oud SKUs reuse editorial photos that do not match the product type visually.

### Difference from contract wording
Contract lists **صور وفيديو ومواصفات**. Images + specs: yes. Video: schema/UI ready, **content missing** → reported as DONE WITH NOTES.

---

## 2.3 Search & Filters  
**Contract:** بحث وفلترة المنتجات (النوع، السعر...)  

### Status: **DONE**  
URL-driven type, price min/max, text search, and sort.

### What a visitor can do
- Filter by category type.  
- Filter by min/max price.  
- Search by name/description text.  
- Sort newest / price asc / price desc.  
- Clear filters; see no-results when nothing matches.

### Where to see it
- `/en/catalog?type=string-instruments&min=2000&max=4000&sort=price-asc`  
- `/en/catalog?q=oud`  
- `/catalog?q=zzzz-no-match` (expect empty results UI)  
- Mobile: filter sheet button on catalog (FilterBar Sheet).

### Evidence
- UI: `components/storefront/catalog/filter-bar.tsx` — comment and implementation: state in URL via `router.replace`.  
- Server parse: `app/(storefront)/catalog/page.tsx` (`type`, `q`, `min`, `max`, `sort`).  
- Counts: table above (Prisma).  
- HTTP 200 for filtered + search URLs this session.  
- Screen: `2.3-filters-390-ar.png` (filter sheet, prior QA).

### States covered
| State | Evidence |
|-------|----------|
| No results | count 0 for `q=zzzz-no-match` |
| Success filtered | counts above |
| Loading | catalog loading skeleton includes filter bar |

### AR/EN + responsive
- Filter controls use `h-11` (44px) in `filter-bar.tsx`.  
- Desktop sticky bar / mobile Sheet documented in FINAL-QA G01.

### Gaps
- Price filter is currency-agnostic (numeric `retailPrice` only).  
- Home search overlay (if used) is separate from full catalog query — secondary path.

### Difference from contract wording
“النوع، السعر...” — implemented as category type + price (+ search + sort). **No trader/source filter** (intentional launch scope).

---

## 2.4 Shopping Cart  
**Contract:** سلة تسوّق كاملة الوظائف  

### Status: **DONE WITH NOTES**  
Full guest cart behaviours exist, but the UI is labelled **Request list / قائمة الطلب**, not a payment cart.

### What a visitor can do
- Add from PDP or catalog quick-add.  
- Change quantity, remove lines, see empty state.  
- Persist list in `localStorage` key `ro_cart_v1` (`cart-provider.tsx`).  
- Continue to `/request`.  
- Server rejects unavailable products at request create (`PRODUCT_UNAVAILABLE` in `lib/retail-request/service.ts`).

### Where to see it
- `/cart` or `/en/cart`  
- Path: PDP → Add to request list → header Request list → cart → Continue.

### Evidence
- Pages: `app/(storefront)/cart/page.tsx`, `components/storefront/cart-view.tsx`, `cart-provider.tsx`  
- Add: `add-to-cart-button.tsx`, `quick-add-button.tsx`  
- Labels: `dict.nav.cart` = `"قائمة الطلب"` / `"Request list"` (`lib/i18n/dictionaries.ts`)  
- HTTP 200 `/en/cart` this session.  
- Qty controls: `qty-stepper.tsx` uses `size-11` / `h-11`.  
- **Screens for cart:** missing in `screens/` this session (slice-g cart files not found).

### States covered
| State | Evidence |
|-------|----------|
| Loading/hydrate | `hydrated` gate in `cart-view.tsx` |
| Empty | EmptyState + dict empty copy |
| Success with lines | code path + prior browser session in delivery work |
| Unavailable at checkout create | service throws `PRODUCT_UNAVAILABLE` |
| Mixed currency | summary total suppressed (`cart-view.tsx`) |

### AR/EN + responsive
- Bilingual strings present. Sticky summary at `lg` in cart-view.  
- Live cart screenshots not filed under `screens/` this session.

### Gaps
- Client-side price snapshots can go stale vs admin edits.  
- No server-side cart.  
- Persistence after reload: implemented; **not re-proven with a screenshot in this evidence pack**.

### Difference from contract wording
Contract says “سلة تسوّق”. Product language is **قائمة الطلب / Request list** ending in WhatsApp request — not a paid shopping cart.

---

## 2.5 Checkout Flow  
**Contract:** مسار إتمام الشراء خطوة بخطوة  

### Status: **PARTIAL**  
There is a **request finalization → WhatsApp handoff** flow, not a multi-step paid checkout.

### What a visitor can do
- From cart, open `/request`.  
- Enter contact details and submit.  
- See success with reference, message preview, Open WhatsApp.  
- Admin can see the retail request (status `ready_for_handoff`).

### Where to see it
- `/request` / `/en/request`  
- Path: Cart → Continue → fill form → Submit → Open WhatsApp.

### Evidence
- UI: `app/(storefront)/request/page.tsx`, `request-form.tsx`, `handoff-success.tsx`, `handoff-explainer.tsx`  
- Server: `createRetailRequestAction` in `app/actions.ts` → `createRetailRequestFromCart` in `lib/retail-request/service.ts`  
- Env: `WHATSAPP_BUSINESS_E164` present (probe logged `whatsappConfigured: true`, digits length 12).  
- **This session E2E (service, not browser UI):**  
  - Created request `RO-2026-9361` (status `ready_for_handoff`, message + deep link, 1 line, 1 handoff event).  
  - Second identical create produced **new** id `RO-2026-3917` → a full browser reload that re-POSTs the form **would duplicate**; the SPA success view does not auto-resubmit.  
  - Both probe rows **deleted** afterwards (`left: 0`).  
- HTTP 200 `/en/request`.  
- Screens: `2.5-request-form-*-ar.png`. **`2.5-request-success-*` not captured.**

### States covered
| State | Evidence |
|-------|----------|
| Empty cart on request page | RequestForm empty state labels |
| Success handoff | HandoffSuccess + service probe |
| WhatsApp missing | action maps `WHATSAPP_BUSINESS_E164_MISSING` |
| Error | ActionResult error path in form |

### AR/EN + responsive
- Form bilingual; screens AR only in this pack.

### Gaps
- No payment, no card/COD, no `/checkout` wizard.  
- Shipping method exists in backend but is not exposed on the request form UI.  
- Success-screen screenshot missing.

### Difference from contract wording
**Major:** “إتمام الشراء” implies purchase completion. Delivered scope is **طلب عبر واتساب** (request list → contact → WhatsApp). Frame the client demo accordingly.

---

## 2.6 Responsive Design  
**Contract:** تجربة متجاوبة على الجوال واللوحي والحاسوب  

### Status: **DONE WITH NOTES**  
Responsive layouts exist; this session did **not** re-measure overflow/touch with a live viewport harness. Evidence is code + prior FINAL-QA screenshots at 390 / 768 / 1440.

### What a visitor can do
- Use catalog grid 2→3→4 columns across breakpoints.  
- Use mobile filter sheet vs desktop sticky filter bar.  
- Use sticky PDP / cart CTAs on small screens.  
- Switch AR/EN with mirrored chrome (`start`/`end`, `dir`).

### Where to see it
- Same pages as 2.1–2.5 at widths 390 / 768 / 1440.  
- Screens: `2.6-responsive-grid-{390\|768\|1440}-{ar\|en}.png`.

### Evidence
- FINAL-QA.md: catalog responsive screenshots pass; home had a known overflow note (X07) on `/` only.  
- Touch-oriented `h-11` / `size-11` (44px) on filter controls, qty stepper, gallery lightbox buttons, load-more.  
- Live overflow assertion printout this session: **not obtained** (headless Chrome could not load localhost for measurement).

### States
N/A beyond layout of the pages above.

### Gaps
- Home hero may still overflow on 390 (FINAL-QA X07) — outside catalog/cart/request but visible on storefront.  
- Full AR+EN touch-target audit not re-run live this session.

### Difference from contract wording
None if prior QA is accepted; this pack’s live responsive instrumentation is incomplete → DONE WITH NOTES.

---

## DEMO SCRIPT

See `docs/client-report/DEMO-SCRIPT.md` (10 steps).

---

## (A) CLIENT-VISIBLE CAVEATS

1. **Shared product photography** — 7/10 published SKUs use `/brand/editorial/…` stand-ins; 3 ouds use atelier cutouts. Not unique SKU photos.  
2. **Privacy policy is placeholder** — `dict.privacy.placeholderBanner` / `[PLACEHOLDER]` body (`lib/i18n/dictionaries.ts`, `/privacy`).  
3. **No product videos** in the demo database (gallery can play video if media exists).  
4. **Cart labelled Request list** — not a paid shopping cart.  
5. **Currency** — published seed is USD; TEST currency is reserved for regression fixtures and is hidden in UI if ever shown.

## (B) DEFERRED ITEMS from FINAL-QA.md touching §02

From `docs/ui-planning/plan/FINAL-QA.md` (read this session):

- **D12** — Product cards use shared editorial photography (deferred assets).  
- **PL05** — Real product photography.  
- **GP01 / GP02** — Extract RequestLine / RequestSummary; two-column request layout (deferred).  
- **X07** — Viewport 390 horizontal scroll fail on `/` only (hero); catalog noted pass in that checklist.  
- **PL01 / PL07** — Postgres / hide UI fixtures in production (ops deferred).

## (C) HONEST LIMITS (contract wording not fully met)

1. **2.2 Video** — Contract requires video; **no seeded video** and admin image upload path does not currently accept video files for storefront media.  
2. **2.5 Checkout** — Contract says step-by-step **purchase** completion; delivered is **WhatsApp request finalization** only (no payment).  
3. **2.4 “Shopping cart”** — Functionally a request list with persistence; naming and commercial end-state differ from an e-commerce cart.  
4. **Gallery with 3 or 8 images** — not present in seed; not live-demoed.  
5. **Live screenshot set** — incomplete EN/cart/success captures this session (see `SCREENS-SOURCE.md`).  
6. **Lighthouse** — not measured.

---

## Status tally

| Status | Items |
|--------|-------|
| DONE | 2.1, 2.3 |
| DONE WITH NOTES | 2.2, 2.4, 2.6 |
| PARTIAL | 2.5 |
| NOT DONE | — |

**Counts:** DONE **2** · DONE WITH NOTES **3** · PARTIAL **1** · NOT DONE **0**
