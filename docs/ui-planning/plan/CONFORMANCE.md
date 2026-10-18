# Conformance inventory (plan Parts 01–05 vs as-built)

**Date:** 2026-10-18  
**Baseline:** working tree @ `c685097` + `DECISIONS-ADDENDUM.md` (D28–D42)  
**Method:** Read-only file evidence against PLAN Parts **01–05** (focus: **02-components §3–4**, **04-admin**, related **03/05** deal surfaces). Prior inventory (2026-10-12) retained where unchanged. D32a applies: outbound stays **read-only** (no in-app Switch).  
**Marks:** `MATCH` | `PARTIAL` | `MISSING` | `DEVIATES`  
**Rule:** Documentation-only refresh (C5); no code changes in this step.

**How to read:** Prefer groups with many `DEVIATES` / `MISSING` for rework. `PARTIAL` often means “exists under another name / incomplete states.”

---

## Summary by phase

| Phase | MATCH | PARTIAL | MISSING | DEVIATES | Verdict |
|-------|------:|--------:|--------:|---------:|---------|
| P1 Foundations | High | Few | Low | Low | Mostly done — polish gallery / tokens only |
| P2 Primitives | Low–Med | Some | **Many P03–P24** | — | **Needs real primitive pass**; P19 Timeline exists (deal/inbox-adjacent) |
| P3 Chrome / routing | Medium | Some | Low | Low | Shells + locale + 403 present; polish |
| P4 Storefront | Medium | Home **DEVIATES** | EditorialSplit name | Home stack, hero | **Home (D41b) + gap fill** |
| P5 Admin | Medium | Dashboard / inbox / AD-08 | ActionQueue, ActivityFeed, KpiTile as A05 | KPI status sets | **Dashboard + inbox layout**; A17 RecordPicker **MATCH** |
| P6 Trader | Medium | Forms not Wizard | ProductPicker / BuilderSummaryBar | — | **Wizard / picker extraction** |

---

## P1 — Foundations (Part 01 + helpers)

| Item | Mark | Evidence | One-line fix |
|------|------|----------|--------------|
| Token block (sand/ink/plum/amber, roles, space, shape, elevation, motion) | MATCH | `app/globals.css` `:root` | — |
| `.ro-inverse` | MATCH | `app/globals.css` | — |
| Fonts Cormorant / Amiri / Source Sans 3 / IBM Plex Sans Arabic | MATCH | `app/layout.tsx` (`--font-cormorant`, `--font-amiri`, `--font-source`, `--font-plex-ar`) | Confirm Noto fully removed from deps if any remain |
| Rings / Grain / Axis / Emblem | MATCH | `components/brand/{rings,grain,axis,emblem}.tsx` | Wire into home/hero per H1 when D41b |
| `format.ts` | MATCH | `lib/i18n/format.ts` | Later: drop TEST→on-request after D28b |
| `plural.ts` | MATCH | `lib/i18n/plural.ts` | — |
| `href.ts` / `nav.ts` / `seo.ts` / `scroll.ts` | MATCH | `lib/href.ts`, `lib/nav.ts`, `lib/seo.ts`, `lib/ui/scroll.ts` | — |
| `scripts/check-i18n.ts` | MATCH | present | Keep in quality gate |
| `/dev/ui` gallery | PARTIAL | `app/dev/ui/page.tsx` | Expand to every P01–P24 state AR/EN + `.ro-inverse` |
| Contrast pairs only (§3.4) | PARTIAL | Corrective pass fixed named dark sections; other `text-ro-text-2` on dark may remain | Grep dark surfaces; enforce approved pairs |
| Brand PNG until SVG (D26) | MATCH | `public/brand/mark-*.png` | Replace when A1/A2 delivered |

---

## P2 — Primitives (Part 02 §1)

