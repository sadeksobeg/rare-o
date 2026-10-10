# RARE OUD — UI Plan v1.0 (LOCKED)

**Project:** Project B (`rare-oud-platform`) — storefront, admin panel, trader portal
**Status:** Locked. Every ambiguous point is resolved in the Decision Lock below. Implementation follows this plan; deviations go through the change policy in §6.
**Location in repo:** `docs/ui-planning/plan/` (files `00` to `07`)

---

## 1. ملخص تنفيذي (للمراجعة مع العميل)

**ما هذه الخطة:** مرجع واحد مقفل لكل واجهات المنصة: المتجر العام، لوحة الإدارة، وبوابة التاجر. يغطي نظام التصميم، المكوّنات، كل شاشة بحالاتها، اللغتين العربية والإنجليزية، الوصولية، الأداء، السيو، وخطة التنفيذ على ملفات المشروع الفعلية.

**الاتجاه البصري: «فخامة هادئة تقودها الحرفة».** مستمد من تشريح شعار RARE OUD (المادة النادرة، الحرفة، الرنين، الإرث). تحوّلت العناصر الأربعة إلى ثلاث بصمات بصرية تتكرر في كل الواجهات:
- **حلقات الرنين:** دوائر متحدة المركز تُشبه وردة العود وتتحرك ببطء كصدى الصوت.
- **خطوط الخشب:** عروق دقيقة تفصل الأقسام وتملأ الصور الناقصة بدل المربعات الفارغة.
- **المحور العمودي:** خط رفيع واحد يمثل الدقة الهندسية في قلب التصميم.

**أهم القرارات:**
- الألوان: الأسود المائل للبنفسجي، البنفسجي الداكن، الكريمي (المعتمدة)، مع لمسة كهرمانية نادرة (راتنج العود) لا تتجاوز 2% من المساحة.
- الخطوط: Amiri للعناوين العربية، IBM Plex Sans Arabic للواجهة، Cormorant Garamond وSource Sans 3 للاتينية.
- لا دفع إلكتروني في أي مكان: نستخدم عبارة «قائمة الطلب» بدل «السلة»، وشرحاً من ثلاث خطوات يوضح التحويل إلى واتساب.
- السعر المفقود يظهر «السعر عند الطلب».
- الأرقام لاتينية (0-9) في كل اللغات.
- العربية أولاً لكل الأدوار الثلاثة، وبوابة التاجر مصمَّمة للهاتف أولاً.
- صندوق واتساب في الإدارة: ثلاثة أعمدة على الحاسوب، وعمود واحد متدرّج على الهاتف.

**ما يحتاجه المشروع منكم قبل الإطلاق (لا يؤثر على الخطة نفسها):** نسخة SVG نظيفة من الشعار، صور المنتجات الحقيقية بالمواصفات في الملف 01، ونصوص التحرير النهائية.

---

## 2. Inputs this plan is built on

| Input | Source |
|---|---|
| As-built audit (routes, components, tokens, debt) | `docs/ui-planning/00-as-built-report.md` |
| Owner answers Q1–Q35 | Stage B reply |
| Contractual scope (no prices) | `docs/scope/cost-breakdown-scope.md` |
| Brand identity case study (Resonant Core emblem) | owner-supplied image |
| Business boundaries | Weeks 1–4 rules (no payment, traders own no products, three separate domains, WhatsApp via Baileys adapter) |

**Visual evidence waiver:** the owner rejected the current UI's visual quality. Screenshots of it are therefore not a reference and are not required. The as-built report remains the source of truth for structure, routes, data, and states.

---

## 3. Design parameters (the plan holds across the whole range)

| Parameter | Planning value | Design must hold for |
|---|---|---|
| Launch catalog | 8 products, 2 categories, 0–2 offers | 0 → 300 products |
| Real product photography at launch | ~25% of SKUs | 0% → 100% (Material Plate placeholder system, file 01 §10) |
| Admin users | 2 | up to 5 |
| WhatsApp volume | ≤ 30 conversations/day | up to ~150/day (list virtualization not needed below 500 rows) |
| Admin device split | 60% desktop / 40% mobile | both fully functional |
| Retail traffic | mostly mobile, weak or intermittent networks | assume slow 4G, Save-Data possible |
| Trader priority | highest design investment per user | despite low traffic |
| Locales | Arabic (default), English | all three roles |

---

## 4. Decision Lock

