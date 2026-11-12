import { InquiriesManager } from "@/components/admin/shipping/inquiries-manager";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminShippingInquiriesPage() {
  const { locale } = await getRequestDictionary();
  const rows = await prisma.shippingInquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <InquiriesManager
      locale={locale}
      rows={rows.map((r) => ({
        id: r.id,
        destination: r.destination,
        countryCode: r.countryCode,
        status: r.status,
        notes: r.notes,
        assignee: r.assignee,
        createdAt: r.createdAt.toISOString(),
        contactName: r.contactName,
        contactPhone: r.contactPhone,
      }))}
    />
  );
}
