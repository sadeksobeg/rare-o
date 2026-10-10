# 06 — Cross-Cutting Rules

## 1. Internationalization and RTL

### 1.1 Dictionary structure

`lib/i18n/dictionaries.ts` is split into namespaces: `common`, `storefront`, `admin`, `trader`, `errors`, `status`, `seo`. Key pattern: `area.screen.element` (example `storefront.pdp.addToRequest`).

| Rule | Detail |
|---|---|
| No concatenated sentences | Use whole strings with `{named}` placeholders |
| Plurals | Per-key forms `zero / one / two / few / many / other`, resolved with `Intl.PluralRules` (Arabic has six forms) |
| Parity check | `scripts/check-i18n.ts` (no dependency) fails the lint step if any key exists in only one locale or if a component contains a Latin or Arabic string literal in JSX text |
| No auto-translation | Message content (WhatsApp) is never translated |

### 1.2 RTL rules

1. `<html lang dir>` set from the locale. All layout uses logical properties (`ms/me/ps/pe/start/end`, `text-start`, `inset-inline-*`). No `left` or `right`.
2. Mirror: arrows, chevrons, back/forward, send, breadcrumbs, progress direction, carousels, slide-in direction, "start/end" positioning of toasts and badges.
3. Do not mirror: logo, clock, check, search, media controls, numerals, charts (none exist), phone numbers.
4. Isolate mixed-direction text: Latin names, SKUs, URLs, phone numbers in `<bdi>`. Phone, email, URL inputs `dir="ltr"` with `text-align: start`.
5. Horizontal scroll containers use `scroll-snap` with logical alignment; any JS that reads `scrollLeft` must handle RTL (negative values) via a shared helper `lib/ui/scroll.ts`.
6. Shadows and gradients are direction-neutral. Directional glow (hero) uses logical positioning.
7. Design in Arabic first; the English layout is the mirror, then checked, never the reverse.
8. Never letter-space, italicize, or uppercase Arabic.

### 1.3 Locale routing (D11)

Storefront: Arabic at `/…`, English at `/en/…`. Middleware rewrites `/en/*` to the same routes with locale `en`. A shared helper `lib/href.ts` builds every internal link (`href('/catalog', locale)`); no hard-coded paths in components. The language switch links to the equivalent URL in the other locale. No automatic redirect based on `Accept-Language` or cookie for the storefront (crawler safety). Admin and trader keep cookie-based locale with no prefix.

---

## 2. Formatting (`lib/i18n/format.ts`)

| Function | Rule |
|---|---|
| `formatNumber` | `Intl.NumberFormat(locale + '-u-nu-latn')` |
| `formatCurrency` | `Intl.NumberFormat(locale + '-u-nu-latn', { style: 'currency', currency })`; currency from the product; no conversion; null price → dictionary string "السعر عند الطلب" |
| `formatDate` | `Intl.DateTimeFormat(locale + '-u-nu-latn-ca-gregory')`, timezone from `APP_TIMEZONE` (default `Asia/Damascus`); store UTC |
| `formatRelative` | `Intl.RelativeTimeFormat` with `numeric: 'auto'`; absolute time in the `title` attribute |
| `pluralize` | `pluralize(n, forms)` via `Intl.PluralRules`. Example "قطعة": zero "لا قطع" · one "قطعة واحدة" · two "قطعتان" · few "{n} قطع" · many "{n} قطعة" · other "{n} قطعة" |
| Phone display | `<bdi dir="ltr">` and the number as stored, grouped only by the existing normalizer |

---

## 3. Microcopy bank (draft v1; keys listed, wording replaceable within length limits)

Tone: Arabic is warm, concise, formal-lite (فصحى راقية قصيرة). English is formal and brief. No exclamation marks, no emoji.

