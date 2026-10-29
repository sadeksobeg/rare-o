# تقرير نقل تصميم كلود (design-lab) → التطبيق الحقيقي

**الفرع:** `feat/port-lab-to-real`  
**التاريخ:** 2026-10-29 / 2026-10-30  
**الغرض:** تقييم ما نُقل بعد مراجعة لاب كلود، وتمكين الاستمرار بنقل بقية التصاميم إلى المنصة الحية (Next 15 + Prisma) دون خلط اللاب بالتطبيق.

---

## 1. الملخص التنفيذي

بعد اعتماد لاب التجربة المعزول في `design-lab/` كنموذج بصري وتشغيلي مرجعي، بدأ نقل إيقاعه إلى **التطبيق الحقيقي** مع الحفاظ على:

- منطق الأعمال الحقيقي (Prisma / جلسات / انتقالات الحالة)
- قواعد الهوية (ink / sand / plum، خصائص منطقية، بدون Framer Motion في التطبيق الحقيقي)
- فصل اللاب عن الإنتاج: اللاب على `:3001`، التطبيق على `:3000`

**ما اكتمل عملياً في هذه الجولة:** دخول الإدارة/التاجر بإيقاع اللاب، تثبيت لوحة الإدارة من أعطال webpack، نطاق وساطة كامل تاجر↔إدارة مع مسار حالات واضح ورفع صور، وفريق/أمان ضمن النطاق المفحوص.

**ما لم يُنقل بعد (يحتاج جولات لاحقة بموافقة):** بقية شاشات اللاب (متجر، صفقة، جملة، حسابات، إلخ) بأمانة بصرية كاملة، ومكتبات اللاب المحظورة في التطبيق الحقيقي (`motion`/`cmdk`/`sonner` حتى مرحلة مخصصة).

---

## 2. مرجع اللاب مقابل التطبيق

| | design-lab | التطبيق الحقيقي |
|---|---|---|
| المسار | `design-lab/` | جذر المستودع |
| التشغيل | `npx next dev --port 3001` | `npm run dev` → `:3000` |
| البيانات | fixtures / محاكاة | PostgreSQL + Prisma |
| الحركة | Motion / GSAP / Three حيث وُجد | CSS فقط (`components/motion`) + عزل Three عند الحاجة |
| الهدف | عرض للعميل / معيار بصري | تشغيل إنتاجي محلي |

---

## 3. ما نُفّذ بعد رؤية تصميم كلود

### 3.1 استقرار لوحة الإدارة (قبل/أثناء النقل)

- إزالة/عزل استيرادات عميل خطرة من أغلفة الخادم التي كانت تسبب `undefined.call` وانهيارات webpack (مثل HomeAmbient / recharts على السيرفر، mounts ثقيلة في الشِل، PressRipple داخل مكوّنات خادمية).
- تحويل أجزاء من لوحة الإدارة إلى مكوّنات خادم آمنة أو mounts بعد التحميل.
- شريط جانبي داكن كامل الهوية، وتحسينات KPI / ActionQueue دون سحب مكتبات اللاب المحظورة.

### 3.2 طقس الدخول (Login ceremony)

- [`components/auth/login-form.tsx`](../components/auth/login-form.tsx): لوحة منقسمة + تبويبات إدارة/تاجر بنفس روح اللاب، مربوطة بإجراءات الدخول الحقيقية.
- صفحات [`app/admin/login`](../app/admin/login/page.tsx) و[`app/trader/login`](../app/trader/login/page.tsx) بنصوص اللاب.
- شعارات في `public/brand/`.
- إصلاح وميض الواجهة (جديد ثم قديم): إزالة Three.js من مسار الدخول؛ [`LogoSceneMount`](../components/brand/logo-scene-mount.tsx) أصبح حلقات CSS + شعار ثابت (كان R3F ينهار بعد الـ hydration).
- CSS مراسم الدخول في [`app/globals.css`](../app/globals.css) (`ro-login-*`).

**حسابات تجريبية شائعة محلياً:** `@rareoud.local` / `ChangeMeNow!` (إدارة وتاجر حسب الـ seed).

### 3.3 الوساطة — نطاق تشغيلي حقيقي (ليس stubs)

