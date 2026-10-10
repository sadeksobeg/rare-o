# 02 — Component Library

All components read tokens from file 01, use logical properties, take every string from the dictionary, and ship every state listed here. Each component appears in `/dev/ui` in Arabic and English, light and `.ro-inverse`.

## 0. Universal interaction states

| State | Rule |
|---|---|
| Hover | Fine pointers only (`@media (hover:hover)`). 160 ms |
| Focus-visible | 2 px ring `--ro-focus`, 2 px offset, never removed. Mouse focus shows no ring |
| Active | Scale .98 (storefront) or darken one step (admin) |
| Disabled | Opacity .45, `aria-disabled`, no hover, pointer-events none, reason shown nearby when non-obvious |
| Loading | `aria-busy="true"`, fixed width, spinner replaces icon, label stays |
| Error | Border `danger-700`, icon, message linked by `aria-describedby` |

---

## 1. Primitives (`components/ui/`)

| ID | Component | Spec |
|---|---|---|
| P01 | **Button / IconButton / ButtonLink** | Variants: `primary` (ink-950 bg, sand-100 text; hover plum-800), `secondary` (1 px ink-950 outline; hover sand-200), `text` (underline offset 4), `inverse-primary` (sand-100 bg, ink text), `inverse-secondary` (sand outline), `danger` (danger-700 bg), `quiet` (admin, no border). Sizes: sm 36, **md 44 (default)**, lg 52 px height. Padding-inline 20 / 24 / 28. Icon button 44 × 44 (sm 36). Radius 4. Label: verb, ≤ 24 chars Arabic. Storefront `primary` adds the ring ripple. Replaces `RoButton`/`RoButtonLink` (keep exports as thin wrappers until Phase 7) |
| P02 | **TextField / Textarea / FormField** | Label always visible above. Height 48 (storefront, trader), 40 (admin dense). Background sand-50, border `--ro-border-control`, radius 4. Focus: plum-900 border + ring. Helper below, error replaces helper. Required marked in the label text, not by color alone. Phone, email, URL: `dir="ltr"`, text aligned to start. Textarea: 4 rows min, auto-grow to 10. Character counter only when a limit exists |
| P03 | **Select** | Native `<select>` styled to match TextField, chevron mirrored by direction. No custom listbox |
| P04 | **Checkbox / Radio** | 20 px control inside a 44 px hit area, plum-900 when checked, label clickable |
| P05 | **Switch** | 44 × 24, `role="switch"`, label + state text ("مفعّل / متوقف") |
| P06 | **StatusChip** | Tones from file 01 §3.3. Sizes sm (22 px) and md (28 px). Anatomy: icon 14 + label. Variant `dot` for dense tables. Tone and label always come from `lib/ui/status.ts` |
| P07 | **Card** | `plain` (sand-50, hairline, radius 4, padding 20/24), `inverse` (ink-900), `media` (image on top, 2 px radius). Interactive card: whole card is one link, hover lift (storefront only) |
| P08 | **Dialog / Sheet** | Native `<dialog>` + `showModal()`. Sizes sm 440, md 560, lg 720. Below 640 px every dialog becomes a bottom Sheet (radius 16 top). Backdrop ink-950 at 55%. Title required. Esc closes, focus returns to trigger, scroll locked. Destructive confirm: danger button on the end side, cancel on the start side |
| P09 | **Menu / Popover** | Button + `popover` attribute. Arrow keys move, Esc closes, Home/End supported. Min width 200. Used for user menu, row actions, locale picker |
| P10 | **Tabs** | `role="tablist"`, underline style (2 px plum-900), roving tabindex, horizontally scrollable on mobile with edge fade |
| P11 | **Toast** | `aria-live="polite"`, bottom on mobile (full width), `inset-inline-end` bottom on desktop, max 3, 5 s auto-dismiss; errors persist with a dismiss button |
| P12 | **Skeleton** | Same geometry as final content. Base sand-300, shimmer 1.4 s linear (static under reduced motion) |
| P13 | **EmptyState** | Rings glyph 96 px at 28% opacity, title (h3), body ≤ 2 lines, one primary action. Variants: `first-use`, `no-results` (action: clear filters), `restricted` |
| P14 | **ErrorState** | Same layout as EmptyState with `circle-alert` icon, retry button, secondary contact link |
| P15 | **Pagination** | Previous / next + "page x of y" text. 44 px targets. Storefront catalog uses "load more" button instead (progress text "عرض 12 من 48") |
| P16 | **Breadcrumb** | Chevron separator mirrored in RTL, last item `aria-current="page"`, collapses to a back link on mobile |
| P17 | **Table** (base) | Semantic `<table>`, header sand-200, row hover plum-50, sticky header in scroll containers, numeric columns `tabular-nums` and end-aligned |
| P18 | **Stepper** | Horizontal on desktop, vertical on mobile. States: done / current / upcoming / blocked. Labels from lifecycle enums |
| P19 | **Timeline** | Vertical hairline axis, node per event, actor chip, timestamp (relative + absolute on hover/focus), optional detail block |
| P20 | **KeyValueList** | `<dl>`, two columns ≥ 640 px, stacked below, label muted, value text |
| P21 | **Banner** | Inline alert with tone, icon, message, optional action. `role="status"` or `role="alert"` for errors |
| P22 | **Loader** | Three-ring pulse (rings motif), 24 / 40 px. Replaces spinners everywhere |
| P23 | **SkipLink** | First focusable element, visible on focus, text "تخطَّ إلى المحتوى" |
| P24 | **Divider** | `hairline`, `grain` (pattern strip 24 px, 8% opacity), `axis` (48 px vertical) |