| Key | العربية | English |
|---|---|---|
| `nav.collection` | المجموعة | Collection |
| `nav.offers` | العروض | Offers |
| `nav.story` | قصتنا | Our story |
| `nav.traders` | للتجار | For traders |
| `cart.title` | قائمة الطلب | Request list |
| `pdp.add` | أضف إلى الطلب | Add to request |
| `pdp.added` | تمت الإضافة | Added |
| `pdp.addedToast` | أُضيفت القطعة إلى قائمة الطلب | Added to your request list |
| `price.onRequest` | السعر عند الطلب | Price on request |
| `pdp.unavailable` | غير متوفر حالياً | Currently unavailable |
| `cart.continue` | متابعة الطلب | Continue to request |
| `handoff.title` | كيف يتم الطلب؟ | How requesting works |
| `handoff.step1` | اختر القطع | Choose your pieces |
| `handoff.step2` | أرسل طلبك | Send your request |
| `handoff.step3` | نُكمل معك عبر واتساب | We complete it with you on WhatsApp |
| `handoff.note` | لا يوجد دفع إلكتروني. نتفق معك على التفاصيل مباشرة. | There is no online payment. We agree on the details with you directly. |
| `request.success.title` | وصل طلبك | Your request has arrived |
| `request.success.body` | رقم المرجع {ref}. افتح واتساب لنُكمل التفاصيل معك. | Reference {ref}. Open WhatsApp and we will complete the details with you. |
| `request.openWhatsApp` | افتح واتساب | Open WhatsApp |
| `request.copyMessage` | انسخ الرسالة | Copy the message |
| `request.error` | تعذّر إرسال الطلب. حاول مرة أخرى. | We couldn't send your request. Please try again. |
| `cart.empty.title` | قائمة الطلب فارغة | Your request list is empty |
| `cart.empty.body` | اختر قطعة من المجموعة لتبدأ. | Choose a piece from the collection to begin. |
| `catalog.empty.title` | المجموعة قيد التجهيز | The collection is being prepared |
| `catalog.empty.body` | نضيف قطعاً جديدة قريباً. | New pieces are coming soon. |
| `catalog.noResults.title` | لا نتائج مطابقة | No matching results |
| `catalog.noResults.action` | مسح الفلاتر | Clear filters |
| `catalog.updated` | تم تحديث النتائج: {n} | Results updated: {n} |
| `plate.caption` | الصورة قيد التصوير | Photography in progress |
| `trader.band.title` | للتجار | For traders |
| `trader.band.body` | اقترح صفقتك، وتفاوض مباشرة، ونشحن لك من مخزوننا. | Propose your deal, negotiate directly, and we ship to you from our stock. |
| `trader.signIn` | دخول التجار | Trader sign-in |
| `trader.requestAccount` | اطلب حساب تاجر | Request a trader account |
| `trader.requestAccount.message` | مرحباً، أرغب بفتح حساب تاجر لدى RARE OUD. | Hello, I would like to open a trader account with RARE OUD. |
| `trader.waiting` | بانتظارك | Waiting on you |
| `trader.nothingWaiting` | لا شيء بانتظارك الآن | Nothing is waiting on you |
| `trader.proposeDeal` | اقترح صفقة | Propose a deal |
| `trader.requestWholesale` | اطلب بالجملة | Request wholesale |
| `trader.qtyMax` | الكمية القصوى لكل قطعة {n} | Maximum quantity per piece: {n} |
| `trader.dealSent` | أُرسلت صفقتك إلى الإدارة | Your deal was sent to the team |
| `trader.wholesaleSent` | أُرسل طلبك. سنراجعه ونعود إليك. | Your request was sent. We will review it and get back to you. |
| `admin.nothingWaiting` | لا شيء بانتظارك | Nothing is waiting on you |
| `inbox.connected` | متصل | Connected |
| `inbox.connecting` | جارٍ الاتصال… | Connecting… |
| `inbox.disconnected` | غير متصل | Disconnected |
| `inbox.authRequired` | يتطلب ربط الحساب | Account linking required |
| `inbox.error` | خطأ في الاتصال | Connection error |
| `inbox.sendingPaused` | الإرسال عبر واتساب متوقف مؤقتاً | WhatsApp sending is temporarily paused |
| `inbox.rateLimited` | تم بلوغ حد الإرسال، حاول بعد قليل | Sending limit reached, try again shortly |
| `inbox.sendFailed` | لم تُرسل — إعادة المحاولة | Not sent — retry |
| `inbox.nonText` | رسالة غير نصية — افتحها من تطبيق واتساب على الهاتف | Non-text message — open it in WhatsApp on your phone |
| `inbox.empty` | لا محادثات بعد | No conversations yet |
| `inbox.newMessages` | رسائل جديدة | New messages |
| `error.generic.title` | تعذّر إكمال العملية | Something went wrong |
| `error.generic.body` | حاول مرة أخرى. وإن استمرت المشكلة تواصل معنا عبر واتساب. | Please try again. If it continues, contact us on WhatsApp. |
| `error.retry` | إعادة المحاولة | Try again |
| `error.notFound` | الصفحة غير موجودة | Page not found |
| `error.forbidden` | هذا القسم غير متاح لحسابك | This area isn't available for your account |
| `error.session` | انتهت جلستك. سجّل الدخول من جديد. | Your session has expired. Please sign in again. |
| `error.offline` | لا يوجد اتصال بالإنترنت | You're offline |
| `form.required` | هذا الحقل مطلوب | This field is required |
| `form.phone` | أدخل رقم هاتف صحيحاً مع رمز الدولة | Enter a valid phone number with country code |
| `form.unsaved` | لديك تغييرات غير محفوظة | You have unsaved changes |