**خلفية:** نماذج Prisma `BrokerageRequest` / `Inspection` / `Quote` / `Event`، خدمة [`lib/brokerage/service.ts`](../lib/brokerage/service.ts)، انتقالات [`lib/brokerage/status.ts`](../lib/brokerage/status.ts)، إجراءات [`app/brokerage-actions.ts`](../app/brokerage-actions.ts).

**واجهات:**

| السطح | المسار |
|---|---|
| كانبان + جدول إدارة | `/admin/brokerage` |
| تفاصيل + playbook إدارة | `/admin/brokerage/[id]` |
| قائمة تاجر | `/trader/brokerage` |
| طلب جديد | `/trader/brokerage/new` |
| تفاصيل تاجر | `/trader/brokerage/[id]` |

**تحسين بصري:** شريط بطولي، بطاقات كانبان بنبض للعاجل، شارات حالة، خط زمني، CSS `ro-brokerage-*`.

### 3.4 توضيح مسار الحالات (كل الحالات)

مصدر نصوص موحّد: [`components/brokerage/labels.ts`](../components/brokerage/labels.ts)  
(مرحلة / معنى / خطوة تالية حسب جمهور إدارة|تاجر / من ينتظر).

- بطاقة «أين نحن الآن»: [`status-brief.tsx`](../components/brokerage/status-brief.tsx)
- مسار مراحل مع حالات جانبية ونهائية: [`lifecycle-rail.tsx`](../components/brokerage/lifecycle-rail.tsx)
- لوحة إدارة حسب الحالة (playbook): [`brokerage-admin-panel.tsx`](../components/admin/brokerage-admin-panel.tsx)  
  بعد المعاينة → بناء/إرسال العرض كأساسي؛ عند `QUOTE_SENT` → انتظار التاجر بلا نموذج مكرر؛ ثم شراء → شحن → تسليم → إغلاق.

### 3.5 رفع صور الوساطة

- حقل additive: `BrokerageRequest.photoPaths` (+ `BrokerageInspection.photoPaths` كان موجوداً).
- تخزين: `public/uploads/brokerage/{id}/` عبر [`lib/brokerage/media.ts`](../lib/brokerage/media.ts) (sharp على الخادم فقط).
- ثوابت آمنة للعميل: [`media-shared.ts`](../lib/brokerage/media-shared.ts) — **إصلاح حرج:** منع سحب `sharp`/`child_process` إلى العميل.
- UI: [`photo-field.tsx`](../components/brokerage/photo-field.tsx) + [`photo-gallery.tsx`](../components/brokerage/photo-gallery.tsx) في إنشاء الطلب، `NEEDS_INFO`، وتقرير المعاينة.

### 3.6 فريق وأمان

- التحقق من مسارات الفريق والأمان ضمن الجولة؛ صفحة فريق الإدارة موجودة تحت `/admin/team` وإعدادات الأمن تحت `/admin/settings/security` (ضمن الفرع).

### 3.7 تشغيل للعرض للعميل

- لاب التجربة يُشغَّل **منفصلاً**: من مجلد `design-lab` → `npx next dev --port 3001`.
- التطبيق الحقيقي: من الجذر → `npm run dev` → `:3000`.
- لا تخلط المنفذين عند العرض: اللاب = تصميم، `:3000` = تشغيل حقيقي.

---

## 4. مسار الوساطة المعتمد في التطبيق الحقيقي

```text
SUBMITTED ⇄ NEEDS_INFO
    ↓
ACCEPTED → INSPECTION_SCHEDULED → INSPECTED
    ↓
QUOTE_SENT → APPROVED | REJECTED
    ↓
PURCHASED → SHIPPED → DELIVERED → CLOSED
(+ DECLINED / CANCELLED كحالات إنهاء جانبية)
```

الانتقالات في الكود؛ الواجهة تشرح لكل حالة: المعنى، من ينتظر، والخطوة التالية.

---

## 5. تقييم الجودة (لحظة التقرير)

| المحور | التقييم | ملاحظة |
|---|---|---|
| فصل لاب / حقيقي | جيد | منافذ منفصلة؛ لا مشاركة بيانات |
| دخول بإيقاع اللاب | جيد | CSS ceremony؛ بدون Three على الدخول |
| وساطة وظيفية | جيد | دورة كاملة + صور |
| وضوح الحالات للإدارة | جيد بعد إعادة الصياغة | playbook + StatusBrief + rail |
| أمان bundling صور | مُصلَح | `media-shared` للعميل |
| أمانة بصرية 1:1 مع اللاب | جزئي | إيقاع وهوية؛ ليس نسخة pixel من كل شاشات اللاب |
| متجر عام | خارج هذه الجولة | لا إعادة تصميم كتالوج عام هنا |
| اعتماد مراحل MASTER-PLAN 3+ | غير مُستَنتَج | يتطلب موافقة مالك صريحة لكل مرحلة |

