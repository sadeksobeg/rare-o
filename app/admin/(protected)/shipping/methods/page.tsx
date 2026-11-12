import { MethodsManager } from "@/components/admin/shipping/methods-manager";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminShippingMethodsPage() {
  const { locale } = await getRequestDictionary();
  const rows = await prisma.shippingMethod.findMany({
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    include: { _count: { select: { rates: true } } },
  });

  return (
    <MethodsManager
      locale={locale}
      rows={rows.map((r) => ({
        id: r.id,
        code: r.code,
        labelAr: r.labelAr,
        labelEn: r.labelEn,
        mode: r.mode,
        speed: r.speed,
        security: r.security,
        consolidation: r.consolidation,
        consolidationNote: r.consolidationNote,
        carrierLabel: r.carrierLabel,
        trackingUrlTemplate: r.trackingUrlTemplate,
        etaMinDays: r.etaMinDays,
        etaMaxDays: r.etaMaxDays,
        description: r.description,
        allowedClasses: r.allowedClasses,
        active: r.active,
        sortOrder: r.sortOrder,
        rateCount: r._count.rates,
      }))}
    />
  );
}
