/**
 * Per-product stock. `stockQuantity = null` means "not tracked" (unlimited, the previous behaviour).
 * Units are reserved when a retail/wholesale request is created and released when it is cancelled;
 * the reservation is a single conditional UPDATE so two buyers can never take the same last unit.
 */
import { prisma } from "@/lib/db/prisma";
import { publishInboxEvent } from "@/lib/whatsapp/messaging/inbox-events";

export type StockLine = { productId: string; quantity: number };

export class InsufficientStockError extends Error {
  constructor(
    public productId: string,
    public productName: string,
    public available: number
  ) {
    super(`INSUFFICIENT_STOCK:${productName}:${available}`);
    this.name = "InsufficientStockError";
  }
}

function merge(lines: StockLine[]): StockLine[] {
  const m = new Map<string, number>();
  for (const l of lines) m.set(l.productId, (m.get(l.productId) ?? 0) + l.quantity);
  return [...m].map(([productId, quantity]) => ({ productId, quantity }));
}

/** Reserve units for tracked products. Throws InsufficientStockError (nothing stays reserved). */
export async function reserveStock(lines: StockLine[]): Promise<StockLine[]> {
  const reserved: StockLine[] = [];
  for (const l of merge(lines)) {
    const p = await prisma.product.findUnique({
      where: { id: l.productId },
      select: { stockQuantity: true, nameAr: true },
    });
    if (!p || p.stockQuantity == null) continue; // untracked
    const res = await prisma.product.updateMany({
      where: { id: l.productId, stockQuantity: { gte: l.quantity } },
      data: { stockQuantity: { decrement: l.quantity } },
    });
    if (res.count === 0) {
      await releaseStock(reserved);
      const fresh = await prisma.product.findUnique({ where: { id: l.productId }, select: { stockQuantity: true } });
      throw new InsufficientStockError(l.productId, p.nameAr, Math.max(0, fresh?.stockQuantity ?? 0));
    }
    reserved.push(l);
  }
  for (const r of reserved) await afterStockChange(r.productId);
  return reserved;
}

/** Give reserved units back (request cancelled / creation failed). */
export async function releaseStock(lines: StockLine[]): Promise<void> {
  for (const l of merge(lines)) {
    const p = await prisma.product.findUnique({ where: { id: l.productId }, select: { stockQuantity: true } });
    if (!p || p.stockQuantity == null) continue;
    await prisma.product.update({
      where: { id: l.productId },
      data: { stockQuantity: { increment: l.quantity } },
    });
    if (p.stockQuantity === 0) {
      // Back in stock after being sold out → reopen the public availability flag.
      await prisma.product.update({ where: { id: l.productId }, data: { availability: "available" } });
    }
  }
}

/** Sold out → mark unavailable; low or out → warn the admin team live. */
export async function afterStockChange(productId: string): Promise<void> {
  const p = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, nameAr: true, stockQuantity: true, lowStockThreshold: true, availability: true },
  });
  if (!p || p.stockQuantity == null) return;
  if (p.stockQuantity <= 0 && p.availability !== "unavailable") {
    await prisma.product.update({ where: { id: p.id }, data: { availability: "unavailable" } });
  }
  if (p.stockQuantity <= p.lowStockThreshold) {
    void publishInboxEvent("conversation.updated", {
      kind: p.stockQuantity <= 0 ? "stock_out" : "stock_low",
      domain: "product",
      requestId: p.id,
      title: `${p.nameAr} (${Math.max(0, p.stockQuantity)})`,
    });
  }
}

/** Tracked products at or below their warning threshold (for the alerts panel and product list). */
export async function listLowStockProducts(limit = 20) {
  const rows = await prisma.product.findMany({
    where: { stockQuantity: { not: null }, status: "published" },
    select: { id: true, nameAr: true, nameEn: true, stockQuantity: true, lowStockThreshold: true },
    orderBy: { stockQuantity: "asc" },
    take: 200,
  });
  return rows
    .filter((r) => (r.stockQuantity ?? 0) <= r.lowStockThreshold)
    .slice(0, limit)
    .map((r) => ({ ...r, stockQuantity: r.stockQuantity ?? 0 }));
}

export { stockShortMessage } from "@/lib/inventory/stock-copy";
