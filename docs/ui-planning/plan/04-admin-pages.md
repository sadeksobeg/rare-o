# 04 — Admin Panel

Arabic-first with full English parity. Works at 390, 768, 1440 px. Dense but quiet: UI font only, no display type, no motion beyond 160 ms fades. Component IDs refer to file 02.

**Field rule:** where a screen lists fields or columns, they come from `prisma/schema.prisma` and the existing Zod actions. Cursor maps each to the real field and reports any missing one in the Phase 0 list. It never invents a field, a status, or a business rule.

**Status rule:** every status chip, stepper step, and "needs action" decision reads `lib/ui/status.ts`: `{ value → { tone, labelKey, nextActor: 'admin' | 'trader' | 'customer' | 'none' } }`, generated from the schema enums for RetailRequest, DealProposal, WholesaleRequest, and WhatsApp message and link types.

---

## AD-00 — Shell and behaviors

| Aspect | Spec |
|---|---|
| Layout | `AdminShell` (A01). Content max width 1440, padding 16 / 24 / 32 |
| Navigation | Sidebar groups per A01. Unread badge on Inbox. The sidebar auto-collapses to 72 px on the Inbox route |
| Locale | Cookie locale, toggle in the topbar, Arabic default |
| Access | Unauthenticated → login with `returnTo`. Authenticated trader on an admin URL → 403 page "هذا القسم غير متاح لحسابك" with sign-out and a link to their portal |
| Session expiry | Failed authenticated action → toast "انتهت جلستك" and redirect to login with `returnTo`; unsaved form data is not lost silently: the form shows a Banner first |
| Unsaved changes | Any edited form warns before navigation (native `beforeunload` + in-app ConfirmDialog) |
| Destructive actions | Always `ConfirmDialog` naming the action and consequence |
| Feedback | Success toast after save; errors as field messages plus a top Banner for server errors |
| Last updated | Detail pages show "آخر تحديث {relative time}" |

---

## AD-01 — Login `/admin/login`

Full-page `.ro-inverse` background with faint rings. Centered card 420 px (sand-50): brand mark, h1 "دخول الإدارة", email, password (show/hide toggle), primary "دخول". Errors in a Banner ("البريد أو كلمة المرور غير صحيحة", generic, no account hints). Locale toggle top corner. Loading state on the button. Rate-limit message when applicable. `noindex`.

**Acceptance:** fully Arabic by default; password manager friendly (`autocomplete` attributes); Enter submits; focus lands on the first field.

---

## AD-02 — Dashboard `/admin`

```
┌ PageHeader: "لوحة التحكم" ──────────── [+ إضافة منتج] ┐
│ KPI  KPI  KPI  KPI                                     │
│ ┌ ActionQueue (cols 1–7) ┐ ┌ ConnectionCard (cols 8–12) ┐
│ │ needs your action       │ │ WhatsApp state + switch     │
│ │                         │ ├ Quick actions ──────────────┤
│ │                         │ │ منتج · عرض · حساب تاجر       │
│ └─────────────────────────┘ └─────────────────────────────┘
│ ActivityFeed (full width)                                  │
└────────────────────────────────────────────────────────────┘
```

| KPI | Definition | Links to |
|---|---|---|
| طلبات جديدة | RetailRequests whose status has `nextActor = admin` | Requests filtered |
| صفقات بانتظار الرد | DealProposals with `nextActor = admin` | Deals filtered |
| طلبات جملة بانتظار الرد | WholesaleRequests with `nextActor = admin` | Wholesale filtered |
| محادثات غير مقروءة | Conversations with unread > 0 | Inbox, unread tab |

KPI states: loading skeleton; zero shows "لا شيء بانتظارك" with success tone. No charts, no invented metrics. The ActionQueue merges the three domains sorted by age (oldest first), max 8 rows. Mobile: KPIs 2 × 2, then the connection card, then the queue, then the feed.

**Acceptance:** a new retail request appears in the KPI and queue within one refresh; each KPI count equals the filtered list count; the page is usable at 390 px with no horizontal scroll.

---