---

## 4. Accessibility (WCAG 2.2 AA, all roles)

| Area | Requirement |
|---|---|
| Contrast | Tokens in file 01 §3.4 only. Body text ≥ 7:1 where the tokens allow. No new color pair without a computed ratio |
| Target size | 44 × 44 minimum for all interactive elements |
| Focus | Visible ring on every interactive element; logical order; focus never trapped except inside open dialogs; return to the trigger on close |
| Keyboard | Every flow completable by keyboard: menus (arrows, Esc, Home/End), tabs (roving), dialogs, gallery/lightbox (arrows, Esc), filters, inbox composer (Enter / Shift+Enter) |
| Landmarks | `header`, `nav` (labelled), `main`, `footer`; one `h1` per page; no skipped heading levels |
| Forms | Visible labels, `autocomplete` attributes, errors linked with `aria-describedby`, error summary on submit with focus moved to it, required state in text |
| Live regions | `aria-live="polite"` for filter result counts, toasts, new inbox messages; `role="alert"` for blocking errors |
| Status | Never color alone: icon and text on every chip |
| Language | `lang` on the root and on inline foreign runs where it changes pronunciation (brand names inside Arabic text) |
| Motion | Reduced motion and Save-Data honored (file 01 §8.4); nothing flashes more than 3 times per second |
| Images | Product alt `{name} — {angle}`; decorative motifs `aria-hidden`; Material Plate described as "الصورة قيد التصوير" only on the PDP |
| Tables | Real table semantics with header cells, `scope`, and `aria-sort`; mobile card lists keep labels |
| Screen reader smoke test | NVDA (Windows) and VoiceOver (iOS) on five flows: request a piece, send a deal, send a wholesale request, reply in the inbox, publish a product |

---

## 5. Performance

| Metric | Budget (mobile, Slow 4G, mid-range device) |
|---|---|
| LCP | ≤ 2.5 s on Home, Catalog, PDP |
| CLS | ≤ 0.1 |
| INP | ≤ 200 ms |
| JS per route | ≤ 200 KB gzipped (first load) |
| Lighthouse | Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95 on storefront pages |

Techniques (mandatory):

- `next/image` everywhere with explicit `sizes`; formats AVIF then WebP; only the hero image is `priority`.
- Reserved aspect boxes for every image (no layout shift).
- Four font families, limited weights (file 01 §5.1), `display: swap`, preload only the active locale's display font.
- Server Components by default. `"use client"` only for interaction. Load the lightbox, quick view, search overlay, and mobile menu with `dynamic()` on first intent.
- No third-party scripts in v1.
- `public/brand/**` served with long-lived immutable cache headers.
- Save-Data: smaller hero image, no motion, no autoplay.
- Weak-network behavior: skeletons (not spinners) for lists, retry banners for failures, form data never lost.

| Image | `sizes` |
|---|---|
| Product card | `(min-width:1280px) 25vw, (min-width:1024px) 33vw, 50vw` |
| PDP main | `(min-width:1024px) 58vw, 100vw` |
| Hero | `(min-width:1024px) 50vw, 100vw` |
| Offer card | `(min-width:1024px) 33vw, 100vw` |

---

## 6. SEO