---

## 2. Storefront components (`components/storefront/`)

| ID | Component | Spec |
|---|---|---|
| S01 | **Header** | Height 72 desktop / 60 mobile. Variants: `over-hero` (transparent, sand text, grain 0) and `solid` (sand-100, ink text, bottom hairline); switches after 80 px scroll. Order from the start side: brand mark + wordmark, nav (المجموعة · العروض · قصتنا · للتجار), then actions: search, locale switch, request list with count badge. Sticky. Skip link first |
| S02 | **MobileMenu** | Full-height sheet from the start side. Large links (h3), locale switch, WhatsApp contact button at the bottom. Focus trapped |
| S03 | **SearchOverlay** | Full-screen on mobile, centered 720 px panel on desktop. Input autofocus, live results (max 6 products), recent searches (local), empty and no-results states. Esc closes |
| S04 | **LocaleSwitch** | Text toggle "ع / EN", `lang` attribute on each option, navigates to the same page in the other locale (D11) |
| S05 | **RequestListButton** | Icon `list-checks` + count badge (plum-900 on sand, ≥ 1). `aria-label` includes count. Badge bumps once on add (160 ms) |
| S06 | **ProductCard** | Image 4:5 (2 px radius). Hover: second image crossfade if present. Overline: category. Title (h3, max 2 lines). `PriceBlock`. `AvailabilityChip` when unavailable. Whole card is the link. Quick-add button appears on hover/focus on desktop only. Missing image → Material Plate `full` |
| S07 | **ProductGrid** | 2 columns mobile, 3 at ≥ 1024, 4 at ≥ 1280. Gap 16 / 24. Skeleton: 8 cards |
| S08 | **FilterBar / FilterSheet** | Desktop: sticky bar under the header with Type (chips), Price (popover with min/max inputs and two presets), Sort (select). Mobile: "تصفية وترتيب" button opens a Sheet with the same controls and an "عرض {n} قطعة" apply button. Active filters show as removable chips plus "مسح الكل" |
| S09 | **PriceBlock** | Value with `Intl.NumberFormat` (latn digits, currency from the product). Null price → "السعر عند الطلب" in `text-2`. Sizes: card (body 600), PDP (h2 in display font) |
| S10 | **AvailabilityChip** | Only shown when unavailable ("غير متوفر حالياً", tone closed). Available is the unmarked default |
| S11 | **ProductGallery** | Desktop: vertical thumbnail rail (start side, 72 px) + main image; hover zoom 2× inside the frame; click opens a lightbox Dialog (arrow keys, swipe, counter "2 / 5"). Mobile: horizontal scroll-snap, dots, tap opens lightbox. First image `priority`. Zero images → single Material Plate, no controls |
| S12 | **SpecTable** | `KeyValueList` rendering the product's attributes in schema order; empty values omitted; two-column ≥ 768 px |
| S13 | **QtyStepper** | 44 px buttons, numeric input between, min 1, max from product or 99, announces value changes |
| S14 | **RequestLine** | Thumb 72 px (plate `compact` if missing), name, `QtyStepper`, remove (text button), no price column when price is null |
| S15 | **HandoffExplainer** | Title "كيف يتم الطلب؟" + three numbered steps with axis connector + note "لا يوجد دفع إلكتروني…". Used on PDP (compact), Request list (full), Request (compact), Home (full) |
| S16 | **RequestSummary** | Sticky aside on desktop: count (plural-aware), line list, note, primary CTA "متابعة الطلب". Mobile: sticky bottom bar with count + CTA |
| S17 | **RequestForm** | Fields per existing action schema (name, phone with country code, optional city and note). Inline validation on blur, error summary on submit, submit button loading state |
| S18 | **HandoffSuccess** | Rings animation (one pass), "وصل طلبك", reference number (copy button), primary "افتح واتساب", secondary "انسخ الرسالة", then a short "ماذا بعد؟" paragraph |
| S19 | **OfferCard** | Image 16:10 or plate, title h3, 2-line summary, included-product count, validity if present, link. Dark `inverse` card variant for the featured offer |
| S20 | **SectionHeading** | Optional overline, h2, optional lead (≤ 160 chars), optional end-aligned link. Optional grain divider above |
| S21 | **TrustStrip** | Four items (the four pillars), each glyph + 4-word line, hairline separators, no counters or statistics |
| S22 | **EditorialSplit** | Image and text in 7 / 5 column split, axis divider on desktop, image-first order on mobile, optional pull quote in display font |
| S23 | **TraderBand** | `.ro-inverse` band: title "للتجار", 3 steps (اقترح · تفاوض · نشحن لك), primary "دخول التجار" → `/trader/login`, secondary "اطلب حساب تاجر" → WhatsApp handoff with prefilled text |
| S24 | **Footer** | `.ro-inverse`. Columns: brand + one-line tagline; shop (المجموعة، العروض); info (تواصل معنا، الخصوصية); WhatsApp button; locale switch. Grain divider on top. No payment icons |
| S25 | **MaterialPlate** | File 01 §10.3 |
| S26 | **HeroResonance** | File 03 SF-01. Props: `image?`, `headline`, `subline`, `primaryCta`, `secondaryCta` |
| S27 | **QuickView** | Desktop-only Dialog (md): gallery (first 3 images), title, price, add to request, link "عرض التفاصيل" |

