import { prisma } from "@/lib/db/prisma";

export type TraderShipmentRow = {
  id: string;
  status: string;
  methodLabel: string;
  destCountry: string;
  destCity: string;
  trackingNumber: string | null;
  carrierLabel: string;
  priceCharged: number;
  currency: string;
  publicToken: string;
  createdAt: string;
  parent: "wholesale" | "brokerage" | "unknown";
  parentId: string | null;
};

/** Own shipments only — via wholesale/brokerage ownership. */
export async function listTraderShipments(
  traderId: string
): Promise<TraderShipmentRow[]> {
  const rows = await prisma.shipment.findMany({
    where: {
      OR: [
        { wholesaleRequest: { traderId } },
        { brokerageRequest: { traderId } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      methodLabel: true,
      destCountry: true,
      destCity: true,
      trackingNumber: true,
      carrierLabel: true,
      priceCharged: true,
      currency: true,
      publicToken: true,
      createdAt: true,
      wholesaleRequestId: true,
      brokerageRequestId: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    methodLabel: r.methodLabel,
    destCountry: r.destCountry,
    destCity: r.destCity,
    trackingNumber: r.trackingNumber,
    carrierLabel: r.carrierLabel,
    priceCharged: Number(r.priceCharged),
    currency: r.currency,
    publicToken: r.publicToken,
    createdAt: r.createdAt.toISOString(),
    parent: r.wholesaleRequestId
      ? "wholesale"
      : r.brokerageRequestId
        ? "brokerage"
        : "unknown",
    parentId: r.wholesaleRequestId || r.brokerageRequestId || null,
  }));
}
