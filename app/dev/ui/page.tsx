import { notFound } from "next/navigation";
import { Rings, Grain, Axis, Emblem } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "@/components/ui/loader";
import { MaterialPlate } from "@/components/storefront/material-plate";
import { PrimitivesB1Gallery } from "@/components/dev/primitives-b1-gallery";
import { PrimitivesB2Gallery } from "@/components/dev/primitives-b2-gallery";
import { MotionGallery } from "@/components/dev/motion-gallery";
import { IconGallery } from "@/components/dev/icon-gallery";
import { DevToastDemo } from "@/components/dev/toast-demo";
import { DashboardDomainChartMount } from "@/components/admin/dashboard-domain-chart-mount";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getRequestLocale } from "@/lib/i18n/server";

export const metadata = {
  title: "RARE OUD — UI gallery (dev)",
  robots: { index: false, follow: false },
};

const SWATCHES = [
  ["ink-950", "#0B080D"],
  ["ink-600", "#4B4056"],
  ["plum-900", "#32104F"],
  ["sand-100", "#F4E7D8"],
  ["sand-50", "#FBF6EE"],
  ["sand-200", "#EFE3D4"],
  ["amber-500", "#B8863F"],
  ["success-100", "#DCEBDD"],
  ["danger-100", "#F4DADC"],
] as const;

const CONTRAST = [
  ["ink-950 on sand-100", "16.37"],
  ["ink-600 on sand-100", "7.97"],
  ["plum-900 on sand-100", "13.06"],
  ["sand-100 on ink-950", "16.37"],
  ["amber-600 on sand-100", "4.84"],
] as const;

