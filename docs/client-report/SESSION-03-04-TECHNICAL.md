---
marp: true
theme: default
paginate: true
size: 16:9
title: RARE OUD — سجل التنفيذ التقني · 03 و 04
footer: RARE OUD · سجل التنفيذ · 22 أكتوبر 2026
---

<style>
section {
  direction: rtl;
  text-align: right;
  font-family: "Segoe UI", "Arabic Typesetting", Tahoma, sans-serif;
  background: #fbf6ee;
  color: #0b080d;
  padding: 46px 58px 58px;
  border-top: 5px solid #32104f;
  line-height: 1.45;
}
section::after {
  direction: ltr;
  font-family: "Segoe UI", Tahoma, sans-serif;
  font-size: 13px;
  letter-spacing: 0.14em;
  color: #6b6074;
}
footer {
  direction: rtl;
  font-size: 13px;
  color: #6b6074;
  letter-spacing: 0;
}
h1 {
  margin: 0 0 8px;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.25;
  color: #0b080d;
}
h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #32104f;
}
p { margin: 0; }
.kicker {
  display: block;
  margin: 0 0 8px;
  font-family: "Segoe UI", Tahoma, sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #8a5a22;
  direction: ltr;
  text-align: right;
  unicode-bidi: isolate;
}
.rule {
  width: 64px;
  height: 2px;
  margin: 14px 0 16px;
  border: 0;
  background: #b8863f;
}
.lede {
  max-width: 920px;
  margin: 0 0 18px;
  font-size: 18px;
  line-height: 1.55;
  color: #211a29;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 16px;
  line-height: 1.4;
}
th {
  padding: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #6b6074;
  text-align: right;
  border-bottom: 1px solid rgba(11, 8, 13, 0.16);
}
td {
  padding: 9px 0;
  vertical-align: top;
  border-bottom: 1px solid rgba(11, 8, 13, 0.1);
}
td.key {
  width: 168px;
  padding-left: 18px;
  font-weight: 700;
  color: #32104f;
  white-space: nowrap;
}
.ltr {
  direction: ltr;
  unicode-bidi: isolate;
  font-family: "Segoe UI", Consolas, monospace;
  font-size: 0.92em;
  font-weight: 600;
  color: #32104f;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}
.chip {
  display: inline-block;
  padding: 4px 10px;
  border: 1px solid rgba(50, 16, 79, 0.22);
  background: #fffaf3;
  font-family: "Segoe UI", Tahoma, sans-serif;
  font-size: 13px;
  font-weight: 650;
  direction: ltr;
  unicode-bidi: isolate;
}
section.lead {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: #0b080d;
  color: #fbf6ee;
  border-top: 5px solid #b8863f;
  padding-bottom: 72px;
}
section.lead h1 {
  color: #fbf6ee;
  font-size: 52px;
  max-width: 900px;
}
section.lead .kicker { color: #cfa25e; }
section.lead .rule { background: #b8863f; }
section.lead p { color: #e3d6c5; font-size: 20px; max-width: 760px; }
section.lead footer,
section.lead::after { color: rgba(251, 246, 238, 0.45); }
section.chapter {
  background: #32104f;
  color: #fbf6ee;
  border-top: 5px solid #b8863f;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
section.chapter h1 { color: #fbf6ee; font-size: 48px; }
section.chapter .kicker { color: #cfa25e; }
section.chapter p { color: #e9ddf3; font-size: 20px; max-width: 780px; }
section.chapter footer,
section.chapter::after { color: rgba(251, 246, 238, 0.5); }
.index {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 36px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 16px;
}
.index li {
  display: flex;
  gap: 12px;
  align-items: baseline;
  padding: 7px 0;
  border-bottom: 1px solid rgba(11, 8, 13, 0.1);
}
.index b {
  font-family: "Segoe UI", Tahoma, sans-serif;
  direction: ltr;
  unicode-bidi: isolate;
  color: #8a5a22;
  font-size: 14px;
  min-width: 36px;
}
.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.card {
  background: #fffaf3;
  border: 1px solid rgba(11, 8, 13, 0.1);
  padding: 16px 18px 14px;
}
.card h2 { margin-bottom: 8px; }
.card p { font-size: 15px; color: #211a29; }
.card ul {
  margin: 0;
  padding: 0 18px 0 0;
  font-size: 15px;
}
.card li { margin: 4px 0; }
</style>

<!-- _class: lead -->

<p class="kicker">RARE OUD · TECHNICAL RECORD</p>
<h1>بوابة التاجر<br>والطلبات</h1>
<hr class="rule" />
<p>سجل التشغيل للأقسام 03 و 04، بالترتيب نفسه في جدول النطاق، وعلى المسارات العاملة في المنصة.</p>

---

<p class="kicker">READING ORDER</p>
<h1>عشرة بنود، ترتيب الجدول</h1>
<hr class="rule" />
<p class="lede">كل شريحة تالية تقابل بنداً واحداً: اسمه في الجدول، ثم الآلية التي تعمل اليوم، ثم المسار الذي تُرى منه.</p>

<ul class="index">
  <li><b>3.1</b><span>تسجيل التاجر وإعداده</span></li>
  <li><b>3.2</b><span>متابعة حالة الصفقة</span></li>
  <li><b>3.3</b><span>رؤية الطلبات الخاصة</span></li>
  <li><b>3.4</b><span>مركز الإشعارات</span></li>
  <li><b>3.5</b><span>عرض موحّد للمتسوق</span></li>
  <li><b>3.6</b><span>منطق تعارض الصفقات</span></li>
  <li><b>3.7</b><span>اقتراح الصفقة من التاجر</span></li>
  <li><b>4.1</b><span>تحويل الطلب إلى واتساب</span></li>
  <li><b>4.2</b><span>سجل إدارة الطلبات</span></li>
  <li><b>4.3</b><span>دورة حالة الطلب</span></li>
</ul>

---

<p class="kicker">THREE RECORDS</p>
<h1>ثلاثة سجلات منفصلة</h1>
<hr class="rule" />
<p class="lede">المنصة تحتفظ بكل معاملة في سجلها. ملكية القطعة تبقى لـ RARE OUD، والتاجر يتعامل مع الصفقة والجملة من حساب تُنشئه الإدارة.</p>

<div class="pair">
  <div class="card">
    <h2>طلب التجزئة</h2>
    <p><span class="ltr">RetailRequest</span> من سلة الزائر. بنود، وجهة، شحن، ورسالة تحويل محفوظة. إدارته في لوحة الإدارة حتى الإغلاق.</p>
  </div>
  <div class="card">
    <h2>الصفقة والعرض العام</h2>
    <p><span class="ltr">DealProposal</span> مع خيط <span class="ltr">NegotiationEntry</span>. الظهور في المتجر يتم بعرض منسّق <span class="ltr">PublicCuratedOffer</span> تنشره الإدارة.</p>
  </div>
</div>
<div class="card" style="margin-top: 18px;">
  <h2>طلب الجملة</h2>
  <p><span class="ltr">WholesaleRequest</span> سجل ثالث. يدخل في عزل الرؤية وفي مركز إشعارات التاجر، ويبقى خارج طلبات زوّار المتجر.</p>
</div>

---

<!-- _class: chapter -->

<p class="kicker">SECTION 03</p>
<h1>بوابة التاجر والصفقات</h1>
<hr class="rule" />
<p>Vendor Portal &amp; Trader Deals · من إنشاء الحساب حتى اقتراح الصفقة وظهورها بهوية الدار.</p>

---

<p class="kicker">3.1 · VENDOR REGISTRATION &amp; ONBOARDING</p>
<h1>تسجيل التاجر وإعداده</h1>
<hr class="rule" />
<p class="lede">الحساب يُنشأ من لوحة الإدارة. التاجر يدخل فضاءه من صفحة الدخول، بحالة نشط أو معطّل.</p>

<table>
  <tr><td class="key">من ينشئ</td><td>الإدارة، من <span class="ltr">/admin/traders</span>: البريد، الاسم الظاهر، الشركة، الهاتف، وكلمة المرور. الكلمة تُحفظ بصمةً، والملاحظات الإدارية تبقى داخل السجل.</td></tr>
  <tr><td class="key">حالة الحساب</td><td><span class="ltr">active</span> أو <span class="ltr">disabled</span>. التعطيل يوقف الدخول من غير حذف الصفقات أو طلبات الجملة المرتبطة.</td></tr>
  <tr><td class="key">الدخول</td><td><span class="ltr">/trader/login</span>. بعد الدخول: ترويسة البوابة، التبويبات، وقائمة الجوال. الهوية في الجلسة هي التي تُقيّد كل قراءة لاحقة.</td></tr>
  <tr><td class="key">ما يُرى</td><td>إنشاء حساب، تفعيله، دخوله، ووصوله إلى الرئيسية التي تعرض ما ينتظر إجراءه.</td></tr>
</table>

---

<p class="kicker">3.2 · VENDOR DEAL STATUS TRACKING</p>
<h1>متابعة حالة الصفقة</h1>
<hr class="rule" />
<p class="lede">كل صفقة تحمل مرجعاً وحالة، والتاجر يتابعها من مساحته: قائمة، تبويب، وتفصيل فيه خيط التفاوض.</p>

<table>
  <tr><td class="key">دورة الحالة</td><td>
    <span class="chips">
      <span class="chip">proposed · مقترحة</span>
      <span class="chip">negotiating · تفاوض</span>
      <span class="chip">accepted · مقبولة</span>
      <span class="chip">rejected · مرفوضة</span>
      <span class="chip">closed · مغلقة</span>
    </span>
  </td></tr>
  <tr><td class="key">قائمة التاجر</td><td><span class="ltr">/trader/deals</span> بأربعة تبويبات: الكل، بانتظارك، تفاوض، مغلقة. «بانتظارك» يُحسب من آخر حركة في الخيط، لا من وسم يدوي.</td></tr>
  <tr><td class="key">التفصيل</td><td><span class="ltr">/trader/deals/[id]</span> يعرض الشريحة، السعر المقترح، الكمية، الشروط، وسلسلة الإدخالات: اقتراح، متابعة، عرض مقابل، قبول، رفض، إغلاق.</td></tr>
  <tr><td class="key">التفضيلات</td><td>في <span class="ltr">/trader/profile</span> يحفظ التاجر فئات الاهتمام وملاحظة حرة. الحقلان للإدارة عند مطابقة الصفقة، ويظهران في سجل الحساب.</td></tr>
</table>

---

<p class="kicker">3.3 · VENDOR ORDER VISIBILITY</p>
<h1>رؤية الطلبات الخاصة</h1>
<hr class="rule" />
<p class="lede">قراءة الصفقة وطلب الجملة مربوطة بهوية الجلسة على الخادم. تغيير المعرّف في المسار لا يفتح سجل تاجر آخر.</p>

<table>
  <tr><td class="key">قيد القراءة</td><td>الاستعلام يشترط <span class="ltr">traderId</span> الخاص بالجلسة في قائمة الصفقات، تفصيل الصفقة، الجملة، وتفصيل طلب الجملة.</td></tr>
  <tr><td class="key">قيد الكتابة</td><td>إضافة حركة تفاوض من التاجر تُرفض إن لم يكن هو مالك الصفقة، أو إن كانت الصفقة قد أُغلقت.</td></tr>
  <tr><td class="key">حدّ «طلباته»</td><td>ما يراه التاجر: صفقاته وطلبات الجملة الخاصة به. طلبات تجزئة الزوّار تبقى في <span class="ltr">/admin/requests</span>.</td></tr>
  <tr><td class="key">ما يُرى</td><td>تاجران على الحساب نفسه لا يشتركان في قائمة، ولا في إشعار، ولا في رابط تفصيل.</td></tr>
</table>

---

<p class="kicker">3.4 · VENDOR NOTIFICATIONS &amp; STATUS CENTER</p>
<h1>مركز الإشعارات</h1>
<hr class="rule" />
<p class="lede">الإشعار سجل داخل البوابة، ثنائي اللغة، برابط يفتح الصفقة أو طلب الجملة. الجرس في الترويسة يعرض عدد غير المقروء.</p>

<table>
  <tr><td class="key">المسار</td><td><span class="ltr">/trader/notifications</span>. تعليم رسالة واحدة مقروءة، أو تعليم الكل. الرسالة تحمل عنواناً ومتناً بالعربية والإنجليزية.</td></tr>
  <tr><td class="key">صفقة</td><td>عند حركة الإدارة على خيط التفاوض: قبول، رفض، إغلاق، عرض مقابل، أو متابعة. الرفض يُرفق بسبب الرسالة إن وُجد.</td></tr>
  <tr><td class="key">جملة</td><td>عند عرض سعر من الإدارة، وعند تغيير حالة طلب الجملة. الرابط يفتح <span class="ltr">/trader/wholesale/[id]</span>.</td></tr>
  <tr><td class="key">شكل الوصول</td><td>المركز صندوق سحب داخل البوابة. التاجر يراه عند فتح المساحة، مع الشارة على الجرس.</td></tr>
</table>

---

<p class="kicker">3.5 · UNIFIED DEALS STOREFRONT DISPLAY</p>
<h1>عرض موحّد للمتسوق</h1>
<hr class="rule" />
<p class="lede">ما يراه زائر المتجر عرضٌ منسّق بهوية RARE OUD. اسم التاجر وحسابه ليسا من حقول العرض العام.</p>

<table>
  <tr><td class="key">السجل</td><td><span class="ltr">PublicCuratedOffer</span>: عنوان وملخص بالعربية والإنجليزية، ترتيب، وحالة <span class="ltr">draft</span> أو <span class="ltr">published</span> أو <span class="ltr">unpublished</span>.</td></tr>
  <tr><td class="key">المتجر</td><td><span class="ltr">/offers</span> و<span class="ltr">/offers/[slug]</span> يعرضان المنشور فقط، مرتّباً ثم بالأحدث نشراً.</td></tr>
  <tr><td class="key">البوابة</td><td>التاجر المسجّل يرى العروض المنشورة نفسها من <span class="ltr">/trader/offers</span>، بالنص العام نفسه.</td></tr>
  <tr><td class="key">شرط النشر</td><td>عنوان عربي، ملخص عربي، وقطعة أو إقرار لوحة. إن رُبط العرض بصفقة، فالنشر ينتظر أن تكون تلك الصفقة <span class="ltr">accepted</span>.</td></tr>
</table>

---

<p class="kicker">3.6 · DEAL CONFLICT VALIDATION LOGIC</p>
<h1>منطق تعارض الصفقات</h1>
<hr class="rule" />
<p class="lede">التعارض يُلتقط على صفقات الكتالوج حين تقبل الإدارة. الصفقة الأخرى تُعرض في لوحة القرار: المرجع، التاجر، والحالة.</p>

<table>
  <tr><td class="key">متى يُفحص</td><td>عند قبول الإدارة لصفقة كتالوج مربوطة بمنتج. الفحص يستثني الصفقة الجارية ويُبقي صفقات التجار الآخرين.</td></tr>
  <tr><td class="key">ما يُعدّ انشغالاً</td><td>الحالات <span class="ltr">proposed</span> و<span class="ltr">negotiating</span> و<span class="ltr">accepted</span> على المنتج نفسه. المغلقة والمرفوضة تخرج من الفحص.</td></tr>
  <tr><td class="key">أين يظهر</td><td>تحذير في نموذج التفاوض بعد تسجيل القبول، بعنوان «صفقات نشطة أخرى على نفس المنتج»، وسطراً لكل مرجع.</td></tr>
  <tr><td class="key">قرار الدار</td><td>الاقتراح من التاجر يُستقبل ويُسجَّل. رؤية التداخل تُوضع أمام الإدارة في لحظة القبول، والقرار التجاري يبقى عندها.</td></tr>
</table>

---

<p class="kicker">3.7 · VENDOR-PROPOSED DEALS &amp; PROMOTIONS</p>
<h1>اقتراح الصفقة من التاجر</h1>
<hr class="rule" />
<p class="lede">التاجر يقدّم الطلب من بوابته. الطلب يبدأ مقترحاً داخلياً، والمتجر لا ينشره إلا بعد أن تنشئ الإدارة عرضاً عاماً وتعتمده.</p>

<table>
  <tr><td class="key">المعالج</td><td><span class="ltr">/trader/deals/new</span> بمسارين: كتالوج، أو خارج الكتالوج. الكتالوج يشير إلى قطعة قائمة من غير نقل ملكيتها. المسار الآخر لا يقبل ربط قطعة.</td></tr>
  <tr><td class="key">ما يُحفظ</td><td>مرجع، عنوان، سعر مقترح، عملة، كمية، وشروط. أول إدخال في الخيط نوعه <span class="ltr">propose</span> ودوره التاجر، والحالة <span class="ltr">proposed</span>.</td></tr>
  <tr><td class="key">بعدها</td><td>الإدارة ترد من <span class="ltr">/admin/deals/[id]</span>: متابعة، عرض مقابل، قبول، رفض، أو إغلاق. كل حركة تُضاف إلى الخيط وتحدّث الحالة.</td></tr>
  <tr><td class="key">باب المتجر</td><td>العرض العام يُنشأ يدوياً. الربط بصفقة اختياري، وإن وُجد فالزر النشر يبقى مغلقاً حتى القبول.</td></tr>
</table>

---

<!-- _class: chapter -->

<p class="kicker">SECTION 04</p>
<h1>الطلبات والتحويل</h1>
<hr class="rule" />
<p>Orders &amp; Checkout · من تجهيز السلة حتى إغلاق الطلب داخل لوحة الإدارة.</p>

---

<p class="kicker">4.1 · WHATSAPP CHECKOUT HANDOFF</p>
<h1>تحويل الطلب إلى واتساب</h1>
<hr class="rule" />
<p class="lede">إرسال نموذج الطلب يبني نص المحادثة ورابط واتساب من محتوى السلة، ويحفظهما مع المرجع. فتح الرابط يُسجَّل على الطلب نفسه.</p>

<table>
  <tr><td class="key">من السلة</td><td>المسار <span class="ltr">/request</span> ينشئ <span class="ltr">RetailRequest</span> بحالة <span class="ltr">ready_for_handoff</span>. مفتاح منع التكرار يمنع طلباً ثانياً عند إعادة الإرسال.</td></tr>
  <tr><td class="key">نص الرسالة</td><td>بلغة الجلسة: المرجع، الاسم، الهاتف، الوجهة، تفضيل الشحن، المجموع، البنود بالكمية والإجمالي، والملاحظات. السطر الأخير يوضّح أن هذا تحويل طلب.</td></tr>
  <tr><td class="key">الرابط</td><td><span class="ltr">wa.me</span> برقم العمل، والنص مُعبّأ مسبقاً. الرابط يُفتح من المتجر بعد النجاح، ومن صفحة الطلب في الإدارة.</td></tr>
  <tr><td class="key">الأثر</td><td>حدث <span class="ltr">prepared</span> عند التجهيز، و<span class="ltr">opened</span> عند الفتح. إعادة توليد الرسالة تتم على الطلب القائم من غير مرجع جديد.</td></tr>
</table>

---

<p class="kicker">4.2 · ORDER MANAGEMENT SYSTEM</p>
<h1>سجل إدارة الطلبات</h1>
<hr class="rule" />
<p class="lede">كل طلب تجزئة ملف داخلي من لحظة الاستلام: هوية العميل، البنود كما ثُبّتت، رسالة التحويل، وآخر حدث.</p>

<table>
  <tr><td class="key">القائمة</td><td><span class="ltr">/admin/requests</span>: تصفية بالحالة، بحث بالمرجع أو الاسم أو الهاتف، ترقيم صفحات، وعمود لآخر حدث تحويل.</td></tr>
  <tr><td class="key">التفصيل</td><td><span class="ltr">/admin/requests/[id]</span>: الاسم، الهاتف، الملاحظات، الوجهة، الشحن، البنود بأسعارها المحفوظة، نص الرسالة، والحمولة المنظمة.</td></tr>
  <tr><td class="key">الثبات</td><td>اسم القطعة وسعر السطر يُنسخان داخل بند الطلب. تعديل لاحق في الكتالوج لا يعيد كتابة الملف.</td></tr>
  <tr><td class="key">الربط</td><td>قسم المحادثة في صفحة الطلب يفتح صندوق الوارد عندما تكون محادثة مربوطة بهذا المرجع.</td></tr>
</table>

---

<p class="kicker">4.3 · REAL-TIME ORDER STATUS</p>
<h1>دورة حالة الطلب</h1>
<hr class="rule" />
<p class="lede">انتقال الحالة يمر من جدول مسموح على الخادم. بعد الحفظ تتحدث قائمة الطلبات، صفحة التفصيل، طابور الرئيسية، وموجز النشاط.</p>

<table>
  <tr><td class="key">الحالات</td><td>
    <span class="chips">
      <span class="chip">draft</span>
      <span class="chip">ready_for_handoff</span>
      <span class="chip">handoff_opened</span>
      <span class="chip">in_follow_up</span>
      <span class="chip">completed</span>
      <span class="chip">cancelled</span>
    </span>
  </td></tr>
  <tr><td class="key">المسموح</td><td>من الجاهز إلى «فُتح التحويل». من المفتوح إلى متابعة أو مكتمل أو ملغى. من المتابعة إلى مكتمل أو ملغى. المكتمل والملغى نهائيان.</td></tr>
  <tr><td class="key">السجل</td><td>شريط تقدّم وشريحة حالة في التفصيل. كل انتقال يكتب <span class="ltr">RetailHandoffEvent</span>: من، إلى، الفاعل، وملاحظة اختيارية.</td></tr>
  <tr><td class="key">الفورية</td><td>التحديث يظهر في لوحة الإدارة مع اكتمال الإجراء: القائمة، التفصيل، الطابور، والموجز. حالة الطلب تُدار من هذه اللوحة.</td></tr>
</table>

---

<p class="kicker">SURFACES WALKED</p>
<h1>المسارات التي يقوم عليها السجل</h1>
<hr class="rule" />

<div class="pair">
  <div class="card">
    <h2>بوابة التاجر</h2>
    <ul>
      <li><span class="ltr">/trader/login</span> الدخول</li>
      <li><span class="ltr">/trader/deals</span> الحالات الأربع</li>
      <li><span class="ltr">/trader/deals/new</span> الاقتراح</li>
      <li><span class="ltr">/trader/notifications</span> المركز والجرس</li>
      <li><span class="ltr">/trader/profile</span> فئات الاهتمام</li>
      <li><span class="ltr">/trader/offers</span> العروض المنشورة</li>
    </ul>
  </div>
  <div class="card">
    <h2>الإدارة والمتجر</h2>
    <ul>
      <li><span class="ltr">/admin/traders</span> إنشاء الحساب وحالته</li>
      <li><span class="ltr">/admin/deals/[id]</span> الخيط وتحذير التعارض</li>
      <li><span class="ltr">/admin/offers</span> صياغة العرض ونشره</li>
      <li><span class="ltr">/offers</span> الواجهة الموحّدة للزائر</li>
      <li><span class="ltr">/request</span> تجهيز التحويل</li>
      <li><span class="ltr">/admin/requests</span> السجل ودورة الإغلاق</li>
    </ul>
  </div>
</div>

---

<!-- _class: lead -->

<p class="kicker">03 · 04</p>
<h1>الحساب، الصفقة،<br>والطلب.</h1>
<hr class="rule" />
<p>ثلاثة سجلات، هوية واحدة أمام المتسوق، وتحويل واتساب محفوظ على مرجع الطلب من التجهيز حتى الإغلاق.</p>
