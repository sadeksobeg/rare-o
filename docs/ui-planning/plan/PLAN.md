# RARE OUD — الخطة الكاملة + دليل التشغيل (ملف واحد)

**هذا الملف واحد فقط، وفيه كل شيء.**
- **الجزء A (لك):** دليل خطوة بخطوة، وفي كل خطوة البرومبت الجاهز الذي تلصقه لكورسر.
- **الجزء B (لكورسر):** الخطة الكاملة، الأجزاء 00 إلى 07، وملحق النطاق S.

## الإعداد (مرة واحدة، 3 دقائق)

1. انسخ هذا الملف إلى مجلد المشروع باسم **`docs/ui-planning/plan/PLAN.md`**.
2. افتح **محادثة واحدة** في كورسر، وأكمل البرنامج كله فيها. إن فتحت محادثة جديدة، الصق كتلة «القواعد الدائمة» أدناه أولاً.
3. لا ترسل أكثر من برومبت واحد في كل مرة، ولا تنتقل لخطوة قبل مراجعة التي قبلها.

> في هذه النسخة: كلمة «ملف NN» داخل الخطة تعني «الجزء NN»، وكلمة «ملفات الخطة» تعني هذا الملف.

## القواعد الدائمة (تُلصق مرة في الخطوة 3، وتُعاد فقط إذا فتحت محادثة جديدة)

```
STANDING RULES (apply to every phase until I say otherwise)
- Source of truth: docs/ui-planning/plan/PLAN.md. Do not edit it. Parts 00-07 are the plan; Appendix S is the contractual scope.
- Follow the Decision Lock (Part 00). Anything outside it: report, do not decide.
- Never invent fields, statuses, routes, features, prices, MOQ, discounts, or shipping rates. If the schema lacks something, report it.
- Business boundaries: no payment anywhere; traders own nothing; RetailRequest / DealProposal+NegotiationEntry+PublicCuratedOffer / WholesaleRequest stay separate; no generic Order; WhatsApp only through the Baileys adapter; WhatsApp text never changes a business status.
- Only new dependency allowed: lucide-react. Use native <dialog> and the Popover API.
- Every string from the dictionary (Arabic and English). Only design tokens for color, type, and spacing. Logical CSS properties only.
- Quality gate per slice: npm run lint, tsc --noEmit, next build, scripts/check-i18n.ts, and the universal checklist (Part 06, section 8).
- Report format: files changed; checklist results; screenshots to capture (390 / 768 / 1440, Arabic and English); open issues. Then STOP and wait for my approval.
- Do not touch Project A.
```

## جدول الخطوات

| # | الخطوة | النوع |
|---|---|---|
| 1 | إصلاح العيوب الظاهرة | برومبت |
| 2 | قرار الترويج والخصومات | أنت |
| 3 | المرحلة 0: المطابقة (بلا كود) | برومبت |
| 4 | اعتماد التعارضات وجدول الحالات | أنت |
| 5–7 | P1 الأساسات، P2 المكوّنات، P3 الهيكل | برومبت لكل مرحلة |
| 8–11 | P4a–P4d المتجر | برومبت لكل شريحة |
| 12–16 | P5a–P5e الإدارة | برومبت لكل شريحة |
| 17–19 | P6a–P6c بوابة التاجر | برومبت لكل شريحة |
| 20 | P7 الصقل النهائي | برومبت |
| 21 | P8 حزمة المراجعة للعميل | برومبت |

---

## الخطوة 1 — إصلاح العيوب الظاهرة

**من ينفّذ:** أنت ترسل، وكورسر ينفّذ

**كورسر يقرأ:** الجزء 01 قسم 3.4 فقط (أزواج الألوان المعتمدة)

**أرسل هذا:**

```
MODE: corrective pass. Do NOT redesign anything.

FIRST: confirm docs/ui-planning/plan/PLAN.md exists. Create docs/scope/cost-breakdown-scope.md from Appendix S at the end of PLAN.md, verbatim. Read only Part 01, section 3.4.

FIX THESE VISIBLE DEFECTS ONLY:
1. Admin dashboard: an empty black rectangle at the top start (a button with no visible label). Label it "إضافة منتج" with the primary style.
2. Admin WhatsApp card: never show raw technical text (worker messages, env variable names). Map each connection state to a plain Arabic/English message from the dictionary. Technical detail goes to logs only.
3. Storefront prices: remove the word "TEST". Format by the product currency; if there is none, show "السعر عند الطلب".
4. Show the brand mark once (header and hero currently repeat it). Fix the broken footer logo image.
5. Contrast: the trader band subtitle and the "ندرة" paragraph are unreadable. Use only the approved color pairs from Part 01, section 3.4.
6. The sticky shortcuts bar must not overlay content with transparency.
7. Hide test records (e.g. "Regression Customer") from the UI. Keep them in the dev seed only.

THEN list every feature added beyond docs/scope/cost-breakdown-scope.md (Promos, compareAtPrice, discount badges). Do not decide: wait for my answer on each (keep / hide / remove).

Report with before/after screenshots, then STOP. No other changes. Do not touch Project A. No new dependencies.
```

**راجع قبل الموافقة:** افتح الموقع وتأكد أن العيوب السبعة اختفت (المربع الأسود، النص التقني، كلمة TEST، تكرار الشعار، النص الباهت، الشريط اللاصق، البيانات التجريبية).

---

## الخطوة 2 — قرار الترويج والخصومات

**من ينفّذ:** أنت

**أرسل هذا:**

```
Decision on the extra features: HIDE Promos, compareAtPrice, and discount badges from every user-facing and admin screen behind a configuration flag (default off). Keep the code and data. Report when done, then STOP.
```

**راجع قبل الموافقة:** توصيتي «hide» لأنها خارج بنود العقد. تظهر لاحقاً كإضافة مجانية إن أردت.

---

## الخطوة 3 — المرحلة 0: المطابقة (بلا كود)

**من ينفّذ:** كورسر

**كورسر يقرأ:** الأجزاء 00 إلى 07 والملحق S كاملة

**أرسل هذا:**

```
STANDING RULES (apply to every phase until I say otherwise)
- Source of truth: docs/ui-planning/plan/PLAN.md. Do not edit it. Parts 00-07 are the plan; Appendix S is the contractual scope.
- Follow the Decision Lock (Part 00). Anything outside it: report, do not decide.
- Never invent fields, statuses, routes, features, prices, MOQ, discounts, or shipping rates. If the schema lacks something, report it.
- Business boundaries: no payment anywhere; traders own nothing; RetailRequest / DealProposal+NegotiationEntry+PublicCuratedOffer / WholesaleRequest stay separate; no generic Order; WhatsApp only through the Baileys adapter; WhatsApp text never changes a business status.
- Only new dependency allowed: lucide-react. Use native <dialog> and the Popover API.
- Every string from the dictionary (Arabic and English). Only design tokens for color, type, and spacing. Logical CSS properties only.
- Quality gate per slice: npm run lint, tsc --noEmit, next build, scripts/check-i18n.ts, and the universal checklist (Part 06, section 8).
- Report format: files changed; checklist results; screenshots to capture (390 / 768 / 1440, Arabic and English); open issues. Then STOP and wait for my approval.
- Do not touch Project A.

ROLE
You are the Principal Frontend Engineer implementing the locked UI plan for Project B (D:\N I G H T\rare-oud-platform).

TASK (Phase 0 only, no code)
Read PLAN.md Parts 00-07 and Appendix S fully. Do not edit it.
Produce docs/ui-planning/plan/RECONCILIATION.md exactly as specified in Part 07, section P0: routes and paths check, schema fields behind every column and form field, the draft lib/ui/status.ts table (tone, labelKey, nextActor proposed for each enum value), data availability (dashboard counts, unread counts, activity source, WhatsApp connection state, outbound-pause flag), the image model, the middleware design for locale routing and 403, and a conflict list with a proposed minimal resolution for each.
Then STOP and wait.
```

