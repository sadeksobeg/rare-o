import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/storefront/legal-document-view";
import { loadLegalDocument } from "@/lib/content/legal";
import { getRequestDictionary } from "@/lib/i18n/server";
import { storefrontMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  const doc = await loadLegalDocument("cookies", locale);
  return storefrontMetadata({
    locale,
    title: `${doc?.title ?? "Cookies"} — ${dict.brand}`,
    description:
      doc?.description ??
      "How RARE OUD uses cookies for locale and session preferences.",
    path: "/cookies",
  });
}

export default async function CookiesPage() {
  const { locale, dict } = await getRequestDictionary();
  const doc = await loadLegalDocument("cookies", locale);

  if (!doc) {
    return (
      <LegalDocumentView
        doc={{
          title:
            locale === "ar"
              ? "سياسة ملفات تعريف الارتباط"
              : "Cookie policy",
          lastUpdated: "",
          isPlaceholder: true,
          banner: dict.privacy.placeholderBanner,
          fallbackBody:
            locale === "ar"
              ? "محتوى سياسة الكوكيز قيد الإعداد."
              : "Cookie policy content is being prepared.",
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
