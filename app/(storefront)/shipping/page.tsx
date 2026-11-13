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
  const ar = locale === "ar";
  const facts = ar
    ? [
        ["الدفع في سوريا", "السعر الأساسي بالدولار عند التسديد في سوريا."],
        ["الدفع في بلد الوجهة", "السعر بعملة البلد عندما يسدّد المستلم هناك."],
        ["تقدير غير ملزم", "نؤكد السعر النهائي معك قبل الشحن."],
      ]
    : [
        ["Pay in Syria", "The base price in USD when paid in Syria."],
        ["Pay at destination", "The price in local currency when paid there."],
        ["Advisory estimate", "We confirm the final price before shipping."],
      ];
  return (
    <div className="mx-auto max-w-5xl space-y-8 md:space-y-10">
      <header className="max-w-2xl space-y-3">
        <h1 className="ro-type-h1 md:text-5xl">
          {ar ? "كم يكلّف شحن عودك؟" : "What will it cost to ship your oud?"}
        </h1>
        <p className="max-w-prose text-base leading-relaxed text-ro-text-2">
          {ar
            ? "اختر الوجهة وعدد الأعواد، فنعرض لك الطرق المتاحة وسعر كل واحدة. لا تحتاج سلة."
            : "Pick a destination and the number of ouds to see each available method and its price. No cart needed."}
        </p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ShippingEstimator locale={locale} mode="page" />
        <aside className="space-y-4 lg:sticky lg:top-24">
          <dl className="divide-y divide-[var(--ro-border-control)] rounded-[var(--ro-r-md)] border border-[var(--ro-border-control)] bg-ro-paper">
            {facts.map(([k, v]) => (
              <div key={k} className="space-y-0.5 px-4 py-3">
                <dt className="text-sm font-semibold text-ro-ink">{k}</dt>
                <dd className="text-xs leading-relaxed text-ro-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
