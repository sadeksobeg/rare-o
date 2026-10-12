import { PageHeader } from "@/components/admin/page-header";
import { PromoBandForm } from "@/components/admin/promo-band-form";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function AdminNewPromoPage() {
  const { dict } = await getRequestDictionary();

  return (
    <section className="space-y-6">
      <PageHeader
        title={dict.adminUi.newPromo}
        description={dict.adminUi.promosLead}
      />
      <PromoBandForm labels={dict.adminUi} />
    </section>
  );
}