**راجع قبل الموافقة:** ملف RECONCILIATION.md. إن لم تفهم شيئاً فيه، انسخه وأرسله لي.

---

## الخطوة 4 — اعتماد التعارضات وجدول الحالات

**من ينفّذ:** أنت

**أرسل هذا:**

```
Approved: the conflict resolutions and the status table in RECONCILIATION.md, as proposed. Record each resolution in Part 00 Decision Lock as D27 and onward inside a new file docs/ui-planning/plan/DECISIONS-ADDENDUM.md (do not edit PLAN.md). Then STOP.
```

**راجع قبل الموافقة:** اعتمد فقط ما فهمته. أي نقطة غامضة أرسلها لي قبل أن تعتمد.

---

## الخطوة 5 — P1 — Foundations

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 01 (all), 06 sections 1 and 2, 07 (P1)

**أرسل هذا:**

```
START PHASE P1 — Foundations
Read in docs/ui-planning/plan/PLAN.md: Parts 01 (all), 06 sections 1 and 2, 07 (P1).
Scope: all actions of Phase P1 in Part 07. Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** افتح /dev/ui: الألوان، الخطوط العربية والإنجليزية، الحلقات والخطوط. إن بدا الخط العربي صغيراً أو كبيراً قل له يضبط `--ro-display-scale` أو `--ro-ui-scale` فقط.

---

## الخطوة 6 — P2 — Primitives and states

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 02 (sections 0 and 1), 06 section 7, 07 (P2)

**أرسل هذا:**

```
START PHASE P2 — Primitives and states
Read in docs/ui-planning/plan/PLAN.md: Parts 02 (sections 0 and 1), 06 section 7, 07 (P2).
Scope: all actions of Phase P2 in Part 07. Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** افتح /dev/ui: كل المكوّنات بحالاتها بالعربي والإنجليزي. اعتمد المعرض وجدول الحالات قبل أي صفحة.

---

## الخطوة 7 — P3 — Chrome, system pages, routing

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 02 (S01-S05, S24, A01, T01), 03 (SF-10), 04 (AD-00), 05 (TR-00), 06 section 1.3, 07 (P3)

**أرسل هذا:**

```
START PHASE P3 — Chrome, system pages, routing
Read in docs/ui-planning/plan/PLAN.md: Parts 02 (S01-S05, S24, A01, T01), 03 (SF-10), 04 (AD-00), 05 (TR-00), 06 section 1.3, 07 (P3).
Scope: all actions of Phase P3 in Part 07. Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** تنقّل بين المتجر والإدارة والتاجر، بدّل اللغة، وجرّب فتح رابط إدارة بحساب تاجر (يجب أن تظهر صفحة 403).

---

## الخطوة 8 — P4a — Storefront slice a

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 02 (S06-S12, S25), 03 (SF-02, SF-03), 06 sections 2 and 3

**أرسل هذا:**

```
START PHASE P4a — Storefront slice a
Read in docs/ui-planning/plan/PLAN.md: Parts 02 (S06-S12, S25), 03 (SF-02, SF-03), 06 sections 2 and 3.
Scope: slice 4a only (ProductCard, ProductGrid, FilterBar, PriceBlock, MaterialPlate, Catalog, Gallery, SpecTable, PDP). Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** قارن مع لوحتي Catalog وProduct. تأكد أن صور المنتجات تظهر في الكتالوج وصفحة القطعة، وأن السعر الفارغ يظهر «السعر عند الطلب».

---

## الخطوة 9 — P4b — Storefront slice b

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 02 (S13-S18), 03 (SF-04, SF-05), 06 section 3

**أرسل هذا:**

```
START PHASE P4b — Storefront slice b
Read in docs/ui-planning/plan/PLAN.md: Parts 02 (S13-S18), 03 (SF-04, SF-05), 06 section 3.
Scope: slice 4b only (request list, request form, success). Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** قارن مع لوحة Request. جرّب الطلب كاملاً حتى واتساب، وأعد تحميل صفحة النجاح (لا يجب أن يتكرر الطلب).

---

## الخطوة 10 — P4c — Storefront slice c

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 02 (S03, S20-S23, S26, S27), 03 (SF-01), 01 section 8

**أرسل هذا:**

```
START PHASE P4c — Storefront slice c
Read in docs/ui-planning/plan/PLAN.md: Parts 02 (S03, S20-S23, S26, S27), 03 (SF-01), 01 section 8.
Scope: slice 4c only (Home, hero, trust strip, editorial, trader band, search overlay, quick view). Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** قارن مع لوحة Home. لا أقسام فارغة، والشعار مرة واحدة، والهيرو واضح على الهاتف.

---

## الخطوة 11 — P4d — Storefront slice d

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 03 (SF-06 to SF-09)

**أرسل هذا:**

```
START PHASE P4d — Storefront slice d
Read in docs/ui-planning/plan/PLAN.md: Parts 03 (SF-06 to SF-09).
Scope: slice 4d only (Offers, Offer detail, Contact, Privacy). Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** قارن مع لوحة Offers.

---

## الخطوة 12 — P5a — Admin slice a

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 04 (AD-01, AD-02), 02 (A05-A08)

**أرسل هذا:**

```
START PHASE P5a — Admin slice a
Read in docs/ui-planning/plan/PLAN.md: Parts 04 (AD-01, AD-02), 02 (A05-A08).
Scope: slice 5a only (Login, Dashboard). Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** قارن مع لوحة AdminDash. لا مربعات فارغة، ولا نص تقني، والأعداد تطابق القوائم.

---

## الخطوة 13 — P5b — Admin slice b

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 04 (AD-03), 02 (A13-A18)

**أرسل هذا:**

```
START PHASE P5b — Admin slice b
Read in docs/ui-planning/plan/PLAN.md: Parts 04 (AD-03), 02 (A13-A18).
Scope: slice 5b only (WhatsApp inbox). Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** قارن مع لوحة Inbox. جرّب الرد على الهاتف، وكل حالات الاتصال الخمس.

---

## الخطوة 14 — P5c — Admin slice c

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 04 (AD-04 to AD-06), 02 (A09, A19, A20)

**أرسل هذا:**

```
START PHASE P5c — Admin slice c
Read in docs/ui-planning/plan/PLAN.md: Parts 04 (AD-04 to AD-06), 02 (A09, A19, A20).
Scope: slice 5c only (Requests, Deals, Wholesale). Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** قارن مع لوحتي AdminRequest وAdminDeal. غيّر حالة طلب وتأكد أنها تُعرض الانتقالات الصالحة فقط.

---

## الخطوة 15 — P5d — Admin slice d

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 04 (AD-07 to AD-09), 02 (A11, A12)

**أرسل هذا:**

```
START PHASE P5d — Admin slice d
Read in docs/ui-planning/plan/PLAN.md: Parts 04 (AD-07 to AD-09), 02 (A11, A12).
Scope: slice 5d only (Products, Categories, Offers). Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** قارن مع لوحة AdminProduct. ارفع صورة وتأكد أنها تظهر في المتجر فوراً.

---

## الخطوة 16 — P5e — Admin slice e

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 04 (AD-10, AD-11)

**أرسل هذا:**

```
START PHASE P5e — Admin slice e
Read in docs/ui-planning/plan/PLAN.md: Parts 04 (AD-10, AD-11).
Scope: slice 5e only (Customers, Traders). Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** أنشئ حساب تاجر وتأكد أن كلمة المرور تظهر مرة واحدة فقط.

