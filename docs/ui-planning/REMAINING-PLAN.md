# RARE OUD — خطة إكمال المنصة (بعد تدقيق 2026-10-30)

**مكان الملف في المشروع:** `docs/ui-planning/REMAINING-PLAN.md`
**يعتمد على:** `AUDIT-2026-10-30.md` و`VISION.md`، و`PLAN.md` لقواعد العمل والبيانات فقط.
**الفرع الحالي:** `feat/port-lab-to-real`

---

## الجزء A — دليلك (للمالك)

### القرارات المحسومة في هذه الخطة

هذه هي الأسئلة المفتوحة في نهاية التدقيق، وقد حُسمت هنا. لا تُعاد مناقشتها.

| # | السؤال | القرار | السبب |
|---|---|---|---|
| 1 | حفظ عمل كورسر أم تجاهله؟ | **يُحفظ فوراً** في commits منظمة، ويُرفع للمستودع البعيد كنسخة احتياطية | العمل سليم وظيفياً بشهادة التدقيق، وهو الآن بلا أي حماية |
| 2 | إصلاح سجل الـ migration | `prisma migrate resolve --applied` على قاعدة التطوير بعد إثبات عدم وجود فرق بين المخطط والقاعدة | التغيير نفسه إضافي وآمن؛ المشكلة في التسجيل فقط |
| 3 | حماية صور الوساطة | **تُنقل خارج `public/`** وتُخدَّم عبر مسار يتحقق من الجلسة والملكية | صور صفقات التجار خاصة؛ الرابط السري وحده ليس حماية |
| 4 | تغيير كلمة المرور الإجباري | **يُبنى الآن** للتجار والإداريين | متطلب صريح، والنصف الموجود منه بلا قيمة بدونه |
| 5 | المكتبات في التطبيق الحقيقي | **مسموحة كلها:** motion وsonner وcmdk وrecharts وThree.js/R3F، مع تحميل كسول وبدائل ثابتة | VISION.md ألغى قيود PLAN.md؛ بدونها لن يصل التطبيق لمستوى اللاب |
| 6 | الشاشات غير الموجودة في اللاب (صندوق واتساب، الطلبات، الصفقات، الجملة، المنتجات...) | **تُبنى مباشرة في التطبيق الحقيقي** بنفس نظام تصميم اللاب | بناؤها في اللاب ثم نقلها عمل مكرر |
| 7 | دور design-lab | **يُجمَّد** كمرجع بصري ونسخة عرض للعميل على المنفذ 3001 | التطبيق الحقيقي يصبح المصدر الوحيد للعمل الجديد |
| 8 | صفحة الفريق والأمان المدمجة | تبقى مدمجة بتبويبين: الفريق / سجل الأمان. وصفحة "حسابي" تبقى منفصلة | دمج منطقي؛ الملف الشخصي شأن مختلف |
| 9 | من ينفّذ ومن يدقق | **منفّذ واحد لكل مرحلة**، ثم تدقيق في جلسة جديدة منفصلة (كلود أو كورسر) قبل الانتقال | تقرير كورسر الأخير احتوى ادعاءات غير دقيقة؛ التدقيق المستقل كشفها |

### جدول المراحل

| المرحلة | الهدف | تدقيق مستقل بعدها؟ |
|---|---|---|
| 0 | شبكة الأمان: حفظ العمل، إصلاح الـ migration، تنظيف | لا |
| 1 | سد الثغرات الأمنية (الصور، كلمة المرور الإجباري) | **نعم** |
| 2 | نقل نظام التصميم والمكتبات من اللاب للتطبيق | **نعم** |
| 3 | الإدارة: الشاشات الموجودة في اللاب بمستوى مطابق | لا |
| 4 | الإدارة: شاشات التشغيل (واتساب، طلبات، صفقات، جملة، كتالوج) | **نعم** |
| 5 | بوابة التاجر كاملة | **نعم** |
| 6 | المتجر العام كاملاً | **نعم** |
| 7 | التصليب: أداء، سيو، وصولية، أمان، نسخ احتياطي | **نعم** |
| 8 | حزمة العرض للعميل والدمج في master | — |

