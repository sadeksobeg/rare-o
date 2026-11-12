import { Handshake } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { NewDealForm } from "@/components/trader/new-deal-form";
import { TraderPageHeader } from "@/components/trader/page-header";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function NewTraderDealPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string }>;
}) {
  await requireTraderSession();
  const { title } = await searchParams;
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;
  const products = await prisma.product.findMany({
    where: { status: "published" },
    orderBy: { nameEn: "asc" },
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      slug: true,
      currency: true,
      category: { select: { slug: true, nameEn: true, nameAr: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { path: true },
      },
    },
  });

  return (
    <section className="space-y-6 pb-[calc(68px+env(safe-area-inset-bottom,0px)+24px)] min-[901px]:pb-0">
      <TraderPageHeader
        title={t.newDealTitle}
        description={t.newDealLead}
        icon={<Handshake className="size-5" strokeWidth={1.5} />}
        backHref="/trader/deals"
        backLabel={t.deals}
      />
      <Reveal>
        <NewDealForm
          products={products.map((p) => ({
            id: p.id,
            slug: p.slug,
            nameEn: p.nameEn,
            nameAr: p.nameAr,
            currency: p.currency,
            categorySlug: p.category.slug,
            categoryNameEn: p.category.nameEn,
            categoryNameAr: p.category.nameAr,
            imagePath: p.images[0]?.path ?? null,
          }))}
          labels={t}
          locale={locale}
          initialTitle={typeof title === "string" ? title : ""}
        />
      </Reveal>
    </section>
  );
}