---

## الخطوة 17 — P6a — Trader slice a

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 05 (TR-01, TR-02, TR-09, TR-10), 02 (T01-T03)

**أرسل هذا:**

```
START PHASE P6a — Trader slice a
Read in docs/ui-planning/plan/PLAN.md: Parts 05 (TR-01, TR-02, TR-09, TR-10), 02 (T01-T03).
Scope: slice 6a only (Login, Home, Offers, Profile). Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** افتحها على الهاتف أولاً (390). قارن مع لوحة Trader.

---

## الخطوة 18 — P6b — Trader slice b

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 05 (TR-03 to TR-05), 02 (T04, A19)

**أرسل هذا:**

```
START PHASE P6b — Trader slice b
Read in docs/ui-planning/plan/PLAN.md: Parts 05 (TR-03 to TR-05), 02 (T04, A19).
Scope: slice 6b only (Deals list, wizard, detail). Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** أنشئ صفقة بيد واحدة على الهاتف في أقل من دقيقتين.

---

## الخطوة 19 — P6c — Trader slice c

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 05 (TR-06 to TR-08), 02 (T05-T07)

**أرسل هذا:**

```
START PHASE P6c — Trader slice c
Read in docs/ui-planning/plan/PLAN.md: Parts 05 (TR-06 to TR-08), 02 (T05-T07).
Scope: slice 6c only (Wholesale builder, list, detail). Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** قارن مع لوحة Wholesale. لا أسعار في الاختيار، وعرض السعر يظهر كما أدخلته الإدارة.

---

## الخطوة 20 — P7 — Hardening and cleanup

**من ينفّذ:** كورسر

**كورسر يقرأ:** Parts 06 (sections 4-6), 07 (P7)

**أرسل هذا:**

```
START PHASE P7 — Hardening and cleanup
Read in docs/ui-planning/plan/PLAN.md: Parts 06 (sections 4-6), 07 (P7).
Scope: all actions of Phase P7 in Part 07. Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** تقارير Lighthouse، وصفر مشاكل حرجة في axe، وحذف الملفات الميتة.

---

## الخطوة 21 — P8 — Review pack

**من ينفّذ:** كورسر

**كورسر يقرأ:** Part 07 (P8)

**أرسل هذا:**

```
START PHASE P8 — Review pack
Read in docs/ui-planning/plan/PLAN.md: Part 07 (P8).
Scope: all actions of Phase P8 in Part 07. Nothing else.
Apply the STANDING RULES and the quality gate. Compare the result to the matching wireframe boards.
Report in the standard format, then STOP and wait.
```

**راجع قبل الموافقة:** مصفوفة لقطات الشاشة وسكربت العرض للعميل.

---

## حالات الطوارئ

**إذا خالف كورسر الخطة:**
```
STOP. You deviated from PLAN.md ({what}). Re-read Part 00 Decision Lock and the spec for this slice. Revert the deviation, then report what you changed. Do not continue.
```

**إذا اقترح شيئاً جديداً أو أضاف ميزة:**
```
Report it, do not decide. Is it in Appendix S? If not, list it and wait for my answer: keep, hide, or remove.
```

**إذا فتحت محادثة جديدة وضاع السياق:**
```
New session. Read docs/ui-planning/plan/PLAN.md Parts 00 and 07 and RECONCILIATION.md. Then state: the current phase, the last approved slice, and the next slice. Do nothing else until I confirm.
```

**إذا ظهر لك شيء غير مفهوم:** انسخ كلام كورسر وأرسله لي.

---

# الجزء B — الخطة (لكورسر)

> نسخة الملف الواحد: «ملف NN» = «الجزء NN»، و`docs/scope/cost-breakdown-scope.md` = الملحق S في آخر هذا الملف.


---

**[PART 00]**

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


---

**[PART 01]**

# 01 — Foundations

## 1. Creative direction

**"Quiet luxury, craft-led."** The instrument is the hero; the interface recedes. Calm, warm, precise, tactile.

### 1.1 The four brand pillars become four design obligations

| Emblem pillar | Emblem part | UI obligation |
|---|---|---|
| Rare material | Organic black mass | Real material in imagery (macro wood, rosette). No decorative gradients standing in for material |
| Craftsmanship | Straight vertical line | A precise grid, hairlines, one vertical axis motif. Everything aligns |
| Resonance | Fine internal lines | Motion behaves like sound: slow, damped, radiating. Never bouncy |
| Heritage | Circular void (rosette) | Concentric ring motif and Arabic calligraphic display type |

### 1.2 Principles

1. **Instrument first.** Product imagery dominates every commercial screen.
2. **Material honesty.** No stock photos, no fake inventory, no fake metrics.
3. **Precision.** 4 px grid, hairline borders, consistent alignment.
4. **Resonance.** Motion is damped oscillation or radiating rings.
5. **Arabic-first.** Layouts are designed in RTL and mirrored to LTR, not the reverse.
6. **Calm density.** Storefront is airy; admin is dense but quiet.
7. **One next action per screen.** A single primary button.
8. **Honest states.** Loading, empty, error, and offline are designed, not defaults.

### 1.3 What this direction is not (forbidden)

Gold gradients, ornamental arabesque clip-art, stock oud silhouettes, glassmorphism, neon or glow outside the hero, bouncing or elastic easing, emoji in UI, cartoon icons, countdown timers, fake scarcity labels, payment-card icons.

---

## 2. Signature motifs

| Motif | Meaning | Where it appears | Where it must not |
|---|---|---|---|
| **Resonance rings** (concentric circles) | Rosette, sound radiating | Hero visual, empty states, loaders, press ripple, success states | Behind body text; in admin tables |
| **Grain lines** (wavy hairlines) | Wood grain | Section dividers, Material Plate, hero texture at 6% opacity, footer | Over form fields |
| **Axis** (vertical hairline, 1 px) | Craft precision | Hero scroll cue, editorial split divider, admin sidebar active indicator | More than once per screen |

### 2.1 Reference geometry (tune visually in `/dev/ui`, keep proportions)

**Rings** — `viewBox="0 0 400 400"`, circles centered at 200,200 with radii `190, 150, 112, 78, 48, 22`; `fill="none"`, `stroke="currentColor"`, `stroke-width="1"`, `vector-effect="non-scaling-stroke"`, opacities `0.9, 0.7, 0.55, 0.42, 0.32, 0.22`.

**Grain tile** — tileable `240×96`:

```svg
<pattern id="ro-grain" width="240" height="96" patternUnits="userSpaceOnUse">
  <g fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke">
    <path d="M0 12 C40 4,80 20,120 12 S200 4,240 12"/>
    <path d="M0 30 C40 22,90 38,130 30 S210 22,240 30"/>
    <path d="M0 48 C30 40,70 56,120 48 S200 40,240 48"/>
    <path d="M0 66 C50 58,90 74,130 66 S210 58,240 66"/>
    <path d="M0 84 C40 76,80 92,120 84 S200 76,240 84"/>
  </g>
</pattern>
```

Components: `components/brand/rings.tsx`, `components/brand/grain.tsx`, `components/brand/axis.tsx`.

---

## 3. Color

### 3.1 Core palette