### طريقة العمل

1. أرسل برومبت المرحلة كما هو. لا ترسل برومبتين معاً.
2. عندما يتوقف المنفّذ، افتح التطبيق بنفسك وراجع حسب "ما تراجعه أنت" في كل مرحلة.
3. في المراحل التي عليها تدقيق: افتح **جلسة جديدة** وأرسل برومبت التدقيق (في آخر الملف). لا تنتقل قبل أن يخرج التدقيق بلا Critical أو High.
4. إذا خالف المنفّذ الخطة، استخدم برومبت الطوارئ في آخر الملف.

### ما تحتاجه من العميل الآن (بالتوازي)

- جلسة تصوير احترافية للأعواد: خلفية داكنة، 3 إلى 5 صور لكل قطعة، ولقطات فيديو قصيرة بطيئة (يد على الأوتار، تفاصيل الخشب، الوردة). مطلوبة قبل المرحلة 6.
- نسخة SVG نظيفة من الشعار، أو اعتماد النسخة المحوّلة الحالية بعد مراجعتها.
- نصوص: قصة الحرفة، سياسة الخصوصية، معلومات التواصل وساعات العمل.
- تأكيد تفاصيل الوساطة: من يحدد نسبة العمولة (الإدارة لكل طلب؟)، وهل الشحن داخل العرض أم منفصل.

---

## القواعد الدائمة (تُلصق في بداية كل جلسة جديدة)

```
STANDING RULES — RARE OUD (apply to every phase)
- Plan files: docs/ui-planning/REMAINING-PLAN.md (this plan),
  VISION.md (design direction, supersedes PLAN.md visual rules),
  PLAN.md (business boundaries, data, routes, i18n mechanics only).
  Do not edit them. Record new decisions in
  docs/ui-planning/DECISIONS-ADDENDUM.md.
- Branch per phase from the latest approved branch:
  phase/NN-name. Small logical commits. Never reset --hard, never force
  push, never touch master until Phase 8. Push the branch after each
  phase for backup.
- design-lab/ is FROZEN as the visual reference (port 3001). New work
  happens in the real app (port 3000).
- Business boundaries: no online payment anywhere; traders own nothing;
  RetailRequest / Deal / Wholesale / Brokerage stay separate domains; no
  generic Order; WhatsApp only via the Baileys adapter; WhatsApp text
  never changes a business status. Never invent prices, MOQ, discounts,
  shipping rates, or commission values.
- Database: additive migrations only, always via prisma migrate dev with
  a committed migration file. Never db push. Never drop or rename columns
  without my explicit approval.
- Do not touch Project A, .env files, or the WhatsApp adapter internals
  unless the phase says so.
- Allowed UI stack in the real app: shadcn/ui, Tailwind, motion,
  sonner, cmdk, recharts, three + @react-three/fiber/drei (client-only,
  lazy, with static fallback), lucide-react. Anything else: report first.
- Every string in AR and EN via the dictionary. Western digits (0-9).
  Logical CSS properties. RTL-first.
- Quality gate per phase: npm run lint, tsc --noEmit, next build,
  scripts/check-i18n.ts, all existing test suites, axe zero violations
  (Playwright, settled server), no horizontal overflow at 375,
  reduced-motion verified live, Playwright videos of the phase's key
  flows at 375 and 1440 in AR and EN.
- Report format: what was done; claims table (claim | evidence); gate
  results with exact output; videos/screenshots paths; open issues with
  what you tried. No "deferred" without a reason. Then STOP.
```

---

## المرحلة 0 — شبكة الأمان

**المنفّذ:** كلود (أو كورسر) — مهمة قصيرة
**ما تراجعه أنت:** أن الفرع مرفوع على المستودع البعيد، وأن `migrate status` نظيف.

