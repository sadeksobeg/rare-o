import { Card, DetailBack, DetailHeader } from "@/components/ui-kit";
import { PromoBandForm } from "@/components/admin/promo-band-form";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
import { getRequestDictionary } from "@/lib/i18n/server";
import { notFound } from "next/navigation";

export default async function AdminNewPromoPage() {
  if (!isPromoFeaturesEnabled()) notFound();
  const { dict } = await getRequestDictionary();

  return (
    <section data-admin-promo-new="" className="space-y-5 pb-8">
      <DetailBack href="/admin/promos">{dict.admin.promos}</DetailBack>
      <DetailHeader
        reference={dict.adminUi.newPromo}
        mono={false}
        meta={dict.adminUi.promosLead}
      />
      <Card aria-label={dict.adminUi.newPromo}>
        <div className="px-4 py-5 sm:px-5 sm:py-6">
          <PromoBandForm labels={dict.adminUi} />
        </div>
      </Card>
    </section>
  );
}