| Token | Hex | Role |
|---|---|---|
| `sand-50` | `#FBF6EE` | Raised surfaces (cards, inputs) |
| `sand-100` | `#F4E7D8` | **Canvas (brand cream, approved)** |
| `sand-200` | `#EFE3D4` | Sunken panels (approved "surface") |
| `sand-300` | `#E3D6C5` | Dividers on sunken, neutral chip bg |
| `sand-400` | `#D2C2AC` | Strong divider, skeleton base |
| `ink-950` | `#0B080D` | **Brand near-black**: text, primary button, hero |
| `ink-900` | `#15101A` | Inverse raised surface |
| `ink-800` | `#211A29` | Material Plate, admin sidebar hover |
| `ink-700` | `#332A3C` | Inverse borders on dark panels |
| `ink-600` | `#4B4056` | Secondary text on light |
| `ink-500` | `#5A4F66` | Muted text on light |
| `ink-400` | `#6B6074` | Muted text on raised only |
| `ink-300` | `#A79DB3` | Muted text on dark |
| `ink-200` | `#B9AFC4` | Secondary text on dark |
| `plum-900` | `#32104F` | **Brand deep purple**: links, focus, brand bands |
| `plum-800` | `#3F1962` | Primary button hover |
| `plum-700` | `#52277C` | Link hover |
| `plum-300` | `#C9B2E3` | Accent text on dark |
| `plum-100` | `#E9DDF3` | Info chip bg, selected row |
| `plum-50` | `#F5EFFA` | Subtle selected bg |
| `amber-500` | `#B8863F` | Accent on dark only (hairlines, small glyphs) |
| `amber-400` | `#CFA25E` | Accent on dark, hover |
| `amber-600` | `#8A5A22` | Accent text on light (≥ 14 px, weight 600) |
| `amber-100` | `#F1E0BF` | Attention chip bg |

**Amber rule:** at most 2% of any screen's area. Never `amber-500/400` on light backgrounds (contrast 2.65:1).

### 3.2 Semantic roles

| Role | Light surfaces | Dark surfaces |
|---|---|---|
| Page background | `sand-100` | `ink-950` |
| Raised | `sand-50` | `ink-900` |
| Sunken | `sand-200` | `ink-950` |
| Text | `ink-950` | `sand-100` |
| Text secondary | `ink-600` | `ink-200` |
| Text muted | `ink-500` | `ink-300` |
| Link | `plum-900` (underline) | `plum-300` |
| Border subtle (decorative) | `rgba(11,8,13,.14)` | `rgba(244,231,216,.16)` |
| Border strong | `rgba(11,8,13,.28)` | `rgba(244,231,216,.30)` |
| Border control (inputs) | `#8F8473` | `#7C7288` |
| Focus ring | `plum-900` | `sand-100` |

### 3.3 Status tones (chips, banners)

| Tone | Bg | Text | Icon (lucide) | Meaning |
|---|---|---|---|---|
| neutral | `sand-300` | `ink-600` | `circle-dashed` | Draft, not started |
| info | `plum-100` | `plum-900` | `circle-dot` | New, submitted |
| progress | `#D9E6EE` | `#1F3F57` | `loader-circle` (static) | In progress, negotiating |
| attention | `amber-100` | `amber-800 #6B4614` | `circle-alert` | Waiting on you |
| success | `#DCEBDD` | `#1F5130` | `circle-check` | Accepted, completed, connected |
| danger | `#F4DADC` | `#8A2433` | `circle-x` | Rejected, failed, disconnected |
| closed | `#E6E0EA` | `ink-500` | `archive` | Cancelled, closed, archived |

Never convey status by color alone: icon + text always present.

### 3.4 Verified contrast (WCAG ratios, computed)

| Pair | Ratio | Use |
|---|---|---|
| `ink-950` on `sand-100` | 16.37 | Body |
| `ink-600` on `sand-100` | 7.97 | Secondary text |
| `ink-500` on `sand-100` | 6.29 | Muted (≥ 14 px) |
| `ink-500` on `sand-50` | 7.11 | Muted on cards |
| `plum-900` on `sand-100` | 13.06 | Links |
| `sand-100` on `ink-950` | 16.37 | Dark sections |
| `ink-200` on `ink-950` | 9.47 | Secondary on dark |
| `ink-300` on `ink-900` | 7.24 | Muted on dark |
| `plum-300` on `ink-950` | 10.39 | Accent text on dark |
| `amber-600` on `sand-100` | 4.84 | Overline only |
| `amber-400` on `ink-950` | 8.52 | Accent on dark |
| `#8F8473` on `sand-50` | 3.41 | Input border (≥ 3:1) |
| Status tone text/bg pairs | 5.9 – 12.2 | All ≥ 4.5 |

Disabled text is exempt (about 2.9:1) but must carry `aria-disabled` and a visual cue beyond color.

---

## 4. Token block (paste into `app/globals.css`, replacing the current `:root`)

```css
:root {
  /* sand */
  --ro-sand-50:#FBF6EE; --ro-sand-100:#F4E7D8; --ro-sand-200:#EFE3D4; --ro-sand-300:#E3D6C5; --ro-sand-400:#D2C2AC;
  /* ink */
  --ro-ink-950:#0B080D; --ro-ink-900:#15101A; --ro-ink-800:#211A29; --ro-ink-700:#332A3C;
  --ro-ink-600:#4B4056; --ro-ink-500:#5A4F66; --ro-ink-400:#6B6074; --ro-ink-300:#A79DB3; --ro-ink-200:#B9AFC4;
  /* plum */
  --ro-plum-900:#32104F; --ro-plum-800:#3F1962; --ro-plum-700:#52277C; --ro-plum-300:#C9B2E3; --ro-plum-100:#E9DDF3; --ro-plum-50:#F5EFFA;
  /* amber */
  --ro-amber-800:#6B4614; --ro-amber-600:#8A5A22; --ro-amber-500:#B8863F; --ro-amber-400:#CFA25E; --ro-amber-100:#F1E0BF;
  /* semantic */
  --ro-success-700:#1F5130; --ro-success-100:#DCEBDD;
  --ro-danger-700:#8A2433;  --ro-danger-100:#F4DADC;
  --ro-progress-700:#1F3F57; --ro-progress-100:#D9E6EE;

  /* roles (light) */
  --ro-bg:var(--ro-sand-100); --ro-bg-raised:var(--ro-sand-50); --ro-bg-sunken:var(--ro-sand-200);
  --ro-text:var(--ro-ink-950); --ro-text-2:var(--ro-ink-600); --ro-text-muted:var(--ro-ink-500);
  --ro-link:var(--ro-plum-900); --ro-link-hover:var(--ro-plum-700);
  --ro-border-subtle:rgba(11,8,13,.14); --ro-border:rgba(11,8,13,.28); --ro-border-control:#8F8473;
  --ro-focus:var(--ro-plum-900);

  /* space (4px base) */
  --ro-s-1:4px; --ro-s-2:8px; --ro-s-3:12px; --ro-s-4:16px; --ro-s-5:20px; --ro-s-6:24px; --ro-s-8:32px;
  --ro-s-10:40px; --ro-s-12:48px; --ro-s-16:64px; --ro-s-20:80px; --ro-s-24:96px; --ro-s-32:128px; --ro-s-40:160px;

  /* shape */
  --ro-r-xs:2px; --ro-r-sm:4px; --ro-r-md:8px; --ro-r-lg:16px; --ro-r-full:9999px;

  /* elevation */
  --ro-e2:0 1px 2px rgba(11,8,13,.06), 0 8px 24px -12px rgba(11,8,13,.18);
  --ro-e3:0 24px 64px -24px rgba(11,8,13,.45);

  /* motion */
  --ro-dur-instant:90ms; --ro-dur-fast:160ms; --ro-dur-base:240ms; --ro-dur-slow:420ms; --ro-dur-enter:700ms; --ro-dur-hero:1100ms;
  --ro-ease-standard:cubic-bezier(.2,0,0,1);
  --ro-ease-enter:cubic-bezier(.16,1,.3,1);
  --ro-ease-exit:cubic-bezier(.4,0,1,1);
  --ro-ease-resonance:cubic-bezier(.37,0,.63,1);
}

.ro-inverse { /* any dark section: hero, trader band, footer, admin sidebar */
  --ro-bg:var(--ro-ink-950); --ro-bg-raised:var(--ro-ink-900); --ro-bg-sunken:var(--ro-ink-950);
  --ro-text:var(--ro-sand-100); --ro-text-2:var(--ro-ink-200); --ro-text-muted:var(--ro-ink-300);
  --ro-link:var(--ro-plum-300); --ro-link-hover:var(--ro-sand-100);
  --ro-border-subtle:rgba(244,231,216,.16); --ro-border:rgba(244,231,216,.30); --ro-border-control:#7C7288;
  --ro-focus:var(--ro-sand-100);
}

/* language-driven type system */
html[lang="ar"] {
  --ro-font-display:var(--font-amiri), var(--font-cormorant), serif;
  --ro-font-ui:var(--font-plex-ar), var(--font-source), system-ui, sans-serif;
  --ro-display-weight:400; --ro-display-scale:.94; --ro-ui-scale:1.06;
  --ro-lh-body:1.8; --ro-lh-heading:1.35; --ro-track-overline:0;
}
html[lang="en"] {
  --ro-font-display:var(--font-cormorant), var(--font-amiri), serif;
  --ro-font-ui:var(--font-source), var(--font-plex-ar), system-ui, sans-serif;
  --ro-display-weight:500; --ro-display-scale:1; --ro-ui-scale:1;
  --ro-lh-body:1.6; --ro-lh-heading:1.12; --ro-track-overline:.14em;
}
```

