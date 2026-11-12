import { RatesManager } from "@/components/admin/shipping/rates-manager";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminShippingRatesPage() {
  const { locale } = await getRequestDictionary();
  const [rates, methods] = await Promise.all([
    prisma.shippingRate.findMany({
      include: {
        country: { select: { nameAr: true, nameEn: true, region: true } },
        method: { select: { id: true, code: true, labelAr: true, labelEn: true } },
      },
      orderBy: [{ countryCode: "asc" }, { methodId: "asc" }],
    }),
    prisma.shippingMethod.findMany({
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      select: { id: true, code: true, labelAr: true, labelEn: true },
    }),
  ]);

  return (
    <RatesManager
      locale={locale}
      methods={methods}
      rows={rates.map((r) => ({
        id: r.id,
        countryCode: r.countryCode,
        countryNameAr: r.country.nameAr,
        countryNameEn: r.country.nameEn,
        region: r.country.region,
        methodId: r.methodId,
        methodCode: r.method.code,
        methodLabelAr: r.method.labelAr,
        methodLabelEn: r.method.labelEn,
        basis: r.basis,
        amount: Number(r.amount),
        currency: r.currency,
        audience: r.audience,
        active: r.active,
        verified: r.verified,
        maxWeightKg: r.maxWeightKg == null ? null : Number(r.maxWeightKg),
        note: r.note,
      }))}
    />
  );
}