---

## 3. Admin components (`components/admin/`)

| ID | Component | Spec |
|---|---|---|
| A01 | **AdminShell** | Sidebar 264 px (collapsible to 72, state persisted), `.ro-inverse`. Groups: التشغيل (Dashboard, Inbox with unread badge, Requests, Deals, Wholesale), الكتالوج (Products, Categories, Offers), الأشخاص (Customers, Traders). Active item: axis indicator on the start edge + sand-100 text. Topbar 56 px: breadcrumb or title, locale switch, connection dot (WhatsApp), user menu (name, sign out). Mobile: topbar + drawer from the start side |
| A02 | **PageHeader** | h1 (UI font, 24 / 28 px, 600), optional description, end-aligned actions (max 1 primary). Breadcrumb above on detail pages |
| A03 | **FilterToolbar** | Search field, status tabs or chips, extra filter popovers, result count. Sticky under the PageHeader on scroll |
| A04 | **DataTable** | Built on P17. Sortable headers (`aria-sort`), row click opens detail, kebab row actions (P09), 20 rows per page, skeleton 8 rows, empty and no-results states. Below 768 px each row becomes a labeled card list. Column specs are in file 04 |
| A05 | **KpiTile** | Label, big number (28 px, tabular), delta hint only if computable, whole tile links to the filtered list. States: loading skeleton, zero ("لا شيء بانتظارك" tone success) |
| A06 | **ActionQueue** | Prioritized list across the three domains: type chip, title, age, next-actor chip, "فتح" link. Max 8 rows + "عرض الكل". Built from `nextActor === 'admin'` in `lib/ui/status.ts` |
| A07 | **ActivityFeed** | `Timeline` of the last 10 events across domains and inbox, each linking to its record |
| A08 | **ConnectionCard** | WhatsApp state chip, last connected time, reconnect/re-authenticate action (opens the existing pairing flow), outbound-sending switch (P05) with confirm Dialog |
| A09 | **StatusStepper** | P18 bound to a lifecycle; current state highlighted; admin-only "change status" menu lists only valid transitions, each confirmed in a Dialog with optional note |
| A10 | **ConfirmDialog** | P08 preset: title, consequence sentence, confirm label naming the action ("إغلاق الصفقة"), never "نعم/لا" |
| A11 | **ImageUploader** | Drop zone + file button. Per image: thumbnail, alt-text field (required), "الصورة الرئيسية" marker, move earlier/later buttons (keyboard reorder), remove. Limits shown up front (types, max size, minimum 1600 px on the long side). Per-file progress and error. Max 8 images |
| A12 | **SpecEditor** | Renders the product's schema-defined attribute fields as a labeled form grid. No free-form key/value rows unless the schema has them |
| A13 | **ConversationList / Row** | Row: avatar (initial in plum-100 circle), name or phone (`<bdi>`), last-message preview (1 line), relative time, unread dot, linked-record chip (طلب / صفقة / جملة). Selected row plum-50 with axis edge. Filter tabs: الكل · غير مقروءة · مرتبطة · غير مرتبطة |
| A14 | **MessageBubble** | Incoming: sand-50 with hairline, start-aligned. Outgoing: plum-900 with sand text, end-aligned. Max width 70%. Footer: time + delivery state icon (queued, sent, delivered, failed). Failed: danger text + "إعادة المحاولة" button. Day separators between days. Non-text message: placeholder bubble "رسالة غير نصية — افتحها من تطبيق واتساب على الهاتف" |
| A15 | **Composer** | Textarea auto-grow to 6 lines, Enter sends, Shift+Enter newline, send button (arrow mirrored), disabled with reason when disconnected or sending is paused or a rate limit is hit; max length counter near the limit; duplicate-submit guard |
| A16 | **LinkedRecordPanel** | Card showing the linked RetailRequest, DealProposal, or WholesaleRequest: reference, summary, `StatusChip`, "فتح السجل". Not linked: "ربط بسجل" opens `RecordPicker`. Linking and unlinking are confirmed and logged |
| A17 | **RecordPicker** | Dialog with type tabs (طلب / صفقة / جملة), search field, result list, single selection |
| A18 | **InboxConnectionBanner** | Full-width `Banner` above the inbox with tone per state: CONNECTED (success, collapsed to a thin line), CONNECTING (progress), DISCONNECTED and ERROR (danger + reconnect action), AUTHENTICATION_REQUIRED (attention + "ربط الحساب"), sending paused (attention, text "الإرسال عبر واتساب متوقف مؤقتاً") |
| A19 | **NegotiationThread** | Shared with the trader portal. Timeline of `NegotiationEntry` records with actor chip (التاجر / الإدارة), action label, content, time. Action bar below with structured actions only (no free chat) |
| A20 | **DetailLayout** | 2 columns ≥ 1024 (main 8 / aside 4), single column below with the aside after the main content |