Tailwind v4 mapping (extend the existing `@theme inline`): expose `--color-ro-canvas`, `--color-ro-paper`, `--color-ro-sunken`, `--color-ro-ink`, `--color-ro-plum`, `--color-ro-amber`, plus `--color-ro-text`, `--color-ro-text-2`, `--color-ro-muted`, `--color-ro-border`. Keep legacy aliases `ro-cream → sand-100`, `ro-purple → plum-900`, `ro-near-black → ink-950` until Phase 7, then delete them.

**Calibration rule:** only `--ro-display-scale` and `--ro-ui-scale` may be tuned after visual review in `/dev/ui`. Nothing else in the type system changes.

---

## 5. Typography

### 5.1 Families (via `next/font/google`, `display: "swap"`)

| Variable | Family | Weights | Subsets |
|---|---|---|---|
| `--font-cormorant` | Cormorant Garamond | 500, 600 | latin |
| `--font-amiri` | Amiri | 400, 700 | arabic, latin |
| `--font-source` | Source Sans 3 | 400, 600 | latin |
| `--font-plex-ar` | IBM Plex Sans Arabic | 400, 500, 600 | arabic |

Preload only the display font of the active locale. All four are open-licensed for commercial use.

### 5.2 Scale (size = value × role scale for Arabic)

| Role | Size (clamp) | Font | Weight AR/EN | Line-height AR/EN | Use |
|---|---|---|---|---|---|
| display-xl | `clamp(3rem, 2rem + 5vw, 6.5rem)` | display | 400/500 | 1.25 / 1.02 | Hero only |
| display-lg | `clamp(2.5rem, 1.7rem + 3.6vw, 4.5rem)` | display | 400/500 | 1.3 / 1.05 | Section heroes |
| h1 | `clamp(2rem, 1.55rem + 2vw, 3.25rem)` | display | 400/500 | 1.35 / 1.1 | Page titles |
| h2 | `clamp(1.625rem, 1.35rem + 1.2vw, 2.25rem)` | display | 400/500 | 1.4 / 1.15 | Section titles |
| h3 | `clamp(1.25rem, 1.15rem + .5vw, 1.5rem)` | UI | 600 | 1.5 / 1.25 | Card titles |
| h4 | `1.125rem` | UI | 600 | 1.55 / 1.3 | Sub-blocks |
| body-lg | `1.125rem` | UI | 400 | 1.85 / 1.6 | Lead text |
| body | `1rem` | UI | 400 | 1.8 / 1.6 | Default |
| body-sm | `.875rem` | UI | 400 | 1.7 / 1.55 | Secondary |
| caption | `.8125rem` | UI | 400 | 1.65 / 1.5 | Meta |
| overline | `.75rem` | UI | 600 | 1.6 / 1.4 | Eyebrow labels |
| admin-table | `.875rem` | UI | 400 | 1.5 | Dense tables |

### 5.3 Rules

- **Arabic never gets** letter-spacing, italics, uppercase, or synthetic bold. Overline in Arabic is plain 600, not tracked.
- Overline in Latin: uppercase, tracking `.14em`.
- Max line length: 60–70 characters Latin, 50–60 Arabic.
- Headings use the display font; everything interactive uses the UI font.
- Hero headline: at most 3 lines in Arabic, at most 38 characters per line.
- Mixed content: wrap Latin names, phone numbers, URLs, and SKUs in `<bdi>`; phone/email inputs `dir="ltr"`.
- Prices and quantities use tabular numerals (`font-variant-numeric: tabular-nums`) in tables and request lines.

---

## 6. Layout and spacing

| Tier | Width | Columns | Margin | Gutter |
|---|---|---|---|---|
| Mobile | < 640 | 4 | 16 | 16 |
| Tablet | 640–1023 | 8 | 24 | 20 |
| Desktop | 1024–1535 | 12 | 40 | 24 |
| Wide | ≥ 1536 | 12, content max 1440, centered | auto | 24 |

Section vertical rhythm (storefront): 64 / 96 / 128 px (mobile / tablet / desktop). Title-to-content: 40 / 48 / 64. Admin page padding: 16 / 24 / 32. Touch targets: 44 × 44 minimum on every device.

