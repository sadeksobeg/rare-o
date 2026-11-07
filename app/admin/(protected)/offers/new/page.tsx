import { Percent } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PublicOfferForm } from "@/components/admin/public-offer-form";
import { uiVisibleDealWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function AdminNewOfferPage() {
  const { locale, dict } = await getRequestDictionary();
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
    <section className="space-y-6">
      <PageHeader
        title={dict.adminUi.detail.newOfferTitle}
        description={dict.adminUi.detail.newOfferLead}
        icon={<Percent className="size-5" strokeWidth={1.5} />}
      />
      <PublicOfferForm
        deals={deals}
        products={products}
        labels={dict.adminUi}
        locale={locale}
      />
    </section>
  );
}