## AD-03 — Inbox `/admin/inbox` and `/admin/inbox/[id]`

### Desktop (≥ 1280)

```
┌ InboxConnectionBanner ────────────────────────────────────────────┐
│ ConversationList (340) │ Thread (flex)            │ Context (320)  │
│ filter tabs            │ header: name, phone,     │ LinkedRecord   │
│ rows…                  │   chip, info toggle      │ Panel          │
│                        │ messages (scroll)        │ Customer card  │
│                        │ Composer                 │ (if matched)   │
└────────────────────────┴──────────────────────────┴────────────────┘
```

| Width | Behavior |
|---|---|
| 1024–1279 | Context panel becomes a drawer opened from the thread header |
| < 1024 | Two screens: list → thread (back button). Context opens as a bottom Sheet. Composer pinned with safe-area padding and `visualViewport` handling for the keyboard |

| Aspect | Spec |
|---|---|
| List | A13. Newest first. Tabs: الكل · غير مقروءة · مرتبطة · غير مرتبطة. Search by name or phone |
| Thread | A14 messages. Scroll sticks to the bottom only if the user is at the bottom; otherwise a pill "رسائل جديدة ↓" appears. Day separators. Message arrival within 5 s of persistence (existing polling or push) |
| Composer | A15. Text only. Disabled reasons: "الواتساب غير متصل" · "الإرسال متوقف مؤقتاً" · "تم بلوغ حد الإرسال، حاول بعد قليل" |
| Linking | A16/A17. A conversation may link to exactly one RetailRequest, DealProposal, or WholesaleRequest. The linked record shows its own status chip. Linking never changes the record's status |
| Banner | A18, all five connection states |
| Media | Non-text messages show the placeholder bubble; no media viewer in v1 |

**States:** empty list ("لا محادثات بعد"), empty thread, loading skeletons, failed send (inline retry), disconnected (composer disabled, banner), unknown sender (shows phone only).

**Acceptance:** reply to a conversation at 390 px with no horizontal scroll; unread badge clears on open; a failed message can be retried exactly once per click and never duplicates; RTL bubble alignment mirrors correctly; a message containing Latin text, a URL, and Arabic renders in correct order using `<bdi>`.

---

## AD-04 — Retail requests `/admin/requests`, `/[id]`

**List** (A04, default sort: newest)

| Column | Notes |
|---|---|
| المرجع | Reference, link |
| العميل | Name + `<bdi>` phone |
| القطع | Item count (plural-aware) |
| الحالة | StatusChip |
| التحويل | Handoff state (sent / opened / none) from `RetailHandoffEvent` |
| التاريخ | Created, relative with absolute title |

Filters: status tabs (الكل + one per status group), search (reference, name, phone), date range.

**Detail** (A20)

| Zone | Content |
|---|---|
| Header | Reference, StatusChip, "تغيير الحالة" menu (A09, valid transitions only), "فتح المحادثة" when linked |
| Main | Items table (thumb, name, qty), customer note, customer card (link to AD-10) |
| Aside | Handoff events `Timeline`, linked conversation panel (A16), created/updated meta |

**Acceptance:** a status change updates the chip, stepper, and timeline without a full reload; an invalid transition is never offered.

---

## AD-05 — Deals `/admin/deals`, `/[id]`

**List columns:** reference, trader, subject (from proposal), status chip, "بانتظارك" attention chip when `nextActor = admin`, last activity, linked conversation icon. Filters: status tabs, trader, search.

**Detail** (A20): header (reference, trader link, StatusChip, status menu). Main: proposal summary (`KeyValueList`: products and quantities, proposed terms, note), then `NegotiationThread` (A19) with the structured action bar (only the actions valid for the current state: accept, counter with fields, close, as the schema defines). Aside: trader card, linked conversation panel, timeline of lifecycle events.

**Rules:** WhatsApp text never becomes an action. An accepted deal does not create a product or a public offer automatically; if the existing workflow offers "نشر كعرض", it appears as an explicit button with a ConfirmDialog.