```
START PHASE 0 — Safety net. No feature work in this phase.

1. Commit Cursor's uncommitted port work on feat/port-lab-to-real in
   logical commits (e.g. login ceremony; admin dashboard stability;
   brokerage backend + migrations; brokerage UI; team/security; misc).
   Review each diff before committing. Exclude secrets, .env, uploads,
   build output. Push the branch to origin.
2. Migration reconciliation on the dev database:
   - Prove no drift first: npx prisma migrate diff
     --from-schema-datasource prisma/schema.prisma
     --to-schema-datamodel prisma/schema.prisma (or equivalent) and show
     the output is empty.
   - Then: npx prisma migrate resolve --applied
     20261029160000_brokerage_request_photos
   - Show npx prisma migrate status is clean.
   - Prove a fresh database works: create a throwaway database, run
     prisma migrate deploy + seed from zero, report success, drop it.
3. Clean the 12 leftover "E2E وساطة" rows from the dev DB, and change
   scripts/brokerage-lifecycle-e2e.ts to delete its own rows at the end.
4. Add the missing CANCELLED terminal-state scenario to that e2e script.
5. Add a dictionary-keys section (AR/EN) to BROKERAGE-SPEC.md.

Run the quality gate (tests and build only; no UI change). Report, STOP.
```

---

## المرحلة 1 — سد الثغرات الأمنية

**المنفّذ:** كلود
**ما تراجعه أنت:** انسخ رابط صورة وساطة وافتحه في نافذة خاصة بلا تسجيل دخول (يجب أن يُرفض). أعد تعيين كلمة مرور تاجر وسجّل دخوله (يجب أن يُجبر على تغييرها قبل أي شيء).

```
START PHASE 1 — Security gaps. Branch: phase/01-security.

A. Private brokerage media (AUDIT C-1)
- Move storage out of public/: e.g. storage/uploads/brokerage/{id}/
  (outside the web root, gitignored). Update lib/brokerage/media.ts.
- Serve through an authenticated route handler, e.g.
  app/api/media/brokerage/[requestId]/[file]/route.ts:
  session required; admin may read any; trader only if they own the
  request; otherwise 404 (not 403, no existence hint). Validate the file
  name strictly (server-generated pattern only). Headers:
  Cache-Control: private, max-age=3600; X-Content-Type-Options: nosniff;
  Content-Disposition: inline.
- Migrate existing files and stored photoPaths. Update all UI to the new
  URLs. Confirm public/uploads/brokerage no longer exists.
- Tests: unauthenticated -> 404; trader B -> 404; trader owner -> 200;
  admin -> 200; path traversal attempts -> 404. Add them to a test suite.

B. Forced password change (AUDIT C-2), traders AND admins
- Additive migration: mustChangePassword Boolean @default(false),
  passwordChangedAt DateTime? on TraderAccount and on the admin account
  model.
- Set mustChangePassword = true when an account is created with a
  temporary password and on every admin reset.
- Enforce on the server, not only in the UI: while true, every
  protected page redirects to the change-password screen and every
  server action returns an error, except the change-password action and
  sign-out. Put the check where it cannot be bypassed (session/JWT claim
  refreshed on change + layout guard + action guard).
- Change-password screen in the real app, at design-lab quality
  (/force-password-change in the lab is the visual reference): current
  temp password, new password, confirm, strength meter, rules list.
  Policy: minimum 10 characters, not equal to the temp password, not the
  email. On success: clear the flag, set passwordChangedAt, invalidate
  other sessions, toast, go to the portal home.
- Normal "change password" in profile/security uses the same policy.
- Tests: reset -> sign in -> blocked everywhere -> change -> access
  restored; old temp password no longer works.

C. Quick security sweep (report, fix only if trivial and in scope)
- Rate limiting on both login endpoints and on the change-password
  action. Security headers in next.config (CSP baseline, frame-ancestors
  none, referrer-policy, permissions-policy). Report what exists.

Quality gate. Playwright videos: media access tests, forced-change flow
(AR and EN). Report, STOP.
```

