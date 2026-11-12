import { ShippingSubnav } from "@/components/admin/shipping/shipping-subnav";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function ShippingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";

  return (
    <section data-admin-shipping="" className="space-y-5 pb-8">
      <header className="rad-phead">
        <div>
          <h1>{dict.admin.shipping}</h1>
          <p>
            {ar
              ? "تحكم كامل بالدول والطرق والأسعار والاعتماد والمحاكاة."
              : "Full control of countries, methods, rates, verification, and simulation."}
          </p>
        </div>
      </header>
      <ShippingSubnav locale={locale} />
      {children}
    </section>
  );
}
