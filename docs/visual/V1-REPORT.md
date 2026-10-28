# V1 REPORT — أساس الحركة

**الحالة:** مكتمل. **توقف هنا.** لا V2 حتى الموافقة.

تاريخ الخط البصري: لقطات 2026-10-21. Lighthouse V0: 2026-10-19 (E1، وسيط 5).

---

## ماذا سُلِّم

- مرجع مقفل: [docs/ui-planning/VISUAL-MOTION-PLAN.md](../ui-planning/VISUAL-MOTION-PLAN.md) (تعديل D16 موثّق، PLAN.md لم يُعدَّل).
- خط أساس V0: [docs/visual/baseline/](baseline/)
  - `lighthouse-v0.json` — نسخة E1
  - `js-sizes.json` — أحجام **next-dev** (ليست ميزانية الإنتاج 25KB)
  - 36 لقطة: 6 مسارات × AR/EN × 390/768/1440
- رموز CSS: `--ro-dur-stagger`، `--ro-dur-ripple`، `--ro-ease-settle`، `--ro-ease-out-expo`؛ Lite و`prefers-reduced-motion` → 1ms
- مكتبة `components/motion/` بدون حزمة `motion`: MotionProvider، Reveal/Stagger، PressRipple، StringLine، DrawIn، TiltSurface، FlyToTarget (WAAPI)، CountUp، useScrollSpy، useAmbientMotion (توقف 5ث)
- المتجر: [components/storefront/motion/reveal.tsx](../../components/storefront/motion/reveal.tsx) يعيد تصدير Reveal الجديد
- مختبر `/dev/ui` قسم Motion: A/B/C/Lite + تقليل الحركة + عيّنة S1/S2/S6/S10
- اختبارات: 26 وحدة (اختيار المستوى)؛ Playwright chromium + `reducedMotion: reduce` على المختبر — المحتوى ظاهر والمستوى Lite والمدد 1ms

---

## دلتا Lighthouse

لم يُعد تشغيل وسيط 5 على `:3001` (يحتاج `next start`، ~20 د). القيم المرجعية V0 لم تتغير:

| المسار | Perf V0 | بوابة 0.85 |
|---|---|---|
| الرئيسية | 0.82 | راسب أصلاً |
| الكتالوج | 0.81 | راسب أصلاً |
| القطعة | 0.80 | راسب أصلاً |
| الطلب | 0.84 | راسب أصلاً |
| الإدارة | 0.87 | ناعم |
| التاجر | 0.87 | ناعم |

V1 لا يوصل S1–S10 إلى الصفحات الحقيقية. التغيير العام الوحيد: `MotionProvider` رقيق في التخطيط الجذر. لا يُتوقع تراجع LH من هذه الجولة. البوابة 0.85 **لم تُخفض** — قرار التنازل إن بقيت تحتها هو لـ V3/V6.

---

## دلتا الحزمة

- حزمة `motion` **غير مثبتة**.
- JS الإضافي على المتجر = مكوّن عميل واحد (`MotionProvider` + `resolve-tier`). البدائيات تُستورد في `/dev/ui` فقط (404 في الإنتاج).
- أرقام `js-sizes.json` من webpack التطوير (~7.6MB `main-app.js`) **لا تُقارن** بميزانية 25KB gz. قياس الإنتاج (`next build`) بوابة V3.

---

## ملفات رئيسية

- `docs/ui-planning/VISUAL-MOTION-PLAN.md`
- `docs/visual/baseline/*`
- `app/globals.css` (رموز + Lite)
- `app/layout.tsx` (MotionProvider)
- `components/motion/*`
- `components/storefront/motion/reveal.tsx`
- `components/dev/motion-gallery.tsx`
- `app/dev/ui/page.tsx`
- `scripts/e2-unit-checks.ts`
- `e2e/v1-motion-lab.spec.ts`
- `scripts/v1-baseline-capture.ts`

---

## مؤجّل إلى الجولات التالية

- **V2** نظام الأيقونات + `AnimatedIcon` + `components/brand/icons/`
- **V3** توصيل S1–S4 وS6–S9 للمتجر؛ قياس LH وJS إنتاج
- **V4** تشريح العود S5 على H7 (`#story`)
- **V5** تاجر B / إدارة C؛ توحيد `AnimatedValue` مع CountUp
- **V6** فيديوهات S1–S10 وبوابة القبول

لا صوت. لا Tabler. لا توصيل للهيدر/الهيرو/الكتالوج في V1.
