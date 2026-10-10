import { RequestForm } from "@/components/storefront/request-form";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function RequestPage() {
  const { locale, dict } = await getRequestDictionary();
  return (
    <RequestForm
      locale={locale}
      labels={{
        title: dict.request.title,
        name: dict.request.name,
        phone: dict.request.phone,
        notes: dict.request.notes,
        country: dict.request.country,
        shippingNote: dict.request.shippingNote,
        submit: dict.request.submit,
        success: dict.request.success,
        openWhatsApp: dict.request.openWhatsApp,
        handoffHint: dict.request.handoffHint,
        messagePreview: dict.request.messagePreview,
      }}
    />
  );
}