| ID | Mark | Evidence | One-line fix |
|----|------|----------|--------------|
| P01 Button / IconButton / ButtonLink | PARTIAL | `components/ui/button.tsx` (+ `ro-button.tsx` wrapper) | Align sizes/ripple/variants to P01; cover all inverse/danger/quiet |
| P02 TextField / Textarea | PARTIAL | `components/ui/text-field.tsx` | Verify heights 48/40, error `aria-describedby`, char counter |
| P03 Select | MISSING | No `components/ui/select.tsx` | Add styled native select |
| P04 Checkbox / Radio | MISSING | — | Add with 44 px hit area |
| P05 Switch | MISSING | — | Add (outbound UI stays read-only per D32a — Switch may still exist for other uses) |
| P06 StatusChip | PARTIAL | `components/ui/status-chip.tsx` + `lib/ui/status-labels.ts` | Bind exclusively to approved `lib/ui/status.ts` (incl. ready_for_handoff→admin) |
| P07 Card | MISSING | Ad-hoc borders in pages | Extract plain/inverse/media Card |
| P08 Dialog / Sheet | PARTIAL | `components/ui/dialog.tsx` | Verify Sheet-at-&lt;640, focus return, destructive layout |
| P09 Menu / Popover | MISSING | Native menus ad-hoc | Add Popover API menu |
| P10 Tabs | MISSING | — | Add tablist primitive |
| P11 Toast | PARTIAL | `components/ui/toast.tsx` | Max 3, error persist, positions |
| P12 Skeleton | PARTIAL | `components/ui/skeleton.tsx` | Match final geometry; reduce-motion static |
| P13 EmptyState | PARTIAL | `components/ui/empty-state.tsx` | Rings glyph + first-use / no-results / restricted |
| P14 ErrorState | PARTIAL | `components/ui/route-error.tsx` | Align to P14 layout + retry |
| P15 Pagination | MISSING | Catalog uses load-more (`catalog/load-more.tsx`) | Add P15 for admin tables; keep catalog load-more |
| P16 Breadcrumb | MISSING | — | Add for admin detail |
| P17 Table base | PARTIAL | Via `components/admin/data-table.tsx` | Extract shared semantic table primitive |
| P18 Stepper | PARTIAL | `components/ui/status-stepper.tsx` | Match P18 done/current/upcoming/blocked |
| P19 Timeline | PARTIAL | `components/ui/timeline.tsx`; used in `components/deals/negotiation-thread.tsx` | Extend to retail handoff / wholesale lifecycle on detail pages |
| P20 KeyValueList | MISSING | `detail-list` / dl ad-hoc | Extract KeyValueList |
| P21 Banner | PARTIAL | `components/ui/banner.tsx` | Tone + role=alert for errors |
| P22 Loader | PARTIAL | `components/ui/loader.tsx` | Three-ring motif sizes 24/40 |
| P23 SkipLink | PARTIAL | `app/layout.tsx` `.ro-skip-link` | Confirm dictionary string |
| P24 Divider | PARTIAL | CSS hairline / grain utilities | Formalize hairline / grain / axis components |

---

## P2 — Storefront components (Part 02 §2)

