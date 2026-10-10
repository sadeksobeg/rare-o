# 05 — Trader Portal

The trader portal is the highest design investment per user, because dealing with traders is the client's most important requirement. It is Arabic-first (English parity), mobile-first, and organized around three tasks: see what is waiting for me, propose a deal, request wholesale.

**Business boundaries (binding):** a trader owns no products, inventory, storefront, sales, or commission. A trader proposes deals or requests wholesale against the client's own stock. There is no self-registration, no payment, and no invented pricing, MOQ, discounts, or shipping rates. WhatsApp text never changes a deal or wholesale status.

**Personality:** same tokens as the storefront, calmer and more personal than admin. Page titles use the display font (h2 size), cards are large, spacing is generous (20 / 24 px), grain dividers between groups. Component IDs refer to file 02. Fields come from the existing Zod actions and schema; Cursor reports any missing field and never invents one.

Status handling follows file 04: `lib/ui/status.ts` supplies tone, label, and `nextActor`. "بانتظارك" (waiting on you) is derived from `nextActor === 'trader'`.

---

## TR-00 — Shell and behaviors

| Aspect | Spec |
|---|---|
| Layout | `TraderShell` (T01): topbar + bottom tab bar on mobile; top navigation on desktop; content max 1120 |
| Tabs | الرئيسية · الصفقات · الجملة · العروض · حسابي. Deals and Wholesale tabs show a dot when something is waiting on the trader |
| Access | Unauthenticated → `/trader/login` with `returnTo`. Admin account on a trader URL → 403 page |
| Session expiry | Same pattern as admin (toast + redirect with `returnTo`) |
| Network | Failed submit keeps all entered data and shows a retry Banner. Wizard drafts persist in `sessionStorage` |
| Locale | Arabic default, toggle in the topbar |

---

## TR-01 — Login `/trader/login`

Same structure as AD-01 with the h1 "دخول التجار" and a help link under the form: "لا تملك حساباً؟ اطلب حساب تاجر" (opens the WhatsApp handoff with a prefilled message). Errors are generic. `noindex`.

---

## TR-02 — Home `/trader`

Mobile order:

| # | Block | Spec |
|---|---|---|
| 1 | Greeting | "أهلاً، {name}" (h2, display font) + one line of context |
| 2 | **بانتظارك** | List of `DealCard` / wholesale rows where `nextActor = trader`. If none: success-toned line "لا شيء بانتظارك الآن" |
| 3 | Primary tasks | Two `TaskCard`s: "اقترح صفقة" → `/trader/deals/new`; "اطلب بالجملة" → `/trader/wholesale` |
| 4 | الصفقات المتاحة الآن | Horizontal scroll of up to 4 `OfferCard`s (compact) + link "عرض الكل" → `/trader/offers`. Hidden when no published offers |
| 5 | نشاطي الأخير | Last 5 events across deals and wholesale as a `Timeline` |

Desktop: blocks 2 and 3 side by side (cols 1–7 / 8–12), then blocks 4 and 5 stacked.

**States:** loading skeleton per block; error ErrorState per block (one failing block does not blank the page).

**Acceptance:** with 0 records the page still reads as complete (empty variants, no blank areas); the first screen at 390 px shows the greeting, the waiting block, and both task cards without scrolling past two screens.

---

## TR-03 — Deals `/trader/deals`

Mobile: `DealCard` list. Desktop: table (reference, subject, status chip, "بانتظارك" chip, last activity). Status tabs: الكل · بانتظاري · قيد التفاوض · مغلقة. Primary action "اقترح صفقة" (top end on desktop, floating button above the tab bar on mobile). Empty: "لم تقترح أي صفقة بعد" + "اقترح صفقة".

## TR-04 — New deal `/trader/deals/new`

`Wizard` (T04). Steps and labels: **1 الطلب** (what is proposed) · **2 الشروط** (terms and note) · **3 المراجعة**. Fields map to the existing DealProposal schema. If the schema yields fewer than four fields in total, collapse to one page plus a review Sheet. Never add fields.

