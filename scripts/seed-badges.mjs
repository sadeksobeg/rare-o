import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const products = await p.product.findMany({
  orderBy: { updatedAt: "desc" },
  take: 6,
  select: { id: true, slug: true, compareAtPrice: true },
});

if (products[0]) {
  await p.product.update({
    where: { id: products[0].id },
    data: { badgeFeatured: true, badgeNew: true },
  });
}
if (products[1]) {
  await p.product.update({
    where: { id: products[1].id },
    data: { badgeNew: true },
  });
}
for (const prod of products) {
  if (prod.compareAtPrice != null) {
    await p.product.update({
      where: { id: prod.id },
      data: { badgeSale: true },
    });
  }
}

console.log(
  "badges seeded on",
  products.map((x) => x.slug).join(", ") || "(none)"
);
await p.$disconnect();
