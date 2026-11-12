import Link from "next/link";
import { SimulatorPanel } from "@/components/admin/shipping/simulator-panel";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminShippingHubPage() {
  const { locale } = await getRequestDictionary();
  const ar = locale === "ar";

  const [countries, methods, rates, unverified, inquiries] = await Promise.all([
    prisma.shippingCountry.count({ where: { active: true } }),
    prisma.shippingMethod.count({ where: { active: true } }),
    prisma.shippingRate.count({ where: { active: true, verified: true } }),
    prisma.shippingRate.count({ where: { verified: false } }),
    prisma.shippingInquiry.count({ where: { status: "NEW" } }),
  ]);

  const cards = [
    { href: "/admin/shipping/countries", label: ar ? "دول نشطة" : "Active countries", value: countries },
    { href: "/admin/shipping/methods", label: ar ? "طرق نشطة" : "Active methods", value: methods },
    { href: "/admin/shipping/rates", label: ar ? "أسعار معتمدة" : "Verified rates", value: rates },
    { href: "/admin/shipping/rates", label: ar ? "بانتظار الاعتماد" : "Unverified", value: unverified },
    { href: "/admin/shipping/inquiries", label: ar ? "استفسارات جديدة" : "New inquiries", value: inquiries },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-[color:var(--rad-bd)] bg-[color:var(--rad-c1)] p-4 transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.98]"
          >
            <div className="text-xs text-[color:var(--rad-tx-2)]">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold">
              <bdi dir="ltr">{c.value}</bdi>
            </div>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold">{ar ? "جرّب السعر بسرعة" : "Quick simulator"}</h2>
        <SimulatorPanel locale={locale} />
      </div>
    </div>
  );
}
