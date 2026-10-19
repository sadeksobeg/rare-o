import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/storefront/legal-document-view";
import { loadLegalDocument } from "@/lib/content/legal";
import { getRequestDictionary } from "@/lib/i18n/server";
import { storefrontMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  const doc = await loadLegalDocument("terms", locale);
  return storefrontMetadata({
    locale,
    title: `${doc?.title ?? "Terms"} — ${dict.brand}`,
    description:
      doc?.description ??
      "Terms of use for the RARE OUD storefront and WhatsApp request flow.",
    path: "/terms",
  });
}

export default async function TermsPage() {
  const { locale, dict } = await getRequestDictionary();
  const doc = await loadLegalDocument("terms", locale);

  if (!doc) {
    return (
      <LegalDocumentView
        doc={{
          title: locale === "ar" ? "شروط الاستخدام" : "Terms of use",
          lastUpdated: "",
          isPlaceholder: true,
          banner: dict.privacy.placeholderBanner,
          fallbackBody:
            locale === "ar"
              ? "محتوى الشروط قيد الإعداد."
              : "Terms content is being prepared.",
          sections: [],
        }}
        dict={dict}
      />
    );
  }

  return (
    <LegalDocumentView
      doc={doc}
      dict={dict}
      placeholderBanner={dict.privacy.placeholderBanner}
    />
  );
}