export default async function DevUiPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const locale = await getRequestLocale();
  const dict = getDictionary(locale);
  const b1 =
    locale === "ar"
      ? {
          locale: "ar" as const,
          switchOn: dict.common.switchOn,
          switchOff: dict.common.switchOff,
          selectLabel: "الدولة",
          selectHelper: "اختر من القائمة",
          selectError: "هذا الحقل مطلوب",
          selectDisabled: "غير متاح حالياً",
          optA: "سوريا",
          optB: "الإمارات",
          optC: "أخرى",
          checkLabel: "أوافق على المتابعة",
          checkDisabled: "خيار معطّل",
          checkError: "يجب الموافقة للمتابعة",
          radioGroup: "طريقة التواصل",
          radioA: "واتساب",
          radioB: "هاتف",
          switchLabel: "الإشعارات",
          switchDisabled: "خيار النظام",
          cardPlain: "بطاقة عادية",
          cardInverse: "بطاقة معكوسة",
          cardMedia: "بطاقة بوسائط",
          cardInteractive: "بطاقة تفاعلية (رابط)",
          cardBody: "نص توضيحي قصير داخل البطاقة.",
          tabsLabel: "أقسام العرض",
          tabOne: "الكل",
          tabTwo: "غير مقروءة",
          tabThree: "معطّل",
          tabPanel: "محتوى اللوحة",
          menuLabel: "إجراءات",
          menuEdit: "تعديل",
          menuShare: "مشاركة",
          menuDelete: "حذف",
          menuDisabled: "غير متاح",
          statesTitle: "الحالات",
          defaultState: "افتراضي",
          errorState: "خطأ",
          disabledState: "معطّل",
        }
      : {
          locale: "en" as const,
          switchOn: dict.common.switchOn,
          switchOff: dict.common.switchOff,
          selectLabel: "Country",
          selectHelper: "Choose from the list",
          selectError: "This field is required",
          selectDisabled: "Unavailable right now",
          optA: "Syria",
          optB: "UAE",
          optC: "Other",
          checkLabel: "I agree to continue",
          checkDisabled: "Disabled option",
          checkError: "Consent is required",
          radioGroup: "Contact method",
          radioA: "WhatsApp",
          radioB: "Phone",
          switchLabel: "Notifications",
          switchDisabled: "System option",
          cardPlain: "Plain card",
          cardInverse: "Inverse card",
          cardMedia: "Media card",
          cardInteractive: "Interactive card (link)",
          cardBody: "Short supporting copy inside the card.",
          tabsLabel: "Demo sections",
          tabOne: "All",
          tabTwo: "Unread",
          tabThree: "Disabled",
          tabPanel: "Panel content",
          menuLabel: "Actions",
          menuEdit: "Edit",
          menuShare: "Share",
          menuDelete: "Delete",
          menuDisabled: "Unavailable",
          statesTitle: "States",
          defaultState: "default",
          errorState: "error",
          disabledState: "disabled",
        };

  return (
    <div className="min-h-screen bg-ro-canvas text-ro-ink">
      <SonnerToaster />
      <header className="border-b border-ro-border px-6 py-6">
        <p className="ro-type-overline text-ro-plum">DEV ONLY · /dev/ui</p>
        <h1 className="ro-type-h1 mt-2">UI Foundations Gallery</h1>
        <p className="mt-2 max-w-2xl text-ro-text-2">
          Locale: <bdi>{locale}</bdi> · calibrate{" "}
          <code className="text-sm">--ro-display-scale</code> /{" "}
          <code className="text-sm">--ro-ui-scale</code> only. Production returns
          404.
        </p>
      </header>

      <main id="main-content" className="mx-auto max-w-5xl space-y-16 px-6 py-12">
        <section className="space-y-4">
          <h2 className="ro-type-h2">Palette</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {SWATCHES.map(([name, hex]) => (
              <div key={name} className="space-y-2">
                <div
                  className="aspect-[4/3] rounded-[var(--ro-r-sm)] border border-ro-border"
                  style={{ background: hex }}
                />
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-ro-muted">
                  <bdi>{hex}</bdi>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="ro-type-h2">Contrast (verified pairs)</h2>
          <ul className="divide-y divide-ro-border border border-ro-border bg-ro-paper">
            {CONTRAST.map(([pair, ratio]) => (
              <li
                key={pair}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>{pair}</span>
                <span className="tabular-nums text-ro-plum">{ratio}:1</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="ro-type-h2">Type scale</h2>
          <div className="space-y-4 rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper p-6">
            <p className="ro-type-display-xl">
              {locale === "ar" ? "عودٌ نادر، صُنع ليبقى" : "A rare oud, made to last."}
            </p>
            <p className="ro-type-h1">
              {locale === "ar" ? "عنوان الصفحة" : "Page title"}
            </p>
            <p className="ro-type-h2">
              {locale === "ar" ? "عنوان القسم" : "Section title"}
            </p>
            <p className="ro-type-overline">RARE OUD</p>
            <p className="text-ro-text-2">
              {locale === "ar"
                ? "نص واجهة بخط IBM Plex Sans Arabic — فصحى راقية قصيرة."
                : "UI body in Source Sans 3 — formal English secondary."}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="ro-type-h2">Motifs</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="ro-inverse flex aspect-square items-center justify-center rounded-[var(--ro-r-sm)] p-8">
              <Rings className="h-full w-full text-ro-canvas" amberRingIndex={2} idle />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-[var(--ro-r-sm)] bg-ro-ink text-ro-canvas">
              <Grain className="absolute inset-0 h-full w-full" opacity={0.14} />
              <p className="relative z-10 flex h-full items-center justify-center ro-type-overline">
                Grain
              </p>
            </div>
            <div className="flex aspect-square flex-col items-center justify-center gap-6 rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper">
              <Axis height={80} withAmberDot className="bg-ro-ink opacity-80" />
              <Emblem variant="small" />
            </div>
          </div>
        </section>

        <section className="ro-inverse space-y-6 rounded-[var(--ro-r-sm)] p-8">
          <h2 className="ro-type-h2">Inverse surface</h2>
          <p className="max-w-xl text-ro-text-2">
            {locale === "ar"
              ? "الحلقات والكريمي على الحبر — مرجع لوحة الهوية."
              : "Rings and cream on ink — brand-board reference."}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="inverse-primary">
              {locale === "ar" ? "استكشف المجموعة" : "Explore the collection"}
            </Button>
            <Button variant="text" className="text-ro-canvas">
              {locale === "ar" ? "قصتنا" : "Our story"}
            </Button>
            <Axis height={48} className="bg-ro-canvas opacity-40" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="ro-type-h2">Primitives (P1)</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Loader label="loading" />
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusChip tone="info" label="submitted" />
            <StatusChip tone="attention" label="waiting" />
            <StatusChip tone="success" label="accepted" />
            <StatusChip tone="danger" label="failed" />
          </div>
          <Banner tone="info">
            {locale === "ar"
              ? "مثال على شريط تنبيه هادئ."
              : "Sample calm banner."}
          </Banner>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="aspect-[4/5]" />
            <Skeleton className="aspect-[4/5]" />
            <Skeleton className="aspect-[4/5]" />
          </div>
          <div className="mx-auto max-w-xs">
            <MaterialPlate caption={dict.catalog.photoCaption} />
          </div>
          <EmptyState
            title={locale === "ar" ? "لا نتائج" : "No results"}
            body={locale === "ar" ? "جرّب مسح الفلاتر." : "Try clearing filters."}
            actionHref="/catalog"
            actionLabel={locale === "ar" ? "الكتالوج" : "Catalog"}
          />
        </section>

        <section className="space-y-4" id="p2-b1">
          <h2 className="ro-type-h2">
            {locale === "ar"
              ? "بدائيات P2 — الشريحة B1"
              : "P2 primitives — Slice B1"}
          </h2>
          <p className="max-w-2xl text-sm text-ro-text-2">
            {locale === "ar"
              ? "Select · Checkbox/Radio · Switch · Card · Tabs · Menu/Popover — الحالات، والعربية/الإنجليزية عبر مبدّل اللغة، والفاتح و.ro-inverse."
              : "Select · Checkbox/Radio · Switch · Card · Tabs · Menu/Popover — all states; AR/EN via locale switch; light and .ro-inverse."}
          </p>
          <PrimitivesB1Gallery copy={b1} />
        </section>

        <section className="space-y-4" id="p2-b2">
          <h2 className="ro-type-h2">
            {locale === "ar"
              ? "بدائيات P2 — الشريحة B2"
              : "P2 primitives — Slice B2"}
          </h2>
          <p className="max-w-2xl text-sm text-ro-text-2">
            {locale === "ar"
              ? "Timeline · KeyValueList · Pagination · Breadcrumb · Divider، ومواءمة الجزئية: Button · TextField · StatusChip · Dialog · Toast · Skeleton · EmptyState · Banner · Loader · Stepper."
              : "Timeline · KeyValueList · Pagination · Breadcrumb · Divider, plus PARTIAL alignment: Button · TextField · StatusChip · Dialog · Toast · Skeleton · EmptyState · Banner · Loader · Stepper."}
          </p>
          <PrimitivesB2Gallery
            copy={
              locale === "ar"
                ? {
                    locale: "ar",
                    dict,
                    sectionLight: "سطح فاتح",
                    sectionInverse: "سطح .ro-inverse",
                    btnPrimary: "حفظ",
                    btnSecondary: "إلغاء",
                    btnText: "تفاصيل",
                    btnDanger: "حذف",
                    btnQuiet: "المزيد",
                    btnInverseP: "استكشف",
                    btnInverseS: "قصتنا",
                    btnRipple: "ابتدائي مع تموج",
                    fieldLabel: "الاسم",
                    fieldHelper: "كما يظهر للعميل",
                    fieldError: "هذا الحقل مطلوب",
                    fieldDense: "حقل مكثّف (40)",
                    fieldCounter: "ملاحظة قصيرة",
                    areaLabel: "التفاصيل",
                    dialogOpen: "فتح الحوار",
                    dialogTitle: "تفاصيل السجل",
                    dialogBody: "محتوى الحوار — على الشاشات الضيقة يصبح ورقة سفلية.",
                    confirmOpen: "تأكيد خطر",
                    confirmTitle: "حذف السجل؟",
                    confirmBody: "لا يمكن التراجع عن هذا الإجراء.",
                    toastInfo: "تم الحفظ.",
                    toastError: "تعذّر الحفظ.",
                    toastFireInfo: "إشعار معلومات",
                    toastFireError: "إشعار خطأ (ثابت)",
                    emptyTitle: "لا نتائج",
                    emptyBody: "جرّب مسح الفلاتر.",
                    emptyAction: "مسح الفلاتر",
                    bannerInfo: "تنبيه هادئ للمعلومة.",
                    bannerDanger: "تنبيه خطأ — role=alert.",
                    timelineTitle: "فتح التحويل",
                    kvRef: "المرجع",
                    kvStatus: "الحالة",
                    kvCustomer: "العميل",
                    crumbHome: "الرئيسية",
                    crumbRequests: "الطلبات",
                    crumbDetail: "RO-1042",
                    pageOf: dict.common.paginationPageOf,
                  }
                : {
                    locale: "en",
                    dict,
                    sectionLight: "Light surface",
                    sectionInverse: ".ro-inverse surface",
                    btnPrimary: "Save",
                    btnSecondary: "Cancel",
                    btnText: "Details",
                    btnDanger: "Delete",
                    btnQuiet: "More",
                    btnInverseP: "Explore",
                    btnInverseS: "Our story",
                    btnRipple: "Primary with ripple",
                    fieldLabel: "Name",
                    fieldHelper: "As shown to the customer",
                    fieldError: "This field is required",
                    fieldDense: "Dense field (40)",
                    fieldCounter: "Short note",
                    areaLabel: "Details",
                    dialogOpen: "Open dialog",
                    dialogTitle: "Record details",
                    dialogBody: "Dialog content — becomes a bottom sheet below 640px.",
                    confirmOpen: "Destructive confirm",
                    confirmTitle: "Delete record?",
                    confirmBody: "This action cannot be undone.",
                    toastInfo: "Saved.",
                    toastError: "Could not save.",
                    toastFireInfo: "Info toast",
                    toastFireError: "Error toast (persists)",
                    emptyTitle: "No results",
                    emptyBody: "Try clearing filters.",
                    emptyAction: "Clear filters",
                    bannerInfo: "Calm informational banner.",
                    bannerDanger: "Error banner — role=alert.",
                    timelineTitle: "Handoff opened",
                    kvRef: "Reference",
                    kvStatus: "Status",
                    kvCustomer: "Customer",
                    crumbHome: "Home",
                    crumbRequests: "Requests",
                    crumbDetail: "RO-1042",
                    pageOf: dict.common.paginationPageOf,
                  }
            }
          />
        </section>

        <section className="space-y-4" id="icons">
          <h2 className="ro-type-h2">
            {locale === "ar" ? "الأيقونات — V2" : "Icons — V2"}
          </h2>
          <IconGallery locale={locale === "ar" ? "ar" : "en"} />
        </section>

        <section className="space-y-4" id="motion">
          <h2 className="ro-type-h2">
            {locale === "ar" ? "الحركة — V1" : "Motion — V1"}
          </h2>
          <p className="max-w-2xl text-sm text-ro-text-2">
            {locale === "ar"
              ? "بدائيات المستوى A/B/C/Lite. العيّنة تعرض صدى الضغط، الأوتار، الطيران إلى القائمة، والعدّ التصاعدي. لا تُوصَّل إلى صفحات المتجر في هذه الجولة."
              : "A/B/C/Lite primitives. The sampler shows press ripple, plucked strings, fly-to-list, and count-up. Not wired to live storefront routes in this round."}
          </p>
          <MotionGallery
            copy={
              locale === "ar"
                ? {
                    locale: "ar",
                    title: "الحركة",
                    lead: "مختبر V1",
                    tier: "المستوى",
                    reduce: "تقليل الحركة",
                    auto: "تلقائي",
                    sampler: "مرّر على الأوتار، اضغط الحلقات، ثم أضف إلى القائمة",
                    add: "أضف إلى الطلب",
                    list: "قائمة الطلب",
                    pieces: "قطع في المجموعة",
                    replay: "إعادة",
                    ripple: "صدى الضغط",
                    strings: "أوتار العود",
                    tilt: "سطح يميل مع المؤشر (حاسوب فقط، ≤ 4°)",
                    reveal: "ظهور",
                    spy: "نص تجريبي لتمييز القسم أثناء التمرير.",
                    spyA: "القسم أ",
                    spyB: "القسم ب",
                    spyC: "القسم ج",
                  }
                : {
                    locale: "en",
                    title: "Motion",
                    lead: "V1 lab",
                    tier: "Tier",
                    reduce: "Reduce motion",
                    auto: "Auto",
                    sampler:
                      "Hover the strings, click the rings, then add to the list",
                    add: "Add to request",
                    list: "Request list",
                    pieces: "Pieces in the collection",
                    replay: "Replay",
                    ripple: "Press ripple",
                    strings: "Oud strings",
                    tilt: "Pointer tilt (desktop only, ≤ 4°)",
                    reveal: "Reveal",
                    spy: "Sample copy so the spy can highlight the section.",
                    spyA: "Section A",
                    spyB: "Section B",
                    spyC: "Section C",
                  }
            }
          />
        </section>

        <section className="space-y-4" id="sonner-recharts">
          <h2 className="ro-type-h2">Sonner + recharts</h2>
          <DevToastDemo locale={locale} />
          <div className="rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper p-6">
            <DashboardDomainChartMount
              title={locale === "ar" ? "مثال: توزيع المسارات" : "Example: domain mix"}
              slices={[
                { key: "retail", label: locale === "ar" ? "تجزئة" : "Retail", value: 12, color: "var(--ro-plum-700)" },
                { key: "deals", label: locale === "ar" ? "صفقات" : "Deals", value: 7, color: "var(--ro-plum-300)" },
                { key: "wholesale", label: locale === "ar" ? "جملة" : "Wholesale", value: 4, color: "var(--ro-amber-500)" },
                { key: "brokerage", label: locale === "ar" ? "وساطة" : "Brokerage", value: 3, color: "var(--ro-progress-700)" },
              ]}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
