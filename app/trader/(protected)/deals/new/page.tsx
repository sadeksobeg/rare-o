import { NewDealForm } from "@/components/trader/new-deal-form";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function NewTraderDealPage() {
  await requireTraderSession();
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;
  const products = await prisma.product.findMany({
    where: { status: "published" },
    orderBy: { nameEn: "asc" },
    select: { id: true, nameEn: true, nameAr: true, slug: true },
  });

  return (
    <section className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {t.newDealTitle}
      </h1>
      <p className="max-w-[45rem] text-sm text-ro-muted">{t.newDealLead}</p>
      <NewDealForm products={products} labels={t} locale={locale} />
    </section>
  );
}
