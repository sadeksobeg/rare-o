# 03 — Storefront Pages

Notation: **start** = right in Arabic, left in English. Columns are logical (column 1 is at the start side). Sections alternate backgrounds as stated. Component IDs refer to file 02. Copy shown is draft v1: the client may replace it, but length limits stay.

Common to every page: skip link, `Header` (S01), `Footer` (S24), all three states (loading, empty, error) where data exists, and the acceptance checklist in file 06 §8.

---

## SF-01 — Home `/`

**Data:** existing `getHomepageDiscoveryData` (categories, featured product, latest products, published offers). **SEO:** indexable.

### Section stack

| # | Section | Background | Present when |
|---|---|---|---|
| H1 | Hero | `.ro-inverse` | always |
| H2 | Trust strip | canvas | always |
| H3 | Featured instrument | sunken | a featured product exists |
| H4 | Collections | canvas | ≥ 1 category |
| H5 | Offers | `.ro-inverse` | ≥ 1 published offer |
| H6 | Latest pieces | canvas | ≥ 1 product |
| H7 | Craft story | sunken | always |
| H8 | How requesting works | canvas | always |
| H9 | Trader band | `.ro-inverse` + plum-900 glow | always |
| — | Footer | `.ro-inverse` | always |

A section whose condition fails is removed, not shown empty. At launch (8 products, 2 categories, 0–2 offers) the page renders H1–H4, H6–H9.

### H1 Hero

