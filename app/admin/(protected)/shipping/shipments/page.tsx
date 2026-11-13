import { ShipmentsManager } from "@/components/admin/shipping/shipments-manager";
import { getRequestDictionary } from "@/lib/i18n/server";
import {
  listAdminShipments,
  listShippableRequests,
} from "@/lib/shipping/shipments";
import { SHIPMENT_STATUS_AR } from "@/lib/shipping/shipments-shared";

export const dynamic = "force-dynamic";

export default async function AdminShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status && status in SHIPMENT_STATUS_AR ? status : "ALL";
  const { locale } = await getRequestDictionary();
  const [rows, requests] = await Promise.all([
    listAdminShipments(filter),
    listShippableRequests(),
  ]);
  return (
    <ShipmentsManager
      rows={rows}
      requests={requests}
      locale={locale}
      filter={filter}
    />
  );
}
