# 2c first-commit — corrected SEE (next build && next start :3001)

**Text gates:** pass=9 fail=0 (no raw enums / `INVALID_PRODUCT` / `$US` / `0 USD` / `NaN` / `undefined`)

**Price note:** `qanun-select` `retailPrice=21832 USD` — seed catalog instrument demo data, not a shipping weight formula.

## Six key shots (distinct)

1. `s2c-lb-confirm-1440-ar.png` — Success state «تم تجهيز طلبك» + مرجع `RO-…`; الوجهة لبنان؛ تفضيل الشحن «يُحدَّد مع الفريق»؛ لا `INVALID_PRODUCT`.
2. `s2c-lb-confirm-390-ar.png` — نفس تأكيد الاستفسار على 390؛ أزرار واتساب/نسخ؛ سلة فارغة بعد الإرسال.
3. `s2c-pdp-estimator-open-390-ar.png` — السعر `21,832.00 US$`؛ المقدّر مفتوح وبطاقتا ألمانيا (الأرخص 130 / الأسرع 150) ظاهرتان؛ وصف «مختارات الموسم» مرة واحدة فقط في التفاصيل أعلاه.
4. `s2c-picker-open-390-ar.png` — قائمة مفتوحة مع حقل بحث «أرد»؛ علم + «الأردن» جنباً إلى جنب؛ ليس `<select>` أصلي.
5. `s2c-sim-jo-cards-1440-ar.png` — عنوان المعاينة: علم + «الأردن» بلا رمز JO؛ ثلاث بطاقات بشارات الأرخص/الأسرع/الأعلى أماناً تحت وسم «معاينة — غير معتمد».
6. `s2c-sim-sa-consol-1440-ar.png` — السعودية بلا رمز SA؛ تلميح التجميع مفتوح فوق بطاقة التجميع؛ بطاقة الأسرع ظاهرة.

## Supporting

- `s2c-sim-ae-1440-ar.png` — الإمارات: جوي تراثي + مندوب 60.
- `s2c-sim-lb-1440-ar.png` — لبنان معاينة استفسار/غير معتمد.
- `s2c-admin-inquiries-1440-ar.png` — صف استفسار LB من مسار العميل في صندوق الاستفسارات.
- `s2c-crop-jo-flag-2x.png` — علم الأردن عند تكبير 2x: مثلث أحمر + نجمة بيضاء.
