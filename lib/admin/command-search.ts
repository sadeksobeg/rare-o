import { prisma } from "@/lib/db/prisma";
import {
  uiVisibleCustomerWhere,
  uiVisibleDealWhere,
  uiVisibleRetailRequestWhere,
  uiVisibleTraderWhere,
  uiVisibleWholesaleWhere,
} from "@/lib/admin/ui-hidden";
import type { AdminCommandHit } from "@/lib/admin/command-hits";
import { containsCI } from "@/lib/db/search";

export type { AdminCommandHit } from "@/lib/admin/command-hits";

export async function searchAdminCommand(
  rawQuery: string
): Promise<AdminCommandHit[]> {
  const q = rawQuery.trim();
  if (q.length < 2) return [];
  const match = containsCI(q);

  const [products, retail, deals, wholesale, customers, traders] =
    await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [{ nameAr: match }, { nameEn: match }, { slug: match }],
        },
        select: { id: true, slug: true, nameAr: true, nameEn: true },
        take: 4,
      }),
      prisma.retailRequest.findMany({
        where: {
          AND: [
            uiVisibleRetailRequestWhere(),
            { OR: [{ reference: match }, { customerName: match }] },
          ],
        },
        select: { id: true, reference: true, customerName: true },
        take: 3,
      }),
      prisma.dealProposal.findMany({
        where: {
          AND: [
            uiVisibleDealWhere(),
            { OR: [{ reference: match }, { title: match }] },
          ],
        },
        select: {
          id: true,
          reference: true,
          title: true,
          trader: { select: { displayName: true } },
        },
        take: 3,
      }),
      prisma.wholesaleRequest.findMany({
        where: {
          AND: [uiVisibleWholesaleWhere(), { reference: match }],
        },
        select: {
          id: true,
          reference: true,
          trader: { select: { displayName: true } },
        },
        take: 3,
      }),
      prisma.customer.findMany({
        where: {
          AND: [
            uiVisibleCustomerWhere(),
            { OR: [{ name: match }, { phone: match }] },
          ],
        },
        select: { id: true, name: true, phone: true },
        take: 3,
      }),
      prisma.traderAccount.findMany({
        where: {
          AND: [
            uiVisibleTraderWhere(),
            { OR: [{ displayName: match }, { email: match }] },
          ],
        },
        select: { id: true, displayName: true, email: true },
        take: 3,
      }),
    ]);

  const hits: AdminCommandHit[] = [
    ...products.map((row) => ({
      href: `/admin/products/${row.id}`,
      title: row.nameAr || row.nameEn || row.slug,
      subtitle: row.slug,
      kind: "product" as const,
    })),
    ...retail.map((row) => ({
      href: `/admin/requests/${row.id}`,
      title: row.reference,
      subtitle: row.customerName,
      kind: "retail" as const,
    })),
    ...deals.map((row) => ({
      href: `/admin/deals/${row.id}`,
      title: row.title,
      subtitle: `${row.reference} · ${row.trader.displayName}`,
      kind: "deal" as const,
    })),
    ...wholesale.map((row) => ({
      href: `/admin/wholesale/${row.id}`,
      title: row.reference,
      subtitle: row.trader.displayName,
      kind: "wholesale" as const,
    })),
    ...customers.map((row) => ({
      href: `/admin/customers/${row.id}`,
      title: row.name,
      subtitle: row.phone,
      kind: "customer" as const,
    })),
    ...traders.map((row) => ({
      href: `/admin/traders`,
      title: row.displayName,
      subtitle: row.email,
      kind: "trader" as const,
    })),
  ];

  return hits.slice(0, 12);
}