---

## المرحلة 2 — نقل نظام التصميم والمكتبات

**المنفّذ:** كلود
**ما تراجعه أنت:** صفحة الدخول في التطبيق الحقيقي فيها الشعار ثلاثي الأبعاد كما في اللاب، بلا وميض. التنبيهات (toasts) تظهر بشكل جميل. Ctrl+K يفتح لوحة الأوامر في الإدارة. صفحة معرض المكوّنات تعرض كل شيء بالعربي والإنجليزي.

```
START PHASE 2 — Design system port. Branch: phase/02-design-system.

Goal: the real app uses the same design system as design-lab, so every
later screen can reach lab quality.

1. Compatibility check first: real app Next 15 vs lab Next 16, Tailwind
   versions, React versions. Report differences and the plan to bridge
   them (no framework upgrade without my approval).
2. Port from design-lab into the real app:
   - Design tokens, theme variables, fonts, type scale, icon rules
     (Lucide 1.5; 16/20/24; 40/48 containers).
   - shadcn/ui components actually used by the lab, plus the Magic UI /
     Aceternity pieces used (keep only what is used).
   - motion, sonner (wire the existing SonnerToaster into the root
     layouts), cmdk command palette in admin (records + actions),
     recharts (wire the existing dashboard-domain-chart.tsx).
   - Three.js logo scene: fix the post-hydration crash properly: load
     via next/dynamic with ssr:false, wrap in an error boundary that
     falls back to the static logo, pause when off-screen, static logo
     under reduced motion and Save-Data. Then use it on both login pages.
3. Remove the duplicate/legacy styling that the new system replaces
   (list what you removed). No dead components left (grep proof).
4. Fix the admin sidebar landmark (AUDIT M-1): sidebar content inside a
   labelled <nav>.
5. Create or update the dev-only component gallery (/dev/ui, 404 in
   production) showing every component and state in AR/EN, light/dark
   sections.
6. Record the library decision in DECISIONS-ADDENDUM.md.

Quality gate + bundle report per route (first-load JS) with the 3D scene
confirmed lazy. Videos: login (both roles), toasts, command palette.
Report, STOP.
```

---

## المرحلة 3 — الإدارة: مطابقة شاشات اللاب

**المنفّذ:** كلود
**ما تراجعه أنت:** قارن كل شاشة مع نظيرتها في اللاب (3001 مقابل 3000). يجب أن تبدو بنفس المستوى أو أفضل، مع بيانات حقيقية.

```
START PHASE 3 — Admin parity with design-lab. Branch: phase/03-admin-parity.

Screens (real data, design-lab is the visual reference, match or exceed
it): admin shell (sidebar, topbar with personalized greeting by name and
time of day, avatar menu, locale toggle, connection status), dashboard
(KPIs with tickers, area chart, domain donut including brokerage, action
queue with inline actions, activity feed, WhatsApp card, brokerage
widget, quick-create menu), traders (list + create + edit + disable +
reset show-once), team and security (tabs: team / audit log, roles and
permissions matrix), customers (list + detail sheet), my profile
(/admin/profile: personal data, photo, language, theme) separate from
security settings (password, 2FA, sessions), brokerage board and detail
raised to lab quality (keep the real-app additions: status brief,
lifecycle rail).

Rules: every KPI and count must equal its filtered list count (test it).
No fixture data in the real app. Empty, loading, and error states for
every list.

For each screen: side-by-side screenshots lab vs real at 375 and 1440
(AR) in docs/ui-planning/port-audit/phase-03/. Quality gate. Videos of
the main flows. Report, STOP.
```

---

## المرحلة 4 — الإدارة: شاشات التشغيل

**المنفّذ:** كلود
**ما تراجعه أنت:** عالج طلباً من لوحة التحكم حتى الإغلاق. رد على محادثة واتساب من الهاتف. انشر منتجاً بصوره وتأكد أنه ظهر في المتجر.

