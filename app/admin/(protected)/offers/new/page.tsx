import { PublicOfferForm } from "@/components/admin/public-offer-form";
import { Card, DetailBack, DetailHeader } from "@/components/ui-kit";
import { uiVisibleDealWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function AdminNewOfferPage() {
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const [deals, products] = await Promise.all([
    prisma.dealProposal.findMany({
      where: uiVisibleDealWhere(),
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: { id: true, reference: true, title: true },
    }),
    prisma.product.findMany({
      where: { status: "published" },
      orderBy: { nameEn: "asc" },
      select: { id: true, slug: true, nameEn: true, nameAr: true },
    }),
  ]);

  return (
    <section data-admin-offer-new="" className="space-y-5 pb-8">
      <DetailBack href="/admin/offers">{a.offers}</DetailBack>
      <DetailHeader reference={u.detail.newOfferTitle} mono={false} />
      <Card aria-label={u.detail.newOfferTitle}>
        <div className="px-4 py-5 sm:px-5 sm:py-6">
          <PublicOfferForm
            deals={deals}
            products={products}
            labels={dict.adminUi}
            locale={locale}
          />
        </div>
      </Card>
    </section>
  );
}
