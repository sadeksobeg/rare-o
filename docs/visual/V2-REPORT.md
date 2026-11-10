# V2 REPORT — نظام الأيقونات

**الحالة:** مكتمل. **توقف هنا.** لا V3 حتى الموافقة.

---

## ماذا سُلِّم

- lucide-react خط 1.5، أحجام 16/20/24 على التنقل والـ KPI والشرائح والحالات الفارغة والإجراءات.
- استبدال حرف-كأيقونة: مبدّل اللغة (`Languages` + تسمية القاموس)، أسهم الصفحات والرجوع، أفاتار الصندوق/الملف (`UserRound` بدل الحرف الأول).
- `components/brand/icons/` — ستة رموز علامة + مجموعة آلات مؤقتة + رسوم 96–160 (empty-rings، category-plate، error-grain). كل ملف: `viewBox 24` (الأيقونات) أو 160 (الرسوم)، `stroke currentColor`، `stroke-width 1.5`، بلا ألوان ثابتة، معلَّم `temporary: designer replaces`.
- `AnimatedIcon`: رسم عند الدخول، نبضة عند تغيّر `pulseKey`، Lite يعرض الشكل مكتملاً. المعرض فقط على المسارات الحيّة (لا جزيرة عميل إضافية على المتجر).
- `/dev/ui#icons` · [docs/visual/ICON-MAP.md](ICON-MAP.md)
- لقطات AR/EN × 390/768/1440: لوحة الإدارة، بيت التاجر، حالة فارغة، معرض الأيقونات — [docs/visual/v2/](v2/)

---

## FIX 1 — First Load JS إنتاج

[docs/visual/baseline/js-sizes-prod.json](baseline/js-sizes-prod.json)

| المسار | قبل MotionProvider | بعد | Δ kB |
|---|---|---|---|
| Home `/` | 160 | 160 | 0 |
| Catalog | 158 | 158 | 0 |
| Product | 155 | 155 | 0 |
| Request | 129 | 129 | 0 |
| Admin | 124 | 124 | 0 |
| Trader | 123 | 123 | 0 |

`RO_SKIP_MOTION_PROVIDER=1` يتخطى الغلاف في مكوّن الخادم؛ الاستيراد الثابت لـ `MotionProvider` يبقى في جذر التخطيط، فالشظايا متطابقة (نفس الهاش) عند دقة 1 kB.

## FIX 2 — Lighthouse وسيط 5 (الماستر الحالي، يشمل F2)

[docs/visual/baseline/lighthouse-v0-current.json](baseline/lighthouse-v0-current.json) — 2026-10-22، `:3001`. البوابة 0.85 **لم تُخفض**.

| المسار | Perf وسيط | A11y | بوابة |
|---|---|---|---|
| home | 0.80 | 0.99 | راسب |
| catalog | 0.99 | 0.98 | ناجح |
| product | 0.84 | 0.99 | راسب |
| request | 0.87 | 0.95 | ناجح |
| admin-home | 1.00 | 0.95 | ناعم |
| trader-home | 1.00 | 0.95 | ناعم |

## دلتا JS من الأيقونات

استيرادات مسماة فقط (lucide + ملفات SVG محددة). لا برميل على صفحات الإنتاج.

`next build` بعد الأيقونات → `iconsAfter` / `iconDeltaKb` في [js-sizes-prod.json](baseline/js-sizes-prod.json):

| المسار | بعد MotionProvider | بعد الأيقونات | Δ kB |
|---|---|---|---|
| Home | 160 | 160 | 0 |
| Catalog | 158 | 158 | 0 |
| Product | 155 | 155 | 0 |
| Request | 129 | 129 | 0 |
| Admin | 124 | 124 | 0 |
| Trader | 123 | 123 | 0 |

دقة جدول Next هي 1 kB. شريحة صفحة `/request` نزلت من 7.39 kB إلى 7.32 kB. `/dev/ui` (404 في الإنتاج) First Load 140 → 144 kB (+4 kB للمعرض والمجموعة الكاملة). الاستيرادات الحية على المتجر: `EmptyRingsIllustration`، `OudIcon`/`CaseIcon`/`ViolinIcon`، lucide لشرائح الحالة.

---

## ملفات رئيسية

- `components/brand/icons/*`
- `components/motion/animated-icon.tsx`
- `components/dev/icon-gallery.tsx`
- `components/admin/locale-toggle.tsx` · `nav.tsx` · `kpi-tile.tsx`
- `components/ui/status-chip.tsx` · `empty-state.tsx`
- `app/not-found.tsx` · `app/dev/ui/page.tsx`
- `docs/visual/ICON-MAP.md`

لا صوت. لا Tabler. لا V3.
