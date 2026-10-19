# Conformance inventory — Plan Parts 02–05 vs as-built

**Date:** 2026-10-19  
**Scope:** PLAN Parts **02** (components), **03** (storefront pages), **04** (admin pages), **05** (trader pages) only.  
**Method:** Read-only inspection of the current working tree after D1 admin/media work.  
**Marks:** `MATCH` | `PARTIAL` | `MISSING` | `DEVIATES`

---

## Summary

| Area | MATCH | PARTIAL | MISSING | DEVIATES | Notes |
|------|------:|--------:|--------:|---------:|-------|
| 02 §1 Primitives | ~8 | ~12 | ~8 | 0 | Core UI exists; many plan IDs not extracted |
| 02 §2 Storefront | ~12 | ~14 | ~2 | 0 | Home H1–H9 locked; discovery extras beyond plan |
| 02 §3 Admin | ~10 | ~8 | ~2 | 0 | Dashboard KPI/queue/feed wired; inbox polish gaps |
| 02 §4 Trader | ~4 | ~2 | 0 | 0 | Wizard + picker + summary bar present |
| 03 Storefront pages | ~6 | ~5 | 0 | 0 | SF-01 stack matches D41b |
| 04 Admin pages | ~8 | ~6 | ~1 | 0 | Categories manager + product media D1 |
| 05 Trader pages | ~5 | ~4 | 0 | 0 | Deal wizard uses T04 |

---

## Part 02 §1 — Primitives (`components/ui/`)

| ID | Mark | Evidence |
|----|------|----------|
| P01 Button | PARTIAL | `components/ui/button.tsx`, `ro-button.tsx` — variants/sizes not full P01 matrix |
| P02 TextField | PARTIAL | `components/ui/text-field.tsx` — dense admin + storefront heights |
| P03 Select | MISSING | Native `<select>` in forms only (`product-form.tsx`, etc.) |
| P04 Checkbox/Radio | PARTIAL | Raw inputs in forms; no shared primitive |
| P05 Switch | MISSING | No `role="switch"` primitive |
| P06 StatusChip | MATCH | `components/ui/status-chip.tsx`, `lib/ui/status-labels.ts` |
| P07 Card | PARTIAL | `ro-portal-card` / ad-hoc borders; no plain/inverse/media Card |
| P08 Dialog | PARTIAL | `components/ui/dialog.tsx` — ConfirmDialog, Sheet behavior partial |
| P09 Menu/Popover | MISSING | Ad-hoc patterns |
| P10 Tabs | PARTIAL | `components/ui/list-filter-tabs.tsx` for admin lists |
| P11 Toast | PARTIAL | `components/ui/toast.tsx` |
| P12 Skeleton | PARTIAL | `components/ui/skeleton.tsx` |
| P13 EmptyState | PARTIAL | `components/ui/empty-state.tsx` |
| P14 ErrorState | PARTIAL | `components/ui/route-error.tsx` |
| P15 Pagination | MISSING | Catalog load-more; admin tables unpaginated |
| P16 Breadcrumb | MISSING | — |
| P17 Table | PARTIAL | `components/admin/data-table.tsx` |
| P18 Stepper | PARTIAL | `components/ui/status-stepper.tsx`, `components/ui/wizard.tsx` progress |
| P19 Timeline | PARTIAL | `components/ui/timeline.tsx`; deal/inbox usage |
| P20 KeyValueList | PARTIAL | `components/admin/detail-list.tsx` |
| P21 Banner | MATCH | `components/ui/banner.tsx` |
| P22 Loader | PARTIAL | `components/ui/loader.tsx` |
| P23 SkipLink | PARTIAL | `app/layout.tsx` `.ro-skip-link` |
| P24 Divider | PARTIAL | CSS utilities / brand dividers |

---

## Part 02 §2 — Storefront components

| ID | Mark | Evidence |
|----|------|----------|
| S01 Header | PARTIAL | `components/storefront/header.tsx` |
| S02 MobileMenu | PARTIAL | Drawer in header |
| S03 SearchOverlay | MATCH | `components/storefront/discovery/search-overlay.tsx` via `homepage-shell.tsx` |
| S04 LocaleSwitch | PARTIAL | Cookie + `/en` prefix middleware |
| S05 RequestListButton | PARTIAL | Header cart/request affordances |
| S06 ProductCard | MATCH | `components/storefront/catalog/product-card.tsx` |
| S07 ProductGrid | MATCH | `components/storefront/catalog/product-grid.tsx` |
| S08 FilterBar | MATCH | `components/storefront/catalog/filter-bar.tsx` — **sticky** `top-[65px]` desktop bar + mobile Sheet |
| S09 PriceBlock | PARTIAL | Inline pricing components |
| S10 AvailabilityChip | PARTIAL | PDP/catalog availability copy |
| S11 ProductGallery | MATCH | `components/storefront/product-gallery.tsx` — **image + video** (`kind === "video"`) |
| S12 SpecTable | PARTIAL | PDP specs from product fields |
| S13 QtyStepper | PARTIAL | PDP/cart steppers |
| S14–S18 Request flow | PARTIAL | `handoff-explainer.tsx`, request pages |
| S19 OfferCard | MATCH | `components/storefront/offer-card.tsx` |
| S20 SectionHeading | MATCH | `components/storefront/section-heading.tsx` |
| S21 TrustStrip | MATCH | `components/storefront/home/trust-strip.tsx` |
| S22 EditorialSplit | MATCH | `components/storefront/editorial-split.tsx` |
| S23 TraderBand | MATCH | `components/storefront/trader-band.tsx` |
| S24 Footer | PARTIAL | Storefront layout footer |
| S25 MaterialPlate | PARTIAL | `components/storefront/material-plate.tsx` |
| S26 HeroResonance | MATCH | `components/storefront/home/hero-resonance.tsx` |
| S27 QuickView | PARTIAL | `components/storefront/discovery/quick-view-panel.tsx` (discovery shell) |

