import { RequestForm } from "@/components/storefront/request-form";
import type { Metadata } from "next";
import { getRequestDictionary } from "@/lib/i18n/server";
import { storefrontMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  return storefrontMetadata({
    locale,
    title: `${dict.request.title} — ${dict.brand}`,
    description: dict.request.handoffHint,
    path: "/request",
    noIndex: true,
  });
}

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
        listEmpty: dict.request.listEmpty,
      }}
    />
  );
}