فحوص أُجريت على الملفات الملموسة: `tsc --noEmit` و`next lint` بعد دفعات الوساطة/الصور (ناجحة في الجلسة).

---

## 6. فجوة النقل — ماذا بقي من design-lab؟

مرجع شاشات اللاب (من سجلات ui-planning / commits): دخول، لوحة إدارة، تجّار، فريق/حسابات، رئيسية تاجر، متجر، وساطة (6 شاشات)، إلخ.

| منطقة اللاب | حالة النقل للتطبيق الحقيقي |
|---|---|
| Login ceremony | منقول ومربوط بأوث حقيقي |
| Admin dashboard إيقاع | منقول جزئياً مع تبسيط مكتبات |
| Brokerage admin/trader | منقول وظيفياً + polish + حالات + صور |
| Team / security shells | موجود/مفحوص ضمن الجولة؛ قد يحتاج polish بصري إضافي من اللاب |
| Storefront home / catalog look | **لم يُنقَل** في هذه الجولة |
| Trader home world-class من اللاب | جزئي — الصفحة موجودة؛ ليست نسخة كاملة من اللاب |
| cmdk / sonner / Framer Motion من اللاب | **متعمداً مؤجّل** حسب قواعد المشروع |
| Three.js مشاهد | عُزلت عن الدخول؛ تُقيَّم شاشة بشاشة |

---

## 7. توصيات لإكمال النقل (للجولة التالية)

1. **قائمة أولوية شاشات** من اللاب مقابل مسارات حقيقية (جدول مطابقة route ↔ lab page) واعتماد دفعة واحدة بموافقة المالك.
2. **نقل بصري بالدفعات:** شِل → قوائم → تفاصيل؛ بدون سحب `motion`/`cmdk`/`sonner` حتى مرحلة مكتبات صريحة.
3. **معيار قبول لكل شاشة:** لقطة لاب vs حقيقي، RTL، هيكل منطقي، لا انهيار webpack من استيراد عميل في سيرفر.
4. **عدم لمس واتساب الحقيقي** أو migrations مدمّرة دون إذن منفصل.
5. **إبقاء اللاب على :3001** كمرجع عرض للعميل أثناء النقل التدريجي.

---

## 8. أوامر تشغيل سريعة

```bash
# التطبيق الحقيقي
cd "D:\N I G H T\rare-oud-platform"
npm run dev
# → http://localhost:3000

# لاب كلود فقط (عرض للعميل)
cd "D:\N I G H T\rare-oud-platform\design-lab"
npx next dev --port 3001
# → http://localhost:3001
```

قاعدة البيانات المحلية: Docker Postgres على المنفذ المعتمد في `.env` (سابقاً `:5440`) عبر `npm run db:up` عند الحاجة.

---

## 9. ملفات مفتاحية أُنشئت/لُمِسَت في النقل

- دخول/هوية: `components/auth/login-form.tsx`, `components/brand/logo-scene-mount.tsx`, `app/globals.css`
- وساطة UI: `components/brokerage/*`, `components/admin/brokerage-admin-panel.tsx`, `components/trader/brokerage-*`
- وساطة منطق: `lib/brokerage/*`, `app/brokerage-actions.ts`, `prisma/schema.prisma` (+ migrate/push لحقل `photoPaths`)
- مسارات: `app/admin/(protected)/brokerage/**`, `app/trader/(protected)/brokerage/**`

---

## 10. الخلاصة للمقيّم / المنفّذ التالي

العمل بعد رؤية تصميم كلود **ليس** مجرد نسخ CSS: هو تثبيت التطبيق الحقيقي، نقل إيقاع الدخول والإدارة، وبناء **وساطة حية** بنفس روح اللاب مع مسار حالات واضح وصور. اللاب يبقى المرجع البصري المنفصل للعميل. إكمال النقل يعني جدول مطابقة شاشة-بشاشة لبقية `design-lab/` على الفرع `feat/port-lab-to-real` بدفعات قابلة للتحقق وموافقة مالك لكل توسّع مرحلي.