### Home stack (plan SF-01 H1–H9)

| Block | Mark | Evidence |
|-------|------|----------|
| H1 Hero | MATCH | `app/(storefront)/page.tsx` `data-home-block="H1"` → `HeroResonance` |
| H2 Trust strip | MATCH | `data-home-block="H2"` → `TrustStrip` |
| H3 Featured | MATCH | Conditional `FeaturedInstrument` when featured product exists |
| H4 Collections | MATCH | `CategoryExplorer` when categories.length > 0 |
| H5 Offers | MATCH | Inverse `OfferCard` grid when offers exist |
| H6 Latest | MATCH | `ProductGrid` up to 8 latest |
| H7 Craft story | MATCH | `EditorialSplit` with `id`/story anchor |
| H8 Handoff | MATCH | `HandoffExplainer` full variant |
| H9 Trader band | MATCH | `TraderBand` always rendered |
| Discovery shell | DEVIATES | `HomepageShell` adds search/quick-view/compare beyond original S01-only home (intentional discovery layer) |

---

## Part 02 §3 — Admin components

| ID | Mark | Evidence |
|----|------|----------|
| A01 AdminShell | PARTIAL | `components/admin/shell.tsx`, `nav.tsx` — sidebar groups, inbox badge |
| A02 PageHeader | MATCH | `components/admin/page-header.tsx` |
| A03 FilterToolbar | MATCH | `components/admin/table-filters.tsx` — exported as `FilterToolbar`; **sticky** `top-0 z-20`; tabs + search + optional `resultCount` on products/requests/deals/wholesale |
| A04 DataTable | PARTIAL | `components/admin/data-table.tsx` — no kebab row actions everywhere |
| A05 KpiTile | MATCH | `components/admin/kpi-tile.tsx`; used on `app/admin/(protected)/page.tsx` with loading skeleton |
| A06 ActionQueue | MATCH | `components/admin/action-queue.tsx` + `lib/admin/dashboard.ts` `getActionQueueRows` (merged domains, max 8) |
| A07 ActivityFeed | MATCH | `components/admin/activity-feed.tsx` + `getActivityFeedItems` |
| A08 ConnectionCard | PARTIAL | `components/admin/connection-card.tsx` — outbound read-only per D32a |
| A09 StatusStepper | PARTIAL | `components/ui/status-stepper.tsx` on detail routes |
| A10 ConfirmDialog | MATCH | `components/ui/dialog.tsx` ConfirmDialog |
| A11 ImageUploader | PARTIAL | `components/admin/image-uploader.tsx` — reorder, alts, max 8; **+ MP4/WebM video** (plan text was images-only); magic-byte validation in `lib/catalog/images.ts` |
| A12 SpecEditor | MISSING | Free-form specs textareas in `product-form.tsx` |
| A13–A18 Inbox | PARTIAL | Inbox pages + `message-bubble`, `composer`, banners — layout breakpoints partial vs AD-03 wireframe |
| A19 NegotiationThread | PARTIAL | `components/deals/negotiation-thread.tsx` |
| A20 DetailLayout | PARTIAL | Ad-hoc two-column on some detail pages |

### Categories manager (AD-08)

| Item | Mark | Evidence |
|------|------|----------|
| Table + create/edit Dialog | MATCH | `components/admin/categories-manager.tsx`, `app/admin/(protected)/categories/page.tsx` |
| Delete guard (products / launch) | MATCH | UI disables delete when `productCount > 0` or `isLaunch`; server `deleteCategoryAction` returns `CATEGORY_HAS_PRODUCTS` / `CATEGORY_LAUNCH` in `app/actions.ts` |

### Customer detail — WhatsApp links

| Item | Mark | Evidence |
|------|------|----------|
| WA conversation list by phone | MATCH | `app/admin/(protected)/customers/[id]/page.tsx` — `findWhatsAppConversationsForPhone`, links to `/admin/inbox/[id]` |
| Retail request links | MATCH | Same page — links to `/admin/requests/[id]` |

