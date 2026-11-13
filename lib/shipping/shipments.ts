/**
 * Shipment operations (Phase 2c): state machine, create-from-request,
 * transitions with event log, trader in-app notification, and the minimal
 * public tracking view. No WhatsApp send here — in-app only.
 */
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { notifyTrader } from "@/lib/trader/notifications";
import {
  SHIPMENT_STATUS_AR,
  SHIPMENT_STATUS_EN,
  type AdminShipmentRow,
  type ShipmentStatus,
} from "@/lib/shipping/shipments-shared";

export {
  SHIPMENT_STATUSES,
  SHIPMENT_STATUS_AR,
  SHIPMENT_STATUS_EN,
} from "@/lib/shipping/shipments-shared";
export type { AdminShipmentRow, ShipmentStatus };

const NEXT: Record<ShipmentStatus, ShipmentStatus[]> = {
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["HANDED_OVER", "CANCELLED"],
  HANDED_OVER: ["IN_TRANSIT", "FAILED", "RETURNED"],
  IN_TRANSIT: ["ARRIVED", "FAILED", "RETURNED"],
  ARRIVED: ["DELIVERED", "FAILED", "RETURNED"],
  FAILED: ["IN_TRANSIT", "RETURNED", "CANCELLED"],
  DELIVERED: [],
  RETURNED: [],
  CANCELLED: [],
};

export function allowedNextStatuses(from: string): ShipmentStatus[] {
  return NEXT[from as ShipmentStatus] ?? [];
}

export function canTransition(from: string, to: string): boolean {
  return allowedNextStatuses(from).includes(to as ShipmentStatus);
}

export function newPublicToken(): string {
  return randomBytes(18).toString("base64url");
}

/** Strip control chars / angle brackets; keeps free text safe for any sink. */
export function cleanText(s: unknown, max: number): string {
  return String(s ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .trim()
    .slice(0, max);
}

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;
export function isPlausibleToken(t: string): boolean {
  return TOKEN_RE.test(t);
}

export type CreateShipmentInput = {
  parent: "wholesale" | "brokerage";
  parentId: string;
  methodCode?: string;
  methodLabel?: string;
  carrierLabel?: string;
  destCountry?: string;
  destCity?: string;
  destAddress?: string;
  recipientName?: string;
  recipientPhone?: string;
  trackingNumber?: string;
  priceCharged?: number;
  currency?: string;
  actor: string;
};

export type OpResult<T = { id: string }> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export async function createShipment(
  input: CreateShipmentInput
): Promise<OpResult> {
  const price = Number(input.priceCharged ?? 0);
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) {
    return { ok: false, error: "INVALID_PRICE" };
  }
  const currency = cleanText(input.currency || "USD", 3).toUpperCase() || "USD";
  if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, error: "INVALID_CURRENCY" };

  let wholesaleRequestId: string | null = null;
  let brokerageRequestId: string | null = null;
  let traderId: string | null = null;

  if (input.parent === "wholesale") {
    const r = await prisma.wholesaleRequest.findUnique({
      where: { id: input.parentId },
      select: { id: true, traderId: true },
    });
    if (!r) return { ok: false, error: "PARENT_NOT_FOUND" };
    wholesaleRequestId = r.id;
    traderId = r.traderId;
  } else {
    const r = await prisma.brokerageRequest.findUnique({
      where: { id: input.parentId },
      select: { id: true, traderId: true },
    });
    if (!r) return { ok: false, error: "PARENT_NOT_FOUND" };
    brokerageRequestId = r.id;
    traderId = r.traderId;
  }

  const tracking = cleanText(input.trackingNumber, 64);
  const row = await prisma.shipment.create({
    data: {
      wholesaleRequestId,
      brokerageRequestId,
      status: "CONFIRMED",
      methodCode: cleanText(input.methodCode, 80),
      methodLabel: cleanText(input.methodLabel, 160),
      carrierLabel: cleanText(input.carrierLabel, 120),
      destCountry: cleanText(input.destCountry, 80),
      destCity: cleanText(input.destCity, 80),
      destAddress: cleanText(input.destAddress, 300),
      recipientName: cleanText(input.recipientName, 120),
      recipientPhone: cleanText(input.recipientPhone, 40),
      trackingNumber: tracking || null,
      priceCharged: price,
      currency,
      publicToken: newPublicToken(),
      createdBy: cleanText(input.actor, 120),
      events: {
        create: { status: "CONFIRMED", note: "", actor: cleanText(input.actor, 120) },
      },
    },
    select: { id: true },
  });

  if (traderId) {
    await notifyTrader({
      traderId,
      domain: input.parent,
      titleAr: "تم إنشاء شحنة لطلبك",
      titleEn: "A shipment was created for your request",
      href: "/trader/shipments",
    }).catch(() => undefined);
  }
  return { ok: true, id: row.id };
}