```
START ──────────────────────────────────────────────► END
┌───────────────────────────────────────────────────────┐
│ header (over-hero)                                      │
│ ┌─ cols 1–6 ──────────────┐  ┌─ cols 7–12 ───────────┐ │
│ │ overline                 │  │  visual: editorial     │ │
│ │ headline (display-xl)    │  │  image (3:4 mask) OR   │ │
│ │ subline (body-lg)        │  │  HeroResonance rings   │ │
│ │ [Primary] text link      │  │  + grain 6%            │ │
│ │ axis cue (48 px)         │  │                        │ │
│ └──────────────────────────┘  └────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

| Property | Spec |
|---|---|
| Height | `min(100svh, 920px)`, minimum 620 px |
| Background | `ink-950`; radial `plum-900` glow centered on the visual, 60% radius, opacity .55; grain at 6% |
| Overline | "RARE OUD" (Latin, tracked) in both locales |
| Headline | AR "عودٌ نادر، صُنع ليبقى" (≤ 3 lines) · EN "A rare oud, made to last." |
| Subline | AR "قطع مختارة بعناية، تُصنع بيد حرفيّ وتُسلَّم بما يليق بها." · EN "Pieces chosen with care, shaped by hand, delivered with the respect they deserve." (≤ 140 chars) |
| CTAs | `inverse-primary` "استكشف المجموعة" → `/catalog`; text link "قصتنا" → scrolls to H7 |
| Visual | If the hero editorial image exists: 3:4 crop, `priority`, mask with soft edge on the end side. Otherwise rings at 70% of the visual column, `amber-500` at 1 ring only |
| Choreography | File 01 §8.3 |
| Mobile | Visual becomes the background (cropped, scrim 0 → 70% `ink-950` toward the bottom). Text anchored bottom, padding 24. Height `100svh` minus 0 (no URL-bar jump: use `svh`) |
| Low data | Save-Data: no grain draw, smaller image, static rings |

### H2 Trust strip
Four pillars (المادة النادرة · الحرفة · الرنين · الإرث): glyph + 4-word line each. Desktop: 4 columns separated by hairlines. Mobile: 2 × 2 grid. No numbers or claims that cannot be verified.

### H3 Featured instrument
Image on the start side, 7 columns, 4:5. Text 5 columns: overline (category), h1-sized title, 3 highlight specs (from product attributes), `PriceBlock`, primary "عرض القطعة" → PDP, text link "أضف إلى الطلب". Mobile: image first, then text. Section hidden when none.

### H4 Collections
1–2 categories: cards at 6 columns each, aspect 4:5, image + title (h2) + count + arrow. 3–4: 4-column grid. More than 4: horizontal scroll-snap row. Category without an image → Material Plate with the category name.

### H5 Offers
Featured offer as an `inverse` `OfferCard` at 7 columns beside a stacked list of up to two more. One offer: single wide card.

### H6 Latest pieces
`SectionHeading` "أحدث القطع" + link "عرض المجموعة". Up to 8 `ProductCard` in the grid. Fewer than 4 products: the grid shows what exists, left-aligned, no placeholders.

### H7 Craft story
`EditorialSplit`: macro image + 90-word text + pull quote in display font. Anchor id `story`.

### H8 How requesting works
`HandoffExplainer` full variant, centered, max width 880, three steps with the axis connector.

### H9 Trader band
`TraderBand` (S23).

### Acceptance (home)
- Renders correctly with 0 offers, 1 offer, 0 featured product, 1 category, and 300 products.
- Hero LCP element is the image or headline, never an animation frame; LCP ≤ 2.5 s on Slow 4G.
- No section shows empty containers or placeholder text.
- Both locales: hero headline never exceeds 3 lines at 390 px and 1440 px.

---

## SF-02 — Catalog `/catalog`

**Data:** published products, categories. **Query:** `type`, `min`, `max`, `sort` (`new`, `price-asc`, `price-desc`), `q`, `limit`. **SEO:** indexable; filtered URLs canonical to `/catalog`.

| Zone | Spec |
|---|---|
| Page header | Overline "المجموعة", h1 "المجموعة", lead ≤ 280 chars (SEO text), result count |
| FilterBar | S08, sticky below the header at 72 px |
| Grid | S07 with `ProductCard`. 12 items per load, "عرض المزيد" button with progress "عرض 12 من 48" |
| Footer of page | `HandoffExplainer` compact |

**States**

| State | Behavior |
|---|---|
| Loading | Route `loading.tsx`: filter bar skeleton + 8 card skeletons |
| No products at all | EmptyState first-use: "المجموعة قيد التجهيز" + body "نضيف قطعاً جديدة قريباً." + link "تحدث معنا" |
| No results | EmptyState no-results: "لا نتائج مطابقة" + "مسح الفلاتر" |
| Error | ErrorState with retry |

**Acceptance:** filters are keyboard-operable; changing a filter preserves scroll position and announces "تم تحديث النتائج: {n}" via `aria-live`; no layout shift when images load (4:5 box reserved); every card image has alt text.

---

## SF-03 — Product `/product/[slug]`

**Data:** product with images and attributes; related = same category, excluding itself, max 4. `notFound()` for missing or unpublished.

```
START ───────────────────────────────────────────────► END
┌ Breadcrumb ─────────────────────────────────────────────┐
│ ┌ Gallery (cols 1–7) ──────────┐ ┌ Info (cols 8–12, sticky) ┐
│ │ thumb rail │ main 4:5        │ │ overline (category)       │
│ │            │ (hover zoom 2×) │ │ h1 title                  │
│ │            │                 │ │ PriceBlock                │
│ └────────────┴─────────────────┘ │ short descriptor (≤ 160)  │
│                                  │ key specs (3–4 lines)     │
│                                  │ [Add to request]          │
│                                  │ HandoffExplainer compact  │
│                                  └───────────────────────────┘
│ Description (editorial, 680 px measure)                       │
│ SpecTable (full)                                              │
│ Related pieces (4 cards)                                      │
└───────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Gallery | S11. Zero images → single Material Plate with caption |
| Info column | Sticky at `top: 96px`. Primary button "أضف إلى الطلب" (lg, full width). After adding: button becomes "تمت الإضافة" for 1.5 s, toast "أُضيفت القطعة إلى قائمة الطلب" with link "عرض القائمة", header badge bumps |
| Unavailable | Chip "غير متوفر حالياً", primary button disabled with reason, secondary "تحدث معنا" (WhatsApp contact) |
| Mobile | Gallery full-bleed; info below; **sticky bottom bar**: price + primary CTA (72 px, safe-area padding) |
| JSON-LD | `Product` (name, image[], description, brand "RARE OUD"), `offers` only when a price exists, `BreadcrumbList` |

