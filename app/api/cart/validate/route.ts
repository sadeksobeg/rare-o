import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Body = { productIds?: unknown };

/**
 * Public cart hygiene: which product IDs are still orderable.
 * Used by the request page to drop draft/missing items with Arabic notice.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const productIds = Array.isArray(body.productIds)
    ? [
        ...new Set(
          body.productIds
            .filter((id): id is string => typeof id === "string")
            .map((id) => id.trim())
            .filter(Boolean)
        ),
      ]
    : [];

  if (productIds.length === 0) {
    return NextResponse.json({ available: [] as string[], removed: [] as string[] });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      status: true,
      availability: true,
      retailPrice: true,
      currency: true,
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const available: string[] = [];
  const removed: string[] = [];

  for (const id of productIds) {
    const p = byId.get(id);
    if (
      !p ||
      p.status !== "published" ||
      p.availability !== "available" ||
      p.retailPrice == null ||
      !p.currency
    ) {
      removed.push(id);
    } else {
      available.push(id);
    }
  }

  return NextResponse.json({ available, removed });
}
