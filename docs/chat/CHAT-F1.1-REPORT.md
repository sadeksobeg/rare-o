# CHAT-F1.1 — تقرير الجولة (محلي فقط — ليس موافقة نشر)

**الفرع:** `chat/f1-fixes`  
**النطاق:** إصلاحات UI/خادم فقط. لا migrations. لا deploy.

## ما أُصلح

1. **ملحن التاجر تذييل تدفق عادي** — أُزيل `position:fixed`؛ عمود flex بارتفاع مقيّد (قشرة `100dvh` + `overflow:hidden`)؛ القائمة `flex:1` + scroll؛ الملحن أسفلها فوق شريط التبويب بفجوة ~8–9px.
2. **أيقونة الإرسال** — `Send` (ورقة/طائرة) مع `rtl:-scale-x-100` و`aria-label="إرسال"` بدل `ArrowUp` الذي كان يصبح سهمًا لأسفل في RTL.
3. **ترويسة الأدمن** — الاسم سطر 1؛ الشارات سطر 2 مع wrap؛ أقصى شارتين ثم `+N`. لا تقاطع مستطيلات مع العنوان (1440/1280/768/390).
4. **وسم النظام** — `phone-conflict` يبقى في DB؛ العرض «تعارض هاتف» في الترويسة والوسوم.
5. **هاتف فارغ** — `trim` قبل المطالبة بـ JID؛ اختبارات في `chat-f1-checks` تثبت: لا تجميع مشترك، لا شارة تعارض، لا مطابقة واتساب، محادثات `platform.local` منفصلة.
6. **تقرير LID** — `docs/chat/CHAT-F1.1-LID-REPORT.md` (بدون كود).
7. **كونسول** — أثناء اللقطات: تحذيرات WebGL/Three على شاشة الدخول فقط؛ **صفر أخطاء JS**؛ لا يظهر 429 كـ unhandled error.
8. **فلاتر الصندوق** — `flex-wrap` داخل عمود القائمة؛ «غير مرتبط» لم يعد مقصوصًا (`clipped: false` لكل الشرائح).

## البوابات

| بوابة | النتيجة |
|---|---|
| `npx tsx scripts/chat-f1-checks.ts` | **38 passed, 0 failed** (يشمل empty-phone) |
| `node scripts/chat-f1-trader-gate.mjs` | **PASS** (ملحن فوق التبويب، لا رسائل في الشريط، تباين ≥4.5، لا console errors جدية) |

## لقطات المالك — ما أراه فعلاً

| ملف | الحكم | ما أراه |
|---|---|---|
| `01-trader-390-composer.png` | ✅ | ملحن `position:static` فوق التبويب بفجوة ~9px؛ لا فقاعات بين الملحن والتبويب؛ أيقونة طائرة/`إرسال`؛ آخر رسالة فوق الملحن بعد التمرير |
| `02-trader-1440-dark-contrast.png` | ✅ | داكن، تباين جيد، ملحن تذييل static؛ إرسال paper-plane |
| `04-admin-composer-will-send.png` | ✅ | خيط محمّل (~74 فقاعة)؛ مؤشر «سيصل الرد عبر المنصة» ظاهر |
| `05-admin-fallback-or-channel.png` | ⚠️→✅ جزئي | فقاعة صادرة بنفسجية عليها شارة **«عبر المنصة»** للنص `fallback-retake-*`. **توست** `platformFallbackNotice` لم يُلتقَط في إعادة اللقطة (null) — الدليل البصري هو الشارة على الفقاعة لا جملة التوست |
| `06-admin-phone-conflict.png` | ✅ | اسم سطر 1؛ شارات سطر 2 بلا تداخل؛ وسم عربي «تعارض هاتف»؛ لا slug خام |
| `06b-admin-list-conflict.png` | ✅ | بعد الإصلاح: الشرائح تلتف؛ «غير مرتبط 16» كامل غير مقصوص |
| `07-trader-rate-limit.png` | ✅ | رسالة حمراء واضحة؛ المسودة باقية؛ ملحن سليم فوق التبويب |
| `08-trader-wa-media-placeholder.png` | ✅ | «مرفق من واتساب (غير متاح هنا)»؛ ملحن تذييل |

مسارات اللقطات: `docs/chat/shots/owner/`  
ملاحظات SEE: `docs/chat/shots/owner/NOTES.md`  
كونسول: `docs/chat/shots/owner/CONSOLE-ISSUES.md`

## كونسول (نص حرفي)

ليست أخطاء تطبيق ولا hydration caret-color. كلها من دخول الأدمن (شعار Three/WebGL):

1. `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
2–3،5–6. `[.WebGL-…] GPU stall due to ReadPixels`
4. `SVGLoader: createShapes() is deprecated. Use shapePath.toShapes() instead.`

**لا** أخطاء `429` / rate-limit في الكونسول.

## تقرير LID (ملخص)

انظر التفاصيل: `docs/chat/CHAT-F1.1-LID-REPORT.md`.

- `+861 …` على `@lid` = `participantE164` اعتُبر هاتفًا حقيقيًا (عادة من `senderPn`)، لا تنسيق أرقام LID الخام (المسار الحالي يرفض مرآة LID).
- وارد واتساب `@lid` **لا يُدمَج** تلقائيًا مع `trader-{id}@platform.local` ولا يضبط `traderId`. توحيد الشات بعد تعبئة الهاتف يحتاج وارد على JID الهاتف أو ربط يدوي — وإلا خيطان منفصلان.

## توقف

**STOP.** لا نشر. بانتظار قرار المالك.
