import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/storefront/legal-document-view";
import { loadLegalDocument } from "@/lib/content/legal";
import { getRequestDictionary } from "@/lib/i18n/server";
import { storefrontMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  const doc = await loadLegalDocument("privacy", locale);
  return storefrontMetadata({
    locale,
    title: `${doc?.title ?? dict.privacy.title} — ${dict.brand}`,
    description: doc?.description ?? dict.seo.privacyDescription,
    path: "/privacy",
  });
}

export default async function PrivacyPage() {
  const { locale, dict } = await getRequestDictionary();
  const doc = await loadLegalDocument("privacy", locale);

  if (doc) {
    return (
      <LegalDocumentView
        doc={doc}
        dict={dict}
        placeholderBanner={dict.privacy.placeholderBanner}
      />
    );
  }

  const sections = [
    { id: "collect", title: dict.privacy.s1Title, body: dict.privacy.s1Body },
    { id: "use", title: dict.privacy.s2Title, body: dict.privacy.s2Body },
    { id: "cookies", title: dict.privacy.s3Title, body: dict.privacy.s3Body },
  ];

  return (
    <LegalDocumentView
      doc={{
        title: dict.privacy.title,
        lastUpdated: dict.privacy.updated,
        isPlaceholder: true,
        banner: dict.privacy.placeholderBanner,
        sections,
      }}
      dict={dict}
    />
  );
}