---

## Part 02 §4 — Trader components

| ID | Mark | Evidence |
|----|------|----------|
| T01 TraderShell | PARTIAL | `components/trader/shell.tsx` — mobile tabs + desktop nav |
| T02 TaskCard | PARTIAL | Trader home task blocks |
| T03 DealCard | PARTIAL | Deals list cards |
| T04 Wizard | MATCH | `components/ui/wizard.tsx` + `components/trader/new-deal-form.tsx` (3 steps, `sessionStorage` draft `ro-trader-deal-draft`) |
| T05 ProductPicker | MATCH | `components/trader/product-picker.tsx` — grid, category chips, qty |
| T06 BuilderSummaryBar | MATCH | `components/trader/builder-summary-bar.tsx` in `wholesale-request-form.tsx` |
| T07 QuoteCard | PARTIAL | Wholesale/deal quote display partial |

---

## Part 03 — Storefront pages (selected)

| Page | Mark | Evidence |
|------|------|----------|
| SF-01 Home | MATCH | `app/(storefront)/page.tsx` H1–H9 stack documented in file header |
| SF-02 Catalog | PARTIAL | `app/(storefront)/catalog/page.tsx` + sticky FilterBar |
| SF-03 Product PDP | MATCH | `app/(storefront)/product/[slug]/page.tsx` + gallery video support |
| SF-04 Cart / Request | PARTIAL | `(storefront)/cart`, `/request` |
| Static contact/privacy | PARTIAL | `(storefront)/contact`, `/privacy` |

---

## Part 04 — Admin pages (selected)

| Page | Mark | Evidence |
|------|------|----------|
| AD-02 Dashboard | MATCH | `app/admin/(protected)/page.tsx` — KpiTile ×4, ActionQueue, ConnectionCard, ActivityFeed |
| AD-04 Requests | PARTIAL | List + detail; FilterToolbar on list |
| AD-05 Deals / Wholesale | PARTIAL | FilterToolbar; negotiation on detail |
| AD-06 Products | MATCH | `products/page.tsx`, `products/new`, `products/[id]` — `ProductForm` publish gates (`PUBLISH_NEEDS_NAME_AR`, `PUBLISH_NEEDS_IMAGE`) in `app/actions.ts` + client `canPublish` in `product-form.tsx` |
| AD-08 Categories | MATCH | `categories/page.tsx` + `CategoriesManager` |
| AD-09 Customers | MATCH | List + `[id]` detail with WA links |
| AD-10 Traders | MATCH | `traders/page.tsx` + `CreateTraderForm` one-time temp password Dialog in `trader-forms.tsx` |
| AD-03 Inbox | PARTIAL | `inbox/page.tsx`, `inbox/[id]/page.tsx` — three-pane layout simplified on narrow widths |

---

## Part 05 — Trader pages (selected)

| Page | Mark | Evidence |
|------|------|----------|
| TR-02 Home | PARTIAL | `app/trader/(protected)/page.tsx` — waiting block + tasks |
| TR-04 New deal | MATCH | `app/trader/(protected)/deals/new/page.tsx` → `NewDealForm` + Wizard |
| TR-05 Deal detail | PARTIAL | `deals/[id]/page.tsx` + negotiation |
| TR-06 Wholesale | MATCH | `wholesale/page.tsx` + `wholesale-request-form.tsx` (ProductPicker + BuilderSummaryBar) |
| TR-01 Login | PARTIAL | `app/trader/login/page.tsx` |

---

## High-priority gaps (Parts 02–05)

1. **Primitive extraction** — P03, P05, P07, P09, P15, P16 still missing as named components.  
2. **A12 SpecEditor** — schema-driven attribute grid not implemented; specs remain textarea fields.  
3. **Inbox layout** — AD-03 three-column / drawer breakpoints PARTIAL vs wireframe.  
4. **Admin table UX** — row kebab actions, pagination (P15), mobile card list mode incomplete on some routes.  
5. **Home discovery** — SearchOverlay/QuickView/Compare are enhancements beyond baseline S01–S27 (marked DEVIATES on shell only).

---

## D1-relevant confirmations

| Requirement | Mark | Evidence |
|-------------|------|----------|
| Product publish needs Arabic name + ≥1 image | MATCH | `components/admin/product-form.tsx`, `app/actions.ts` |
| Product video on PDP | MATCH | `lib/catalog/images.ts`, `components/storefront/product-gallery.tsx` |
| FilterToolbar sticky | MATCH | `components/admin/table-filters.tsx` |
| Categories delete blocked with products | MATCH | `categories-manager.tsx` + server action |
| Trader password shown once | MATCH | `components/admin/trader-forms.tsx` Dialog + ack checkbox |
| Customer detail + WA | MATCH | `app/admin/(protected)/customers/[id]/page.tsx` |