| # | Decision | Value |
|---|---|---|
| D1 | Creative direction | Quiet luxury, craft-led; three motifs (rings, grain, axis) |
| D2 | Theme | Light canvas for storefront and trader; admin = ink sidebar + light content. No user-selectable dark mode in v1. Dark sections (hero, trader band, footer) are part of the design |
| D3 | Palette | Ink / Sand / Plum + Amber accent (≤ 2% area, never body text on light); semantic tones in file 01 §3 |
| D4 | Fonts | Cormorant Garamond (Latin display), Amiri (Arabic display), Source Sans 3 (Latin UI), IBM Plex Sans Arabic (Arabic UI). Remove Noto Naskh Arabic and Noto Sans Arabic |
| D5 | Numerals | Western digits (`latn`) in all locales |
| D6 | Missing price | "السعر عند الطلب" / "Price on request" |
| D7 | Naming | UI says "Request list / قائمة الطلب". Route stays `/cart` |
| D8 | Payment cues | None anywhere (words, icons, badges). A 3-step explainer shows the WhatsApp handoff |
| D9 | Discovery extras | Compare: off (feature-flagged, code kept dormant). Quick view: desktop only. Search overlay: kept |
| D10 | Catalog filters | Top filter bar (type, price, sort). Mobile: bottom sheet |
| D11 | Locale URLs | Storefront: Arabic at `/`, English at `/en/…`, with hreflang. Admin and trader: cookie locale, no prefix |
| D12 | Admin shell | Persistent sidebar (264 px, collapsible to 72 px); mobile drawer. Inbox: 3 panes desktop, stacked on mobile |
| D13 | Trader portal | Mobile-first with bottom tab bar; wizards for deal proposal and wholesale request |
| D14 | Status system | 7 semantic tones; one mapping file `lib/ui/status.ts` |
| D15 | Icons | `lucide-react` (stroke 1.5) + 6 custom brand glyphs. Only new runtime dependency |
| D16 | Motion | Signature in storefront hero and reveals; subtle in trader; admin ≤ 160 ms transitions. Reduced-motion and Save-Data respected |
| D17 | Images | `next/image` mandatory; product ratio 4:5; AVIF/WebP |
| D18 | Radii | 2 (media), 4 (controls, cards), 8 (dialogs), 16 (sheet top) |
| D19 | Elevation | Lightness + hairlines first; three shadows only |
| D20 | Admin dashboard | No charts. KPI counts + action queue + activity feed + connection card |
| D21 | Accessibility | WCAG 2.2 AA for all roles; body text contrast ≥ 7:1 |
| D22 | Overlays | Native `<dialog>` and Popover API. No UI kit dependency |
| D23 | SEO | Indexable: home, catalog, product, offers, contact, privacy. Everything else `noindex` |
| D24 | Design gallery | Dev-only route `/dev/ui` (404 in production) showing every component state in AR/EN |
| D25 | Legal | Privacy + contact pages. No cookie banner (only strictly necessary cookies) |
| D26 | Logo | SVG redraw is a launch deliverable (file 01 §10). PNG used until delivered |

---

## 5. Change-surface map (where to change what, so edits stay small)

| If the client wants to change… | Edit only |
|---|---|
| Colors, radii, shadows, spacing | `app/globals.css` token block |
| Fonts or type scale | `app/layout.tsx` + type tokens in `app/globals.css` |
| Any visible text | `lib/i18n/dictionaries.ts` (no strings in components) |
| Status colors or labels | `lib/ui/status.ts` + dictionary |
| Navigation items | `lib/nav.ts` |
| SEO titles, descriptions, JSON-LD | `lib/seo.ts` |
| Imagery | `public/brand/**` and product uploads |
| Motion intensity | motion tokens in `app/globals.css` |

---

## 6. Change policy

1. Visual or copy changes that fit the change-surface map above: free, no re-approval.
2. Anything that adds a screen, field, flow, library, or role: requires an explicit scope decision, because it touches the contractual scope.
3. Any conflict between this plan and the code is reported in the Phase 0 reconciliation list (file 07) before work starts. The plan is not edited silently.

---

## 7. Reading order

| File | Contents | Needed for phase |
|---|---|---|
| `01-foundations.md` | Direction, tokens, type, grid, motion, imagery | P1 |
| `02-components.md` | Component specs and states | P2–P3 |
| `03-storefront-pages.md` | Every public screen | P4 |
| `04-admin-pages.md` | Admin shell and every admin screen | P5 |
| `05-trader-pages.md` | Trader portal | P6 |
| `06-cross-cutting.md` | i18n/RTL, microcopy, a11y, performance, SEO, states | all |
| `07-implementation.md` | Phases mapped to files, acceptance, Cursor prompts | all |