| ID | Mark | Evidence | One-line fix |
|----|------|----------|--------------|
| S01 Header | PARTIAL | `components/storefront/header.tsx` | Match over-hero/solid, nav set, 72/60 heights |
| S02 MobileMenu | PARTIAL | In header drawer | Full-height sheet + WhatsApp footer CTA |
| S03 SearchOverlay | PARTIAL | `discovery/search-overlay.tsx` | Live 6 results + recent + Esc |
| S04 LocaleSwitch | PARTIAL | Header locale link | Text toggle ع/EN per S04 |
| S05 RequestListButton | PARTIAL | Header cart link | `list-checks` + bump animation |
| S06 ProductCard | PARTIAL | `catalog/product-card.tsx` | 4:5, hover second image, plate fallback |
| S07 ProductGrid | MATCH | `catalog/product-grid.tsx` | — |
| S08 FilterBar / FilterSheet | PARTIAL | `catalog/filter-bar.tsx` | Mobile bottom Sheet + apply count |
| S09 PriceBlock | PARTIAL | `catalog/price-block.tsx` | After D28b: null pair → on-request; drop TEST rule |
| S10 AvailabilityChip | MATCH | `catalog/availability-chip.tsx` | — |
| S11 ProductGallery | PARTIAL | `product-gallery.tsx` | Thumb rail, lightbox, priority first |
| S12 SpecTable | PARTIAL | `catalog/spec-table.tsx` | Soft parse only (D34) |
| S13 QtyStepper | MATCH | `qty-stepper.tsx` | — |
| S14 RequestLine | PARTIAL | Inside `cart-view.tsx` | Extract S14; hide price when null (D28) |
| S15 HandoffExplainer | MATCH | `handoff-explainer.tsx` | Use full/compact on H8 / cart / PDP |
| S16 RequestSummary | PARTIAL | `cart-view.tsx` sticky | Extract S16 |
| S17 RequestForm | PARTIAL | `request-form.tsx` | Country not city (D29); consent line |
| S18 HandoffSuccess | PARTIAL | `handoff-success.tsx` | Rings once + copy message |
| S19 OfferCard | PARTIAL | `offer-card.tsx` | 16:10 / inverse featured; no fake validity (D30) |
| S20 SectionHeading | PARTIAL | `section-heading.tsx` + home `section-header.tsx` (two names) | Unify to plan `SectionHeading` |
| S21 TrustStrip | PARTIAL | `home/trust-strip.tsx` | **Not on current home** — restore for H2 (D41b) |
| S22 EditorialSplit | MISSING | No file; `oud-editorial.tsx` substitute | Implement EditorialSplit for H7 |
| S23 TraderBand | PARTIAL | `trader-band.tsx` | Three steps + secondary WhatsApp account request |
| S24 Footer | PARTIAL | `footer.tsx` | Columns per S24; no payment icons |
| S25 MaterialPlate | MATCH | `material-plate.tsx` | — |
| S26 HeroResonance | PARTIAL | `home/hero-resonance.tsx` | Match H1 layout (visual column, CTAs, choreography) for D41b |
| S27 QuickView | PARTIAL | `discovery/quick-view-panel.tsx` | Desktop-only Dialog md |

---

## P2 — Admin / trader components (Part 02 §3–4)

