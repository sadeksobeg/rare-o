import { ConfigForm } from "@/components/admin/shipping/config-form";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminShippingConfigPage() {
  const { locale } = await getRequestDictionary();
  const row = await prisma.shippingConfig.findUnique({ where: { id: "default" } });

  return (
    <ConfigForm
      locale={locale}
      values={{
        roundingRule: row?.roundingRule ?? "legacy_2dp",
        volumetricDivisor: row?.volumetricDivisor == null ? null : Number(row.volumetricDivisor),
        packagingKg: row ? Number(row.packagingKg) : 0,
        globalFreeShippingOver:
          row?.globalFreeShippingOver == null ? null : Number(row.globalFreeShippingOver),
        insuranceEnabled: row?.insuranceEnabled ?? false,
        insurancePercent: row?.insurancePercent == null ? null : Number(row.insurancePercent),
        whatsappOptInTextAr: row?.whatsappOptInTextAr ?? "",
        whatsappOptInTextEn: row?.whatsappOptInTextEn ?? "",
        inquiryNoteAr: row?.inquiryNoteAr ?? "",
        inquiryNoteEn: row?.inquiryNoteEn ?? "",
      }}
    />
  );
}