| Item | Spec |
|---|---|
| Titles | `{page} | RARE OUD`; home `RARE OUD — {tagline}`; ≤ 60 characters |
| Descriptions | 120–160 characters, unique per page, from `lib/seo.ts` |
| Canonical | Self-referencing; filtered catalog URLs canonical to `/catalog` |
| hreflang | `ar`, `en`, `x-default` (Arabic) on every indexable storefront page |
| Open Graph | Product: first product image; offer: offer image; fallback A4 default 1200 × 630 |
| Sitemap | `app/sitemap.ts`: home, catalog, published products, published offers, contact, privacy, each with both locales |
| Robots | `app/robots.ts`: allow storefront; disallow `/admin`, `/trader`, `/api`, `/cart`, `/request` |
| noindex | Admin, trader, cart, request, 404, login pages |
| JSON-LD | `Organization`, `WebSite` (home); `Product` + `BreadcrumbList` (PDP); `offers` only when a price exists |
| Content | One `h1`; meaningful link text; image alt; Arabic and English content are real translations, not machine output |

---

## 7. State patterns and status system

### 7.1 Error taxonomy

| Type | Where it shows | Component |
|---|---|---|
| Field validation | Under the field + error summary on submit | P02 + Banner |
| Network failure on submit | Banner above the form, data kept, retry | Banner |
| Server error | Banner danger with generic copy | Banner |
| Permission (wrong role) | Dedicated 403 view | ErrorState |
| Not found (including a foreign record id) | 404 view, no hint of existence | ErrorState |
| Session expired | Toast + redirect with `returnTo` | Toast |
| List failed to load | ErrorState in place of the list | P14 |

Toasts confirm success; Banners hold information that must stay visible. Errors never rely on toasts alone.

### 7.2 Loading hierarchy

Route-level `loading.tsx` skeleton → in-component skeleton → button loading state. No full-page spinners. Shell stays mounted in admin and trader.

### 7.3 Status mapping file

```ts
// lib/ui/status.ts — generated from schema enums, reviewed once
export type Tone = 'neutral'|'info'|'progress'|'attention'|'success'|'danger'|'closed';
export type NextActor = 'admin'|'trader'|'customer'|'none';
export const status: Record<Domain, Record<string, { tone: Tone; labelKey: string; nextActor: NextActor }>> = { /* … */ };
```

Cursor produces the table from `prisma/schema.prisma` and attaches it to the Phase 2 review. The owner approves the tone and `nextActor` of each value once; after that nothing else in the UI hard-codes a status.

---

## 8. Universal acceptance checklist (every screen, every phase)

**Structure**
- [ ] Works at 390, 768, 1440 px with no horizontal scroll and no clipped content
- [ ] Arabic and English both verified; mirroring correct; no `left`/`right`
- [ ] All data states implemented: loading, empty, no-results, error, success, validation, disabled, unauthorized (where applicable)

**Quality**
- [ ] Only tokens and type roles: no hex, no arbitrary `text-[…]`, no hard-coded string
- [ ] Images through `next/image` with `sizes`, alt text, reserved box
- [ ] Reduced-motion and Save-Data behaviors verified
- [ ] Component states match file 02 (hover, focus-visible, active, disabled, loading, error)

**Accessibility**
- [ ] Keyboard-only path completed; focus visible and logical
- [ ] axe: zero critical or serious issues
- [ ] Contrast pairs from the approved table only
- [ ] Touch targets ≥ 44 px

**Business rules**
- [ ] No payment wording or iconography
- [ ] No trader-owned products, sales, or commission implied
- [ ] Three domains visually and structurally separate; no generic "Order"
- [ ] WhatsApp text never triggers a business status change

**Performance and SEO (storefront)**
- [ ] Lighthouse targets met on the page
- [ ] Metadata, canonical, hreflang, and JSON-LD present where specified

---

## 9. Content requirements from the client

| Content | Limit |
|---|---|
| Product name | ≤ 60 characters per language |
| Short descriptor | ≤ 160 characters |
| Description | 80–300 words |
| Category name | ≤ 24 characters |
| Offer title / summary | ≤ 50 / ≤ 160 characters |
| Hero headline | ≤ 3 lines, ≤ 38 characters per line |
| Craft story | ≈ 90 words + one pull quote ≤ 80 characters |
| Photography | Per file 01 §10, minimum 3 images per product |
| Privacy text | Provided by the client or their legal adviser |