| ID | Mark | Evidence | One-line fix |
|----|------|----------|--------------|
| A01 AdminShell | PARTIAL | `admin/shell.tsx` + `nav.tsx` | Collapse 72, WA connection dot, unread badge |
| A02 PageHeader | PARTIAL | `admin/page-header.tsx` | Spec sizes + max 1 primary |
| A03 FilterToolbar | PARTIAL | `components/admin/table-filters.tsx` (`AdminTableFilters`) on `app/admin/(protected)/{products,requests,deals,wholesale}/page.tsx` — tabs + URL search | Rename/extract A03: sticky under PageHeader, result count, extra filter popovers |
| A04 DataTable | PARTIAL | `admin/data-table.tsx` | Card list &lt;768, kebab, aria-sort |
| A05 KpiTile | MISSING | Dashboard inlines numbers | Extract KpiTile + zero success state |
| A06 ActionQueue | MISSING | Recent retail list only | Merge nextActor=admin (D31b) |
| A07 ActivityFeed | MISSING | — | Union events (D31) |
| A08 ConnectionCard | PARTIAL | `inbox-health.tsx` on dashboard | Dedicated card; read-only outbound (D32a) |
| A09 StatusStepper | PARTIAL | Uses `status-stepper.tsx` | Bind transitions + ConfirmDialog |
| A10 ConfirmDialog | PARTIAL | Via Dialog | Preset consequence copy |
| A11 ImageUploader | MATCH | `image-uploader.tsx` + `lib/catalog/images.ts` | — |
| A12 SpecEditor | PARTIAL | Product form textareas | Free-text bilingual only (D34) |
| A13 ConversationList | PARTIAL | `inbox-conversation-list.tsx` | Tabs الكل/غير مقروءة/مرتبطة/غير مرتبطة |
| A14 MessageBubble | PARTIAL | Inbox thread markup | Extract bubble + failed retry |
| A15 Composer | PARTIAL | `inbox-composer.tsx` | Disable reasons + length counter |
| A16 LinkedRecordPanel | PARTIAL | `components/admin/linked-record-panel.tsx` (+ `business-context-panel.tsx`) | ConfirmDialog + audit trail polish per A16 |
| A17 RecordPicker | MATCH | `components/admin/record-picker.tsx`; wired from `linked-record-panel.tsx`; search via `adminSearchLinkableRecordsAction` in `app/whatsapp-actions.ts` | — |
| A18 InboxConnectionBanner | PARTIAL | `inbox-health.tsx` | Full-width banner tones per state |
| A19 NegotiationThread | MATCH | `components/deals/negotiation-thread.tsx` + `NegotiationForm`; mounted on `app/admin/(protected)/deals/[id]/page.tsx` and `app/trader/(protected)/deals/[id]/page.tsx` | — |
| A20 DetailLayout | PARTIAL | Page grids ad-hoc | Standard 8/4 ≥1024 |
| T01 TraderShell | PARTIAL | `trader/shell.tsx` + bottom tabs | Match 64 px labels + dots for waiting |
| T02 TaskCard | MATCH | `task-card.tsx` | — |
| T03 DealCard | PARTIAL | `deal-card.tsx` | بانتظارك from nextActor |
| T04 Wizard | MISSING | `new-deal-form.tsx` is multi-fieldset page | Extract Wizard + sessionStorage draft |
| T05 ProductPicker | MISSING | Inside wholesale form | Extract grid picker, no prices |
| T06 BuilderSummaryBar | MISSING | Inside wholesale form | Sticky bar + review Sheet |
| T07 QuoteCard | PARTIAL | `quote-card.tsx` | Exact admin quote only; no invented totals |

---

## P3 — Chrome, system pages, routing

| Item | Mark | Evidence | One-line fix |
|------|------|----------|--------------|
| Storefront header/footer | PARTIAL | See S01/S24 | Spec polish |
| Admin / trader shells | PARTIAL | See A01/T01 | — |
| Locale `/en/*` rewrite | MATCH | `middleware.ts` | — |
| Cross-role 403 | MATCH | `middleware.ts` → `/forbidden` | Verify copy AR/EN |
| System not-found / error / loading | PARTIAL | `app/not-found.tsx`, group `error.tsx`/`loading.tsx` | Match SF-10 / portal specs |
| Offline banner | PARTIAL | Used in shells | Confirm dictionary + behavior |
| Dictionary namespaces | PARTIAL | `lib/i18n/dictionaries.ts` | Fill any remaining hard-coded strings |

---

## P4 — Storefront screens (Part 03)

