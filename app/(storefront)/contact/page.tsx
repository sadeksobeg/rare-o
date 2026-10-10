import { getRequestDictionary } from "@/lib/i18n/server";
import { whatsAppGreetingLink } from "@/lib/config/contact";
import { MaterialPlate } from "@/components/storefront/material-plate";
import { ButtonLink } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";

export default async function ContactPage() {
  const { locale, dict } = await getRequestDictionary();
  const greeting =
    locale === "ar"
      ? "مرحباً، أود الاستفسار عبر RARE OUD."
      : "Hello, I would like to inquire via RARE OUD.";
  const wa = whatsAppGreetingLink(greeting);

  return (
    <section className="grid gap-10 md:grid-cols-2 md:items-center">
      <div className="space-y-6">
        <h1 className="ro-type-h1">{dict.contact.title}</h1>
        <p className="max-w-md text-ro-text-2">{dict.contact.lead}</p>
        <p className="text-sm text-ro-muted">{dict.contact.hours}</p>
        <p className="text-sm text-ro-muted">{dict.contact.location}</p>
        {wa ? (
          <ButtonLink href={wa}>{dict.contact.whatsapp}</ButtonLink>
        ) : (
          <Banner tone="attention">{dict.contact.missingNumber}</Banner>
        )}
      </div>
      <MaterialPlate
        caption={locale === "ar" ? "RARE OUD" : "RARE OUD"}
        className="max-w-md md:ms-auto"
      />
    </section>
  );
}
