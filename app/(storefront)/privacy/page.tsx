import type { Metadata } from "next";
import { getRequestDictionary } from "@/lib/i18n/server";
import { storefrontMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  return storefrontMetadata({
    locale,
    title: `${dict.privacy.title} — ${dict.brand}`,
    description: dict.seo.privacyDescription,
    path: "/privacy",
  });
}

export default async function PrivacyPage() {
  const { dict } = await getRequestDictionary();

  return (
    <article className="mx-auto max-w-[720px] space-y-6">
      <h1 className="ro-type-h1">{dict.privacy.title}</h1>
      <p className="text-sm text-ro-muted">{dict.privacy.updated}</p>
      <p className="text-ro-text-2 leading-relaxed whitespace-pre-wrap">
        {dict.privacy.body}
      </p>
    </article>
  );
}