**Acceptance:** gallery works with 0, 1, 3, 8 images; lightbox traps focus and returns it; zoom disabled on touch; CTA reachable without scrolling on mobile; price null shows "السعر عند الطلب" and no currency symbol.

---

## SF-04 — Request list `/cart`

| Zone | Spec |
|---|---|
| Header | h1 "قائمة الطلب", count in text |
| Desktop | Lines (cols 1–7, `RequestLine`) + sticky `RequestSummary` (cols 9–12) |
| Mobile | Lines, then explainer, then sticky bottom bar |
| Below | `HandoffExplainer` full |

**States:** empty (EmptyState "قائمة الطلب فارغة" → "استكشف المجموعة"); a line whose product became unavailable shows a danger Banner "لم تعد هذه القطعة متوفرة" and blocks the continue button until removed; quantity change updates instantly and persists (localStorage).

**SEO:** `noindex`.

---

## SF-05 — Request `/request`

| Zone | Spec |
|---|---|
| Desktop | Form (cols 1–7) + summary aside (cols 9–12, read-only lines, link "تعديل القائمة") |
| Mobile | Collapsible summary (closed, shows count) above the form; form; submit button full width |
| Fields | Per the existing Zod schema: name, phone (placeholder "+963 9XX XXX XXX", helper "مع رمز الدولة"), optional city, optional note. No new fields |
| Consent line | Under the button: "بإرسال الطلب توافق على سياسة الخصوصية" with link |
| Submit | Loading state on the button; double-submit guarded |

**States**

| State | Behavior |
|---|---|
| Empty list | EmptyState with link to catalog |
| Validation | Inline on blur + error summary (`role="alert"`) listing fields on submit; focus moves to the summary |
| Server error | Banner danger "تعذّر إرسال الطلب. حاول مرة أخرى." + retry; form data kept |
| Success | Page content replaced by `HandoffSuccess` (S18). The WhatsApp link opens `wa.me` with the stored prefilled message; if the new tab is blocked, show "انسخ الرسالة" + the business number as text |

**Acceptance:** keyboard-only completion; screen reader announces errors; the request list is cleared only after a successful submit; reload on the success screen does not create a duplicate RetailRequest. **SEO:** `noindex`.

---

## SF-06 — Offers `/offers`

Header: h1 "العروض", lead. Grid of `OfferCard` (1 / 2 / 3 columns). Empty: "لا عروض حالياً" + "استكشف المجموعة". Indexable.

## SF-07 — Offer `/offers/[slug]`

Hero (title, validity if present, summary), included products grid if the model links products, description, primary CTA "اسأل عن هذا العرض" → `/request` with the offer title prefilled in the note (and included products added to the request list when linked). Unpublished or missing → `notFound()`. Indexable.

## SF-08 — Contact `/contact`

Two-column on desktop: start = h1, lead, primary "تحدث معنا على واتساب" (opens `wa.me` with a generic greeting), hours and location text from configuration; end = Material Plate or editorial image. Content comes from `lib/config/contact.ts` (number from environment, text from the dictionary). Indexable.

## SF-09 — Privacy `/privacy`

Single column, 720 px measure, h1 + dated "آخر تحديث". On desktop, a sticky table of contents at the end side. Body text is supplied by the client; the template supports h2/h3, lists, and links. Indexable.

## SF-10 — System pages

| Page | Spec |
|---|---|
| 404 | Rings glyph, "الصفحة غير موجودة", search field, links to المجموعة and الرئيسية. `noindex` |
| Error boundary | ErrorState with retry and contact link. Logs nothing sensitive to the UI |
| Route loading | One `loading.tsx` per group: storefront (hero-less skeleton by page type), admin (shell stays, content skeleton), trader (shell stays) |
| Offline | Thin top Banner "لا يوجد اتصال بالإنترنت" when `navigator.onLine` is false; clears on reconnect with a success toast |

---

## Storefront acceptance addendum

- No online-payment wording or iconography anywhere (D8).
- The request flow is understandable without reading documentation: the explainer appears on PDP, request list, request, and home.
- Every page works at 390, 768, 1440 px in both locales with correct mirroring.
