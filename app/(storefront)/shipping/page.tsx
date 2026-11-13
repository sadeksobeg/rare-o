import type { Metadata } from "next";
import { getRequestDictionary } from "@/lib/i18n/server";
import { storefrontMetadata } from "@/lib/seo";
import { ShippingEstimator } from "@/components/storefront/shipping/shipping-estimator";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  const title =
    locale === "ar" ? `حاسبة الشحن — ${dict.brand}` : `Shipping calculator — ${dict.brand}`;
  const description =
    locale === "ar"
      ? "قدّر تكلفة الشحن حسب الوجهة والوزن دون إضافة منتجات إلى السلة."
      : "Estimate shipping by destination and weight — no cart required.";
  return storefrontMetadata({
    locale,
    title,
    description,
    path: "/shipping",
  });
}

export default async function ShippingCalculatorPage() {
  const { locale } = await getRequestDictionary();
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 md:px-8 md:py-14">
      <header className="mb-8 space-y-2">
        <p className="ro-type-overline text-[var(--ro-plum-900)]">
          {locale === "ar" ? "الشحن" : "Shipping"}
        </p>
        <h1 className="ro-type-h1">
          {locale === "ar" ? "حاسبة الشحن" : "Shipping calculator"}
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-ro-muted">
          {locale === "ar"
            ? "لا تحتاج سلة. اختر الوجهة والوزن لعرض الطرق المتاحة. الأسعار تقديرية وغير ملزمة."
            : "No cart needed. Pick a destination and weight to see available methods. Estimates are advisory."}
        </p>
      </header>
      <ShippingEstimator locale={locale} mode="page" />
    </main>
  );
}