---

## 4. Trader components (`components/trader/`)

| ID | Component | Spec |
|---|---|---|
| T01 | **TraderShell** | Mobile: topbar (brand, locale, user menu) + bottom tab bar (الرئيسية · الصفقات · الجملة · العروض · حسابي), 64 px, labels always visible, active = plum-900 with axis dot. Desktop: top navigation, content max 1120, centered |
| T02 | **TaskCard** | Large card for the primary tasks (اقترح صفقة, اطلب بالجملة): glyph, title (h3), one-line description, chevron, ≥ 96 px tall |
| T03 | **DealCard** | Mobile list item: reference, summary, `StatusChip`, "بانتظارك" chip when `nextActor === 'trader'`, last activity time |
| T04 | **Wizard** | Step header (n of N + title), progress bar, back/next, final review step, draft kept in `sessionStorage`, submit disabled until valid, leave-confirmation when dirty |
| T05 | **ProductPicker** | Grid of eligible products (compact cards, 2 columns mobile) with `QtyStepper`; selection count in a sticky bar; search and category chips |
| T06 | **BuilderSummaryBar** | Sticky bottom bar: count, "مراجعة وإرسال", opens review Sheet |
| T07 | **QuoteCard** | Shows the admin's quote exactly as entered (no computed totals, no invented discounts): lines, note, validity, and the available actions per lifecycle |

---

## 5. Cross-component rules

- A component never fetches data; pages pass props. Exception: `SearchOverlay` live search and the inbox polling hook.
- No component contains a user-visible string, a hex value, or an arbitrary `text-[…]` size. Use tokens and type roles.
- Every list has loading, empty, and error variants delivered with the component, not left to pages.
- Icon-only controls carry an `aria-label` from the dictionary.