| Screen | Mark | Evidence | One-line fix |
|--------|------|----------|--------------|
| **SF-01 Home H1–H9** | **DEVIATES** | `app/(storefront)/page.tsx`: Hero + ShortcutStrip + spotlight grid + shop + categories + accessories + oud-editorial + handoff + trader — **not** H1→H9 | **D41b:** rebuild stack: Hero → TrustStrip → Featured → Collections → Offers → Latest → EditorialSplit → HandoffExplainer → TraderBand |
| H1 Hero | PARTIAL | `hero-resonance.tsx` compact commerce hero | Full H1 height/visual/CTAs |
| H2 Trust strip | DEVIATES | Component exists but **not mounted** on `/` | Mount TrustStrip |
| H3 Featured | PARTIAL | `featured-instrument.tsx` | Spec layout 7/5 |
| H4 Collections | PARTIAL | `category-explorer.tsx` | Aspect/count/plate rules |
| H5 Offers | PARTIAL | `featured-offer.tsx` + promo bands gated | Inverse OfferCard stack; no promos unless flag |
| H6 Latest | PARTIAL | ProductGrid slice | SectionHeading “أحدث القطع” |
| H7 Craft story | DEVIATES | `oud-editorial.tsx` | Replace with EditorialSplit + `#story` |
| H8 How requesting works | PARTIAL | `home-handoff.tsx` | Prefer full HandoffExplainer |
| H9 Trader band | PARTIAL | `trader-band.tsx` | Full S23 |
| SF-02 Catalog | PARTIAL | `catalog/page.tsx` + FilterBar **Sheet on mobile (Slice G)** | SEO lead / remaining polish |
| SF-03 PDP | PARTIAL | `product/[slug]/page.tsx` | Gallery/sticky CTA polish |
| SF-04 Cart / request list | PARTIAL | `cart/page.tsx` | Naming + S14/S16 |
| SF-05 Request | PARTIAL | `request/page.tsx` — consent under submit + offer prefill (G) | Desktop 7/5 summary |
| SF-06 / SF-07 Offers | PARTIAL | `offers/*` — ask CTA (G); D30 ok | List layout parity |
| SF-08 Contact | PARTIAL | `contact/page.tsx` + `lib/config/contact.ts` | Two-column + plate |
| SF-09 Privacy | PARTIAL→improved | sticky TOC + sections (G) | Owner copy pass |
| SF-10 System | PARTIAL | not-found search (G) | Error contact link; catalog loading |

---

## P5 — Admin screens (Part 04)

| Screen | Mark | Evidence | One-line fix |
|--------|------|----------|--------------|
| AD-01 Login | PARTIAL | `admin/login` | Inverse + rings; rate-limit message |
| AD-02 Dashboard | DEVIATES | `admin/(protected)/page.tsx` + `getAdminHomeData` | KPIs from approved nextActor (**include `ready_for_handoff`**); A06 merge; A07 feed; drop/extra published meta |
| AD-03 Inbox | PARTIAL | inbox pages + list/composer/health | 3-pane ≥1280; A18 banner; tabs |
| AD-04 Requests | PARTIAL | requests list/detail | Handoff column; status menu valid-only |
| AD-05 Deals | PARTIAL | deals list/detail; **NegotiationThread MATCH** on `[id]` | بانتظارك chip; detail A20 layout |
| AD-06 Wholesale | PARTIAL | wholesale pages | After **D37b**: carrier / tracking / shippedAt entry |
| AD-07 Products | PARTIAL | `app/admin/(protected)/products/*`; `ImageUploader` on `[id]`; publish guard in `upsertProductAction` (`app/actions.ts`: `PUBLISH_NEEDS_NAME_AR`, `PUBLISH_NEEDS_IMAGE`); hints in `components/admin/product-form.tsx` | Client-side disable publish when rules unmet; full AD-07 list layout + sticky save bar |
| AD-08 Categories | PARTIAL | `app/admin/(protected)/categories/page.tsx` — inline edit for **launch slugs only** via `listLaunchCategories` / `updateCategoryFormAction`; `assertNoUnrestrictedCategoryCreate()` in `lib/catalog/service.ts` | Plan table + Dialog create/edit; move up/down; delete guard with product count |
| AD-09 Offers | PARTIAL | offers admin | D30; plate ack |
| AD-10 Customers | PARTIAL | List: `app/admin/(protected)/customers/page.tsx` (`uiVisibleCustomerWhere`, search); detail route `customers/[id]/page.tsx` (contact, notes, requests table) | Linked conversations; drawer vs full page; internal note editing if in schema |
| AD-11 Traders | PARTIAL | traders + forms | Show-once password; omit lastSignIn (D38) |
| Promos CRUD | DEVIATES (gated) | `/admin/promos` + `RO_PROMO_FEATURES` | Keep hidden (D42) |