Always use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`). No `left`/`right`.

---

## 7. Shape, borders, elevation

| Element | Radius | Border | Shadow |
|---|---|---|---|
| Buttons, inputs, chips | 4 | 1 px | none |
| Cards | 4 | subtle hairline | none; interactive storefront cards add `e2` on hover |
| Media | 2 | none | none |
| Dialogs, popovers | 8 | none | `e3` |
| Bottom sheet | 16 top corners | none | `e3` |

Depth comes first from lightness (`sand-50` on `sand-100`), then hairlines, then shadow. Only two shadows exist: `e2`, `e3`.

---

## 8. Motion

### 8.1 Tokens

Durations: instant 90, fast 160, base 240, slow 420, enter 700, hero 1100 ms. Easings: standard, enter (expo-out), exit, resonance (symmetric).

### 8.2 Patterns

| Pattern | Spec |
|---|---|
| Reveal on scroll | `translateY(12px)` + opacity 0 → 1, 700 ms enter easing, stagger 80 ms, once per element, `IntersectionObserver` threshold 0.15 |
| Hover (storefront cards) | Image scale 1.03 over 420 ms; card lift 2 px + `e2` over 240 ms |
| Press (storefront primary button) | Scale .98 over 90 ms + one resonance ring ripple (600 ms, 1 ring) from the pointer position |
| Rings idle (hero, empty states) | Opacity pulse ±8%, 8 s, ring stagger 400 ms, `resonance` easing |
| Grain draw (hero load) | `stroke-dashoffset` from full length to 0, 1100 ms, stagger 120 ms |
| Overlay open | Opacity + `translateY(8px)` 240 ms; sheet: `translateY(100%)` → 0, 420 ms |
| Admin transitions | ≤ 160 ms, opacity only, no transforms |

### 8.3 Hero choreography (desktop)

| t (ms) | Event |
|---|---|
| 0–200 | Background fade-in |
| 200–1100 | Rings draw, staggered |
| 400–1100 | Headline lines fade-up, 120 ms stagger |
| 800–1300 | Subline, then CTAs |
| ≥ 1300 | Rings idle pulse |
| scroll | Hero visual `translateY` ≤ 24 px parallax; header turns solid after 80 px |

### 8.4 Hard rules

- Animate only `transform` and `opacity`.
- `prefers-reduced-motion: reduce`: all of the above become a 120 ms opacity fade; rings static; no parallax; no ripple.
- Save-Data (`navigator.connection.saveData` or `Save-Data` header): treat as reduced motion, serve smaller hero image, skip grain draw.
- No scroll-jacking, no auto-playing video in v1, no animation longer than 1300 ms except the idle pulse.

---

## 9. Iconography

`lucide-react`, stroke 1.5, sizes 16 / 20 / 24. Color inherits text. Tree-shake by named import only.
Mirror directional icons in RTL (`rtl:-scale-x-100`): arrows, chevrons, back/forward, send. Do not mirror: clock, check, media, search, brand glyphs.

Six custom brand glyphs in `components/brand/icons/`: `rosette`, `grain`, `peg`, `string`, `wood`, `handcrafted`. Same 1.5 stroke, 24 px grid.

---

## 10. Imagery and brand assets

### 10.1 Product photography (per SKU)

| Item | Spec |
|---|---|
| Master | 2400 × 3000 px (4:5), sRGB, JPEG q ≥ 90 |
| Minimum set | 3 images; ideal 5 |
| Shots | 1 front three-quarter · 2 soundboard and rosette macro · 3 back/bowl grain · 4 neck and pegbox · 5 detail (strings/bridge) |
| Background | Seamless `ink-900` (primary). `sand-100` only for a deliberate "light" collection |
| Light | Soft key, warm rim light, no hard shadows, no props |
| Naming | `{slug}-{n}.jpg` |
| Alt text | `{product name} — {angle}`; angle names in dictionary (AR/EN) |

### 10.2 Editorial photography

Minimum 6: macro wood grain ×2, rosette ×1, hands crafting ×1, strings and pegs ×1, material/workshop ×1. Crops: 16:9 and 4:5. Text over imagery requires an `ink-950` scrim 0 → 60% and ≥ 4.5:1 verified.

### 10.3 Material Plate (honest placeholder, replaces empty boxes)

4:5 box, `ink-800` background, grain tile at 14% `sand-100`, centered `rosette` glyph at 28% opacity. Caption (overline, `ink-200`): "الصورة قيد التصوير" / "Photography in progress". Variants: `full` (with caption: cards, PDP), `compact` (no caption: cart lines, admin thumbs). On the PDP a plate appears alone, with no thumbnails and no zoom.

### 10.4 Logo usage

| Rule | Value |
|---|---|
| Versions | Master (cream on ink), ink on cream, plum on cream; small mark for ≤ 32 px |
| Clear space | 25% of emblem height on all sides |
| Minimum size | 24 px tall (use small mark below 32 px) |
| Forbidden | Stretching, rotating, recoloring outside the three versions, effects, placing on busy imagery without a scrim |

### 10.5 Launch asset deliverables

| ID | Asset | Needed by |
|---|---|---|
| A1 | Emblem as clean SVG (master, ink, cream, plum, small mark) | Before Phase 4 |
| A2 | Latin wordmark lockup "RARE OUD" SVG | Before Phase 4 |
| A3 | Favicon set + `apple-touch-icon` + 512 icon | Before Phase 7 |
| A4 | Default OG image 1200 × 630 | Before Phase 7 |
| A5 | Editorial photography set (§10.2) | Before Phase 4 |
| A6 | Product photography per §10.1 | Before launch (placeholders cover the gap) |
| A7 | Grain, rings, axis SVG components | Built in Phase 1 |
| A8 | Six custom glyphs | Built in Phase 2 |


---

**[PART 02]**

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


---

**[PART 03]**

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


---

**[PART 04]**

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


---

**[PART 05]**

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


---

**[PART 06]**

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


---

**[PART 07]**

# 07 — Implementation Plan

Baseline: git repository initialized by Stage C (`72a56a7`, then `033b0fd`). Work happens on one branch per phase (`ui/p1-foundations`, …), merged after the phase gate, tagged `ui-p{n}`.

**Dependency change (only one):** add `lucide-react`. Everything else uses the existing stack, native `<dialog>`, and the Popover API.

**Quality gate for every slice:** `npm run lint` · `tsc --noEmit` · `next build` · `scripts/check-i18n.ts` · the universal checklist (file 06 §8) · screenshots at 390 / 768 / 1440 in Arabic and English.

---

## Phase map

| Phase | Goal | Size (est. days, one reviewer) |
|---|---|---|
| P0 | Reconciliation, no UI change | 0.5 |
| P1 | Foundations: tokens, fonts, brand motifs, helpers, `/dev/ui` | 1–1.5 |
| P2 | Primitives and states, status mapping | 2–3 |
| P3 | Chrome, system pages, locale routing | 2–3 |
| P4 | Storefront (4 slices) | 5–7 |
| P5 | Admin (5 slices) | 6–8 |
| P6 | Trader portal (3 slices) | 3–4 |
| P7 | Hardening: SEO, performance, accessibility, cleanup | 2–3 |
| P8 | Client review pack and tag | 1 |

Estimates are for planning; the order and gates are binding.

---

## P0 — Reconciliation (read-only)

Produce `docs/ui-planning/plan/RECONCILIATION.md` before any code. Do **not** edit the plan files.

| Check | Output |
|---|---|
| Every route and file path named in files 03–05 exists or is flagged as new | Table: path, exists, note |
| Schema fields behind every column, form field, and `KeyValueList` in files 04–05 | Table: UI item → field, or MISSING |
| Enums for RetailRequest, DealProposal, WholesaleRequest, WhatsApp link and message states | Draft of `lib/ui/status.ts` (tone, labelKey, nextActor proposed) for owner approval |
| Data availability: `getDashboardCounts` coverage for the four KPIs, unread counts, activity feed source, WhatsApp connection state source, outbound-pause flag | Table: need → source or GAP |
| Image model: `ProductImage` fields (order, alt, primary), upload path, size limits | Notes |
| Middleware: where the locale rewrite and the 403 handling fit without touching JWT logic | Short design |
| Anything in the plan that contradicts a business boundary or the schema | Conflict list with a proposed minimal resolution |

Gate: owner reviews the conflict list; resolutions are recorded in `00-index.md` Decision Lock as D27+ entries.

---

## P1 — Foundations

| Action | Files |
|---|---|
| Replace fonts (Cormorant Garamond, Amiri, Source Sans 3, IBM Plex Sans Arabic); remove Noto families; set `lang`/`dir` | `app/layout.tsx` |
| Replace the `:root` block with the token block; add `.ro-inverse`, language type variables, motion keyframes, reduced-motion block; keep legacy aliases | `app/globals.css` |
| Create `Rings`, `Grain`, `Axis`, `Emblem` (PNG until A1 arrives) | `components/brand/*` |
| Create formatting, plural, href, nav, seo (skeleton), scroll helpers | `lib/i18n/format.ts`, `lib/i18n/plural.ts`, `lib/href.ts`, `lib/nav.ts`, `lib/seo.ts`, `lib/ui/scroll.ts` |
| Create the i18n parity script and wire it into lint | `scripts/check-i18n.ts` |
| Create the dev-only gallery (production: `notFound()`, `noindex`) | `app/dev/ui/page.tsx` |

Gate: gallery shows tokens, type scale, motifs, and contrast table in Arabic and English; owner confirms the two calibration variables (`--ro-display-scale`, `--ro-ui-scale`) after seeing Amiri and Plex Arabic rendered.

## P2 — Primitives and states

Create `components/ui/*` for P01–P24, the six brand glyphs, `lib/ui/status.ts` (approved table from P0), toast provider, `RoButton`/`RoButtonLink` as wrappers over `Button`. Every component appears in `/dev/ui` with all states, light and `.ro-inverse`, AR and EN.

Gate: owner approves the status table and the gallery. No page work starts before this gate.

## P3 — Chrome, system pages, routing

| Action | Files |
|---|---|
| Storefront chrome S01–S05, S24 | `components/storefront/header.tsx`, `footer.tsx`, `brand-mark.tsx`, `section-heading.tsx` (rewrite) |
| Admin shell A01 with dictionary labels | `components/admin/shell.tsx` |
| Trader shell T01 with dictionary labels | `components/trader/shell.tsx` |
| Locale rewrite for storefront `/en/*`; 403 handling; JWT logic untouched | `middleware.ts` |
| System pages: not-found, error, loading per group, 403, offline banner | `app/**/not-found.tsx`, `error.tsx`, `loading.tsx` |
| Admin and trader dictionary namespaces (nav, shell, auth) | `lib/i18n/dictionaries.ts` |

Gate: all three portals navigable in both locales; a trader opening an admin URL (and the reverse) sees the 403 view; the language switch maps to equivalent URLs.

---

## P4 — Storefront

| Slice | Scope | Closes |
|---|---|---|
| **4a** | `ProductCard`, `ProductGrid`, `FilterBar`, `PriceBlock`, `AvailabilityChip`, `MaterialPlate`, Catalog (SF-02), `ProductGallery`, `SpecTable`, PDP (SF-03) | Audit finding R1 (missing product images) |
| **4b** | `QtyStepper`, `RequestLine`, `HandoffExplainer`, `RequestSummary`, `RequestForm`, `HandoffSuccess`, Request list (SF-04), Request (SF-05) | R9 (hard-coded English) |
| **4c** | `HeroResonance`, `TrustStrip`, `EditorialSplit`, `TraderBand`, Home (SF-01), `SearchOverlay`, `QuickView` | R5 (dead home modules) |
| **4d** | Offers (SF-06/07), Contact (SF-08), Privacy (SF-09) | — |

Review gate after **each** slice with the screenshot matrix.

## P5 — Admin

| Slice | Scope |
|---|---|
| 5a | Login, Dashboard (AD-01, AD-02) |
| 5b | Inbox (AD-03) with all connection and message states |
| 5c | Requests, Deals, Wholesale (AD-04 to AD-06) |
| 5d | Products with `ImageUploader`, Categories, Offers (AD-07 to AD-09) |
| 5e | Customers, Traders (AD-10, AD-11) |

## P6 — Trader portal

| Slice | Scope |
|---|---|
| 6a | Login, Home, Offers, Profile (TR-01, TR-02, TR-09, TR-10) |
| 6b | Deals list, wizard, detail (TR-03 to TR-05) |
| 6c | Wholesale builder, list, detail (TR-06 to TR-08) |

---

## P7 — Hardening and cleanup

| Action | Detail |
|---|---|
| SEO | `lib/seo.ts` complete, metadata per page, `sitemap.ts`, `robots.ts`, JSON-LD, OG images, hreflang |
| Performance | Lighthouse runs (Slow 4G, mobile) on Home, Catalog, PDP, Request; fix to budget |
| Accessibility | axe pass on every route; NVDA and VoiceOver on the five flows (file 06 §4) |
| Cleanup | Delete: `components/storefront/home/{discovery,categories,featured-products}.tsx`, unreferenced `media-plane` and `material-field`, template SVGs in `public/` (`next.svg`, `globe.svg`, `file.svg`, `vercel.svg`, `window.svg`), legacy color aliases and old gradients. Compare stays dormant behind a flag |
| Brand | Replace PNG marks with SVG when A1 and A2 arrive; favicon set and default OG image (A3, A4) |
| Final | `scripts/check-i18n.ts` clean; no hard-coded strings, hex, or arbitrary type sizes (grep counts reported at zero) |

## P8 — Review pack

Screenshot matrix for every P0 screen (390 / 768 / 1440 × AR / EN), a 10-minute walkthrough script (visitor request → admin handling → trader deal → wholesale), the known-issues list, Lighthouse reports, tag `ui-v1.0`.

---

## File map (existing → action)

| Existing | Action | Phase |
|---|---|---|
| `app/layout.tsx` | Fonts, `lang`/`dir`, skip link | P1, P3 |
| `app/globals.css` | Token block, motion, remove gradients and hex | P1 |
| `components/ui/ro-button.tsx` | Wrapper over new `Button` | P2 |
| `components/storefront/{header,footer,brand-mark,section-heading}.tsx` | Rewrite | P3 |
| `components/storefront/home/hero.tsx` | Rewrite as `HeroResonance` | P4c |
| `components/storefront/home/{discovery,categories,featured-products}.tsx` | Delete | P7 |
| `components/storefront/discovery/*` | Keep search overlay and quick view (restyle); compare behind flag; mosaic and rail replaced by H3–H6 | P4c |
| `components/storefront/cart-provider.tsx` | Keep logic; labels from dictionary | P4b |
| `components/storefront/request-form.tsx` | Rewrite (S17) | P4b |
| `components/storefront/product-card.tsx` | Replace with S06 | P4a |
| `app/(storefront)/**` | Restyle per file 03; add contact, privacy, system pages | P4 |
| `components/admin/shell.tsx`, `app/admin/**` | Rewrite and restyle per file 04 | P3, P5 |
| `components/trader/shell.tsx`, `app/trader/**` | Rewrite and restyle per file 05 | P3, P6 |
| `components/deals/negotiation-form.tsx` | Becomes `NegotiationThread` action bar (A19) | P5c, P6b |
| `middleware.ts` | Add locale rewrite and 403 handling | P3 |
| `lib/i18n/*` | Namespaces, plural, format | P1, P3 |
| New: `components/brand/*`, `components/ui/*`, `lib/ui/status.ts`, `lib/href.ts`, `lib/nav.ts`, `lib/seo.ts`, `lib/ui/scroll.ts`, `scripts/check-i18n.ts`, `app/dev/ui/page.tsx`, `app/sitemap.ts`, `app/robots.ts` | Create | P1–P7 |

---

## Risk register

| # | Risk | Mitigation |
|---|---|---|
| R1 | Arabic font metrics clip or look small next to Latin | Two calibration variables only; reviewed in `/dev/ui` at P1 |
| R2 | Locale URL change breaks existing links | `lib/href.ts` for all links; P0 design; redirect map; tested in P3 |
| R3 | Few real photos make the store look empty | Material Plate system; sections hide when data is absent; photography brief A5/A6 |
| R4 | Inbox depends on connection and pause state that may not be exposed to the UI | P0 checks the source; if missing, a minimal read-only status endpoint is the single permitted backend addition, approved in P0 |
| R5 | Hero too heavy on weak networks | Save-Data mode, image budget, no video, static fallback |
| R6 | Scope creep (compare, new features, new fields) | Decision Lock and change policy in file 00; Cursor reports instead of adding |
| R7 | SVG logo not delivered | PNG remains valid; A1 gates only the final polish |
| R8 | Reviewer bandwidth | Gates are per slice; each slice ships a screenshot matrix so review is visual and fast |
| R9 | Schema lacks a field a screen needs | P0 conflict list; screens simplify instead of inventing fields |

---

## Cursor prompts

### A. Master implementation prompt (paste once)

```
ROLE
You are the Principal Frontend Engineer implementing the locked UI plan for
Project B (D:\N I G H T\rare-oud-platform). The plan is in
docs/ui-planning/plan/ (files 00 to 07). It is the source of truth.

RULES
- Read all eight plan files before doing anything. Do not edit them.
- Work strictly phase by phase and slice by slice (file 07). Stop at every
  gate and wait for my explicit approval.
- Phase 0 first: produce RECONCILIATION.md, no code.
- Follow the Decision Lock (file 00). Anything outside it: ask, do not decide.
- Add no dependency except lucide-react. Use native <dialog> and Popover API.
- Never invent fields, statuses, routes, features, prices, MOQ, discounts, or
  shipping rates. If the schema lacks something, report it.
- Business boundaries stay binding: no payment, traders own nothing, three
  separate domains, no generic Order, WhatsApp via the Baileys adapter only.
- Every string from the dictionary (AR and EN). Every color, size, and space
  from tokens. Logical CSS properties only.
- Do not touch Project A. Do not change backend logic except where a slice
  explicitly says so.
- After each slice report: files changed, checklist results (file 06 §8),
  screenshots to capture, open issues. Then stop.

Confirm you have read the plan, then begin Phase 0.
```

### B. Phase kickoff template

```
START PHASE {N} — {NAME}
Scope: the slices listed for this phase in file 07, and only those.
Specs: {files and section ids}.
Gate criteria: as written for this phase.
Run the quality gate for every slice. Report using the slice report format,
then stop and wait.
```


---

**[APPENDIX S — Contractual scope]**

# Cost Breakdown — Scope Reference (no prices)

**Project:** RARE OUD platform (Project B) — multi-trader musical-instruments site
**Purpose:** a single, repo-resident scope reference so UI planning and review map to the contractual line items. Prices are intentionally omitted.
**Place at:** `docs/scope/cost-breakdown-scope.md`

Section numbering skips 05 for historical reasons (a former marketing section was merged into Trader Deals). Do not renumber.

---

## Clarifications that override older wording

1. **No trader filter.** Traders own no products, so catalog search/filter is by **type and price only** (item 2.3). Any "filter by trader" wording is obsolete.
2. **Trader accounts are created and managed by admin.** There is no trader self-registration (item 3.1).
3. **"Customer Management" (6.2) is an admin CRM list.** It is not customer accounts; visitors do not register.
4. **No payment anywhere.** Retail requests end in a prefilled WhatsApp handoff (4.1).
5. **Automatic WhatsApp status notifications to customers are out of scope.** The former item 9.4 was cancelled. Status tracking (4.3) is internal to the admin panel.
6. **Three request domains stay separate:** RetailRequest / DealProposal + NegotiationEntry + PublicCuratedOffer / WholesaleRequest (+ Line + Event). There is no generic "Order".
7. **Out of scope for this plan (future versions):** a B2B marketplace upgrade with an AI assistant (V2) and a custom oud configurator (V3). Leave room, but do not design or build them.

---

## 01 — Planning & Design

| # | Item | Scope |
|---|------|-------|
| 1.1 | Business & Requirements Discovery | Business model, trader relationships, deal proposal flow, wholesale-from-own-stock model |
| 1.2 | Site Information Architecture | Storefront, trader deals section, admin panel |
| 1.3 | UI/UX Design | Wireframes for four experiences: storefront, trader deals, WhatsApp inbox in admin, wholesale request |
| 1.4 | Brand-Aligned Visual Design | One visual direction applied across all of the above |

## 02 — Core Storefront

| # | Item | Scope |
|---|------|-------|
| 2.1 | Product Catalog Engine | Products listed by category and source |
| 2.2 | Product Detail Pages | Images, video, specifications per product |
| 2.3 | Search & Filters | By type and price (see clarification 1) |
| 2.4 | Shopping Cart | Full cart functionality |
| 2.5 | Request Finalization Flow | Review cart and confirm request details before WhatsApp handoff |
| 2.6 | Responsive Design | Mobile, tablet, desktop |

## 03 — Trader Deals & Requests

| # | Item | Scope |
|---|------|-------|
| 3.1 | Trader Registration & Onboarding | Admin-created trader accounts (see clarification 2) |
| 3.2 | Trader Profile & Deal Preferences | Trader profile and interests to match suitable deals |
| 3.3 | Trader Request Visibility | A trader sees only their own requests |
| 3.4 | Trader Request History & Status Dashboard | History and status (in review, accepted, shipped) — not sales |
| 3.5 | Public Deals Board for Traders | Deals and offers visible to all registered traders |
| 3.6 | Deal Approval Workflow | Admin accepts or rejects each proposal |
| 3.7 | Trader-Proposed Deal Requests | A trader proposes a request or offer to admin, to ship products from the client's stock on acceptance |

## 04 — Orders & WhatsApp Handoff

| # | Item | Scope |
|---|------|-------|
| 4.1 | Request-to-WhatsApp Handoff | Finalized request becomes a ready WhatsApp conversation, completed manually |
| 4.2 | Order Management System | Internal record of requests from receipt to close |
| 4.3 | Internal Order Status Tracking | Status updates inside the admin panel only |

## 06 — Admin & Reporting

| # | Item | Scope |
|---|------|-------|
| 6.1 | Admin Dashboard | Unified panel for deals, requests, customers, and the WhatsApp inbox entry point |
| 6.2 | Customer Management | List and manage customer records (clarification 3) |

## 07 — Security & Launch

| # | Item | Scope |
|---|------|-------|
| 7.1 | Data Encryption & Secure Storage | Sensitive data encrypted and stored securely |
| 7.2 | Daily Backup Configuration | Automatic daily backup |
| 7.3 | QA & Testing | Full functional pass before launch |
| 7.4 | Deployment & Launch Support | Deployment and direct support in the first days |
| 7.5 | Domain & SSL Certificate Setup | Domain linking and SSL |

## 08 — Wholesale Trader Ordering

| # | Item | Scope |
|---|------|-------|
| 8.1 | Wholesale Request Submission | A trader browses the client's own catalog and submits a bulk request |
| 8.2 | Wholesale Order Fulfillment Dashboard | The client reviews, confirms, and prepares the request for shipping |
| 8.3 | Wholesale Shipping & Fulfillment Tracking | Shipping data and a tracking reference per wholesale request |

## 09 — WhatsApp Business Integration

| # | Item | Scope |
|---|------|-------|
| 9.1 | WhatsApp Business API Connection | Account linked to the admin panel (implemented via a WhatsApp Web adapter, not the Meta Cloud API) |
| 9.2 | Unified Conversations Inbox | All WhatsApp conversations shown inside the admin dashboard |
| 9.3 | Order-to-Conversation Linking | Each request or deal linked to its conversation (RetailRequest, DealProposal, or WholesaleRequest) |