**Acceptance:** the thread shows both actors with correct chips; a counter requires its mandatory fields; closing requires confirmation.

---

## AD-06 — Wholesale `/admin/wholesale`, `/[id]`

**List columns:** reference, trader, line count, status chip, "بانتظارك" chip, created, shipping state.

**Detail** (A20): header with StatusChip + status menu. Main: lines table (product, quantity), quote section (admin-entered text and lines exactly as the schema stores them; no computed totals, no invented discounts, MOQ, or tiers), shipping block (carrier, tracking reference, shipped date, per schema), events `Timeline`. Aside: trader card, linked conversation panel, `StatusStepper`.

**Acceptance:** entering a tracking reference shows it on the trader's request page; every lifecycle step shown in the stepper exists in the schema.

---

## AD-07 — Products `/admin/products`, `/new`, `/[id]`

**List columns:** thumbnail (plate `compact` if none), name, category, price (or "—"), status chip (draft / published / archived), availability, updated. Filters: status tabs, category, search. Row actions: edit, publish or unpublish, archive.

**Form** (A20: main 8 / aside 4)

| Zone | Fields |
|---|---|
| Main | Name AR/EN (tabbed editor with a completeness dot per language), slug (auto from the name, editable, uniqueness validated), description AR/EN, `SpecEditor` (A12), `ImageUploader` (A11) |
| Aside | Status (select with chip), availability (switch), category (select), price + currency (optional; helper "اتركه فارغاً ليظهر: السعر عند الطلب"), featured toggle if the schema has it, link "معاينة في المتجر" (new tab) |
| Footer | Sticky save bar: "حفظ" (primary), "إلغاء", unsaved indicator |

**Rules:** publishing requires at least one image and the Arabic name; if missing, the publish control is disabled with the reason beside it. Uploads validate type, size, and minimum 1600 px on the long side before upload.

**Acceptance:** an image uploaded here appears on the catalog card and the PDP immediately (this closes audit finding R1); keyboard reordering of images works; slug collision shows an inline error.

---

## AD-08 — Categories `/admin/categories`

Table (name AR/EN, slug, product count, order) with move up/down buttons. Create and edit in a Dialog (md): names AR/EN, slug, optional image. Delete is disabled when products exist, with the reason shown ("لا يمكن الحذف: تحتوي على {n} قطعة").

## AD-09 — Offers `/admin/offers`, `/new`, `/[id]`

**List columns:** title, status chip (draft / published / unpublished), validity, product count, updated. **Form:** title AR/EN, slug, summary, description, image, included products (RecordPicker multi-select, if the schema links products), validity dates (optional), status, "معاينة" link. Publishing requires title (AR), summary, and an image or the Material Plate acknowledged by a checkbox.

## AD-10 — Customers `/admin/customers`

CRM list: name, phone, request count, last request, created. Search by name or phone. Detail: contact card, requests table (links to AD-04), linked conversations, internal note (if the schema has one). No customer accounts exist and none are implied by the UI.

## AD-11 — Traders `/admin/traders`

**List columns:** name/company, contact, status chip (active / disabled), last sign-in, deals count, wholesale count.

| Action | Spec |
|---|---|
| إضافة تاجر | Dialog (md): name, company, phone, sign-in identifier, temporary password generated and shown **once** with a copy button and an explicit "تم النسخ" confirmation before closing |
| تعطيل / تفعيل | ConfirmDialog stating the consequence (the trader cannot sign in; open records stay visible) |
| إعادة تعيين كلمة المرور | ConfirmDialog, then the same show-once pattern |
| Detail drawer | Recent deals and wholesale requests with links |

There is no trader self-registration anywhere (business boundary).

---

## Admin acceptance addendum

- Every list: loading, empty, no-results, error, and mobile card layout verified.
- Every form: validation, saving, saved, failed, and unsaved-leave states verified.
- Task checks: process a retail request from the dashboard to a closed state in ≤ 5 clicks; publish a product with images in ≤ 3 minutes; reply on mobile with the keyboard open without losing the composer.
- No hard-coded English remains in the shell, nav, or any admin screen.