---

## P6 — Trader screens (Part 05)

| Screen | Mark | Evidence | One-line fix |
|--------|------|----------|--------------|
| TR-01 Login | PARTIAL | `trader/login` | Help link WhatsApp account request |
| TR-02 Home | PARTIAL | `trader/(protected)/page.tsx` | بانتظارك from nextActor; TaskCards; offers rail; timeline |
| TR-03 Deals list | PARTIAL | deals page + DealCard | Tabs + FAB |
| TR-04 New deal | PARTIAL | `new-deal-form.tsx` | Wizard T04 + draft persistence |
| TR-05 Deal detail | PARTIAL | deals/[id] | Banner بانتظارك; ConfirmDialog actions |
| TR-06 Wholesale builder | PARTIAL | `wholesale-request-form.tsx` | Extract T05/T06; no prices |
| TR-07 Wholesale list | PARTIAL | wholesale/requests | Tabs + بانتظارك |
| TR-08 Wholesale detail | PARTIAL | wholesale/[id] + QuoteCard | After D37b: read-only shipping block |
| TR-09 Offers | PARTIAL | trader/offers | Prefill subject only |
| TR-10 Profile | PARTIAL | profile page | Read-only + admin contact note |

---

## Cross-cutting gaps that explain “beginner UI” feel

1. **Home DEVIATES from wireframe H1–H9** (D41b) — shortcuts/spotlight commerce layout ≠ locked section stack.  
2. **Primitive library incomplete** — many P03–P24 missing → inconsistent controls.  
3. **Dashboard ActionQueue / ActivityFeed / KPI nextActor** not plan-shaped (D40, D31/D31b); new retail at `ready_for_handoff` currently **excluded** from KPI count.  
4. **Trader wizards not extracted** — forms work but lack Wizard / ProductPicker / sticky summary UX.  
5. **Wholesale shipping UI blocked** until D37b migration (contracted 8.3).

---

## Suggested rework priority (for owner planning — not executed)

| Priority | Phase focus | Why |
|----------|-------------|-----|
| 1 | Status.ts + dashboard KPIs/ActionQueue | Correctness; new requests invisible in KPI today |
| 2 | P4c / D41b home H1–H9 | Wireframe match; largest visual gap |
| 3 | P2 missing primitives (batch) | Unlocks consistent admin/trader polish |
| 4 | P5 inbox 3-pane + ConnectionCard | Core admin workflow |
| 5 | P6 Wizard / ProductPicker | Trader investment |
| 6 | Later slices D28b, D37b | Schema migrations after backup |

---

## C5 targeted spot-check (2026-10-18)

| Focus item | Mark | Evidence paths |
|------------|------|----------------|
| A03 FilterToolbar | PARTIAL | `components/admin/table-filters.tsx` → admin list routes (see A03 row) |
| A17 RecordPicker | MATCH | `components/admin/record-picker.tsx`, `linked-record-panel.tsx`, `app/whatsapp-actions.ts` |
| A19 NegotiationThread | MATCH | `components/deals/negotiation-thread.tsx`, admin + trader deal `[id]` pages |
| AD-07 publish rules | PARTIAL | `app/actions.ts` + `product-form.tsx` (+ images on edit page) |
| AD-08 categories | PARTIAL | `categories/page.tsx`, launch-only update actions |
| AD-10 customer detail | PARTIAL | `customers/page.tsx`, `customers/[id]/page.tsx` (no inbox links yet) |

---

## Explicit stop

`DECISIONS-ADDENDUM.md` recorded. **2026-10-18:** C5 documentation refresh only — **no code, schema, or dependency changes.**  

Awaiting your selection of which phases need real rework vs light fix.