| Behavior | Spec |
|---|---|
| Validation | Per step before "التالي", inline messages, error summary |
| Draft | Autosaved in `sessionStorage`; leaving while dirty asks for confirmation |
| Review | Read-only summary with "تعديل" links per step |
| Submit | Loading state, then navigates to the new deal's detail with a success toast "أُرسلت صفقتك إلى الإدارة" |
| Failure | Banner + retry, data kept |
| Optional prefill | Arriving from an offer card prefills only the subject with the offer title |

**Acceptance:** a phone user completes a proposal one-handed in ≤ 2 minutes; every error is reachable by keyboard and announced.

## TR-05 — Deal detail `/trader/deals/[id]`

| Zone | Content |
|---|---|
| Top | Reference, `StatusChip`, Banner "بانتظارك" when `nextActor = trader` (attention tone) |
| Summary | `KeyValueList` of the proposal |
| Negotiation | `NegotiationThread` (A19) with the trader's action bar offering only the actions valid for the current state (as the schema defines) |
| Lifecycle | `StatusStepper` and a short `Timeline` |
| Visibility | A trader sees only their own deals (ownership enforced server-side; the UI never shows another trader's data, and a foreign id returns `notFound()`) |

Actions use ConfirmDialog naming the consequence (e.g., "قبول العرض"). There is no free chat.

---

## TR-06 — Wholesale request builder `/trader/wholesale`

| Zone | Spec |
|---|---|
| Header | h2 "طلب بالجملة", one line: "اختر القطع والكميات من مخزون RARE OUD". Link "طلباتي" → `/trader/wholesale/requests` |
| Picker | `ProductPicker` (T05) listing only eligible products (as the existing logic defines). Search + category chips. **No prices shown** (the quote comes from the client) |
| Quantities | `QtyStepper` per line with the existing quantity limit; exceeding it shows an inline error "الكمية القصوى لكل قطعة {n}" |
| Summary | `BuilderSummaryBar` (T06) → review Sheet: lines, optional note, "إرسال الطلب" |
| Success | Navigates to the request detail with toast "أُرسل طلبك. سنراجعه ونعود إليك." |

**States:** no eligible products (EmptyState "لا توجد قطع متاحة للطلب حالياً"), loading, error.

## TR-07 — Wholesale requests `/trader/wholesale/requests`

List like TR-03 with columns: reference, line count, status chip, "بانتظارك" chip, created. Tabs: الكل · بانتظاري · قيد التنفيذ · مكتملة. Empty: "لا طلبات جملة بعد" + "ابدأ طلباً".

## TR-08 — Wholesale detail `/trader/wholesale/[id]`

| Zone | Content |
|---|---|
| Top | Reference, `StatusChip`, "بانتظارك" Banner when relevant |
| Lines | Read-only lines table |
| Quote | `QuoteCard` (T07): shows the client's quote exactly as entered, with the actions valid for the current state. No totals are computed, no discounts inferred |
| Shipping | Carrier, tracking reference, shipped date once the client enters them (read-only) |
| Lifecycle | `StatusStepper` + `Timeline` of events |

Ownership enforced as in TR-05.

---

## TR-09 — Offers `/trader/offers`

Cards (`OfferCard`, 1 column mobile, 2 desktop) of published offers: title, summary, validity, image or plate. Each card: "التفاصيل" (opens the public offer page) and "اقترح صفقة" (prefills the subject only). Empty: "لا عروض متاحة حالياً".

## TR-10 — Profile `/trader/profile`

Read-only details (name, company, phone, sign-in identifier), the locale switch, and sign out. Editing and password change follow what the existing profile page supports; if nothing is editable, show the note "لتعديل بياناتك تواصل مع الإدارة" with a WhatsApp link.

---

## Trader acceptance addendum

- All screens verified at 390 px first, then 768 and 1440, in Arabic and English.
- Zero hard-coded English; zero horizontal scroll; every touch target ≥ 44 px.
- A trader can never see or reach another trader's records (UI shows `notFound()`, never a hint that the record exists).
- Waiting-on-you items are surfaced on Home, on the tab dots, and inside each list.
- Offline or failed submit never loses entered data.
