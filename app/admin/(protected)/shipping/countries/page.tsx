import { CountriesManager } from "@/components/admin/shipping/countries-manager";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminShippingCountriesPage() {
  const { locale } = await getRequestDictionary();
  const rows = await prisma.shippingCountry.findMany({
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    include: { _count: { select: { rates: true } } },
  });

  return (
    <CountriesManager
      locale={locale}
      rows={rows.map((r) => ({
        code: r.code,
        nameAr: r.nameAr,
        nameEn: r.nameEn,
        region: r.region,
        active: r.active,
        inquiryEnabled: r.inquiryEnabled,
        note: r.note,
        sortOrder: r.sortOrder,
        rateCount: r._count.rates,
      }))}
    />
  );
}