```
START PHASE 4 — Admin operations. Branch: phase/04-admin-ops.

These screens do not exist in design-lab. Design them directly in the
real app at the same standard, following VISION.md section 5 (5.3 to
5.6) and the self-review loop (section 9, two passes per screen,
logged in REVIEW-LOG.md). Benchmark each against 3 top references.

Slices (commit and verify each before the next):
4a. WhatsApp inbox: three panes desktop, stacked mobile, all five
    connection states, failed-send retry, linking to request / deal /
    wholesale / brokerage, new-message animation, unread badges. Do not
    change adapter internals; report any missing data source.
4b. Retail requests: list (table/cards/Kanban with valid transitions
    only), detail with stepper, timeline, linked conversation, notes.
4c. Deals: list, detail with negotiation thread (structured actions
    only, no free chat).
4d. Wholesale: list, detail with lines, quote card (as entered, no
    computed discounts), shipping tracker.
4e. Products: gallery list, form with live storefront preview, image
    uploader (reorder, alt text, primary, min resolution), publish rules.
4f. Categories and offers.
4g. Notifications center (admin) and settings (WhatsApp, brand,
    security).

Quality gate per slice. Videos per slice. Report after 4g, STOP.
```

---

## المرحلة 5 — بوابة التاجر

**المنفّذ:** كلود
**ما تراجعه أنت:** على هاتفك فعلياً: اقترح صفقة، اطلب بالجملة، اطلب وساطة، كل واحدة بيد واحدة وبأقل من دقيقتين.

```
START PHASE 5 — Trader portal. Branch: phase/05-trader.

Mobile-first (390 px first), highest design investment per user.
Reference: design-lab trader home and brokerage screens; VISION.md 5.8.

Screens: shell (bottom tab bar with animated indicator, waiting-on-you
dots), home (greeting by name, waiting-on-you stack, three task cards
including brokerage, offers carousel, personal stats charts, recent
activity), deals (list, wizard with autosave and review, detail with
negotiation thread), wholesale (builder with product picker and summary
bar, list, detail with quote and shipping), brokerage (raise to lab
quality, inspection gallery via the private media route), offers,
notifications center, profile and security (same password policy).

Rules: a trader never sees another trader's data (test every detail
route); failed submits never lose entered data; touch targets >= 44 px.

Quality gate. Videos of the three task flows on 390 px. Report, STOP.
```

---

## المرحلة 6 — المتجر العام

**المنفّذ:** كلود
**شرط البدء:** وصول صور العميل، أو قرار صريح منك بالبدء بصور مؤقتة مرخّصة.
**ما تراجعه أنت:** على الهاتف وبشبكة ضعيفة: الصفحة الرئيسية تُبهر وتُحمَّل بسرعة، ومسار الطلب حتى واتساب واضح بدون شرح.

```
START PHASE 6 — Storefront. Branch: phase/06-storefront.

Reference: design-lab storefront home (cinematic 3D logo hero, scroll
story, real photography); VISION.md 5.9; PLAN.md part 03 for structure
and states.

Screens: home (hero, craft story, featured piece, collections, offers,
latest pieces, how requesting works, trader band), catalog (filters,
sort, load more, quick view on desktop), product page (immersive
gallery with lightbox and zoom, specs, add to request, related),
request list, request form, success with WhatsApp handoff (no duplicate
on reload), offers list and detail, contact, privacy, 404, offline.

Rules: no payment wording or icons; missing price shows
"السعر عند الطلب"; image licenses recorded in ASSETS.md; real client
photos replace stock as soon as they arrive (same file paths/slots).

Performance budget on Slow 4G mobile: LCP <= 2.5 s on home, catalog,
product; CLS <= 0.1; the 3D scene never blocks LCP (static first frame,
lazy upgrade).

Quality gate + Lighthouse (mobile) per page. Videos: full visitor
request flow. Report, STOP.
```

---

## المرحلة 7 — التصليب