export async function transitionShipment(input: {
  id: string;
  to: string;
  note?: string;
  trackingNumber?: string;
  actor: string;
}): Promise<OpResult> {
  const s = await prisma.shipment.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      status: true,
      wholesaleRequest: { select: { traderId: true } },
      brokerageRequest: { select: { traderId: true } },
    },
  });
  if (!s) return { ok: false, error: "NOT_FOUND" };
  if (!canTransition(s.status, input.to)) {
    return { ok: false, error: "INVALID_TRANSITION" };
  }
  const note = cleanText(input.note, 500);
  const tracking = cleanText(input.trackingNumber, 64);
  const now = new Date();

  await prisma.$transaction([
    prisma.shipment.update({
      where: { id: s.id },
      data: {
        status: input.to,
        ...(tracking ? { trackingNumber: tracking } : {}),
        ...(input.to === "HANDED_OVER" || input.to === "IN_TRANSIT"
          ? { shippedAt: now }
          : {}),
        ...(input.to === "DELIVERED" ? { deliveredAt: now } : {}),
      },
    }),
    prisma.shipmentEvent.create({
      data: {
        shipmentId: s.id,
        status: input.to,
        note,
        actor: cleanText(input.actor, 120),
        notified: true,
      },
    }),
  ]);

  const traderId = s.wholesaleRequest?.traderId ?? s.brokerageRequest?.traderId;
  if (traderId) {
    await notifyTrader({
      traderId,
      domain: s.wholesaleRequest ? "wholesale" : "brokerage",
      titleAr: `الشحنة: ${SHIPMENT_STATUS_AR[input.to] ?? input.to}`,
      titleEn: `Shipment: ${SHIPMENT_STATUS_EN[input.to] ?? input.to}`,
      bodyAr: note,
      bodyEn: note,
      href: "/trader/shipments",
    }).catch(() => undefined);
  }
  return { ok: true, id: s.id };
}

export async function listAdminShipments(
  status?: string
): Promise<AdminShipmentRow[]> {
  const rows = await prisma.shipment.findMany({
    where:
      status === "EXCEPTIONS"
        ? {
            OR: [
              { status: "FAILED" },
              {
                status: { in: ["HANDED_OVER", "IN_TRANSIT"] },
                updatedAt: { lt: new Date(Date.now() - 14 * 86_400_000) },
              },
              { status: "CONFIRMED", createdAt: { lt: new Date(Date.now() - 7 * 86_400_000) } },
            ],
          }
        : status && status !== "ALL"
          ? { status }
          : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      status: true,
      methodLabel: true,
      carrierLabel: true,
      destCountry: true,
      destCity: true,
      trackingNumber: true,
      publicToken: true,
      createdAt: true,
      wholesaleRequest: { select: { reference: true } },
      brokerageRequest: { select: { reference: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    methodLabel: r.methodLabel,
    carrierLabel: r.carrierLabel,
    destCountry: r.destCountry,
    destCity: r.destCity,
    trackingNumber: r.trackingNumber,
    publicToken: r.publicToken,
    createdAt: r.createdAt.toISOString(),
    parentLabel:
      r.wholesaleRequest?.reference ?? r.brokerageRequest?.reference ?? "—",
    next: allowedNextStatuses(r.status),
  }));
}

/** Requests a shipment can be attached to (admin create form). */
export async function listShippableRequests() {
  const [w, b] = await Promise.all([
    prisma.wholesaleRequest.findMany({
      where: { status: { in: ["confirmed", "completed"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, reference: true },
    }),
    prisma.brokerageRequest.findMany({
      where: { status: { in: ["PURCHASED", "SHIPPED", "APPROVED"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, reference: true },
    }),
  ]);
  return [
    ...w.map((r) => ({ key: `wholesale:${r.id}`, label: `${r.reference} · wholesale` })),
    ...b.map((r) => ({ key: `brokerage:${r.id}`, label: `${r.reference} · brokerage` })),
  ];
}

export type PublicTracking = {
  status: string;
  destCountry: string;
  carrierLabel: string;
  trackingNumber: string | null;
  events: { status: string; note: string; at: string }[];
};

/** Public view: no names, phones, addresses, prices, actors or photos. */
export async function getPublicTracking(
  token: string
): Promise<PublicTracking | null> {
  if (!isPlausibleToken(token)) return null;
  const s = await prisma.shipment.findUnique({
    where: { publicToken: token },
    select: {
      status: true,
      destCountry: true,
      carrierLabel: true,
      trackingNumber: true,
      events: { orderBy: { at: "asc" }, select: { status: true, note: true, at: true } },
    },
  });
  if (!s) return null;
  return {
    status: s.status,
    destCountry: s.destCountry,
    carrierLabel: s.carrierLabel,
    trackingNumber: s.trackingNumber,
    events: s.events.map((e) => ({
      status: e.status,
      note: e.note,
      at: e.at.toISOString(),
    })),
  };
}