**المنفّذ:** كلود
**ما تراجعه أنت:** تقارير Lighthouse، وتقرير الأمان، وأن النسخ الاحتياطي اليومي يعمل وتمت تجربة الاسترجاع.

```
START PHASE 7 — Hardening. Branch: phase/07-hardening.

1. SEO: metadata per page, canonical, hreflang (ar/en), sitemap, robots,
   JSON-LD (Organization, Product, BreadcrumbList), OG images.
2. Performance: Lighthouse mobile >= 85 performance, >= 95 a11y, best
   practices, SEO on storefront pages. Bundle report per route.
3. Accessibility: axe zero on every route; keyboard pass on the five key
   flows (request a piece, send a deal, wholesale request, brokerage
   request, reply in inbox).
4. Security review: auth and session handling, role checks on every
   admin route and action, IDOR tests for all four domains, upload
   handling, rate limits, security headers, dependency audit
   (npm audit, report only high/critical with a plan).
5. Backups: daily automated database backup + uploads/storage backup;
   perform and document one real restore test.
6. Cleanup: dead code, unused dependencies, legacy tokens (grep proof).
7. Cross-browser: Chrome, Safari iOS, Firefox, Samsung Internet on
   real or emulated devices.

Report with all evidence, STOP.
```

---

## المرحلة 8 — حزمة العرض والدمج

```
START PHASE 8 — Review pack and release. Branch: phase/08-release.

1. Screenshot matrix of every screen (390 / 768 / 1440 x AR / EN).
2. A 10-minute walkthrough video: visitor request -> admin handling via
   inbox -> trader deal -> wholesale -> brokerage from request to
   delivery.
3. Known-issues list (honest, with severity).
4. After my approval: merge into master with a merge commit, tag
   ui-v1.0, push. Do not deploy; deployment is a separate step.
Report, STOP.
```

---

## برومبت التدقيق المستقل (بعد المراحل 1، 2، 4، 5، 6، 7)

يُرسل في **جلسة جديدة** لا تعرف شيئاً عن التنفيذ.

```
MODE: INDEPENDENT VERIFICATION AUDIT. Read-only. Do not fix, commit,
migrate, or push. You may create temporary probes but must remove them
and report them.

Read docs/ui-planning/REMAINING-PLAN.md, the phase prompt for PHASE {N},
and the implementer's report for that phase.

1. Git: branch state, everything committed and pushed, diff stat,
   flag changes to auth, middleware, migrations, WhatsApp adapter, .env,
   Project A.
2. Run the full quality gate yourself and report exact output.
3. Verify every claim in the implementer's report with evidence
   (command output, file:line, live browser check, Playwright). Table:
   claim | verified / partial / false | evidence.
4. Test the phase's security and business rules live (ownership,
   roles, invalid transitions, no payment wording, no invented values).
5. Check every requirement in the phase prompt: done / missing.
6. Findings by severity: Critical / High / Medium / Low.

Write docs/ui-planning/AUDIT-PHASE-{N}.md. STOP.
```

---

## برومبتات الطوارئ

**إذا خالف الخطة:**

```
STOP. You deviated from REMAINING-PLAN.md ({what}). Re-read the standing
rules and the current phase prompt. Revert the deviation in a new commit
(no history rewrite), report what you changed, then continue only within
scope.
```

**إذا أراد إضافة ميزة أو مكتبة خارج المرحلة:**

```
Report it with the reason and the cost. Do not add it. Wait for my
answer.
```

**إذا فتحت جلسة جديدة وضاع السياق:**

```
New session. Paste the STANDING RULES. Read REMAINING-PLAN.md, the
latest AUDIT-*.md, and git log of the current branch. State: current
phase, what is done, what is next. Do nothing else until I confirm.
```

**إذا قال "لم أستطع التحقق بسبب البيئة":**

```
Not accepted without alternatives tried. Use Playwright from the
terminal, a fresh browser context, or a script. Report each attempt and
its exact error. If it is truly impossible, say what I should run
myself and the expected result.
```
