import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/href";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rareoud.example";

export function absoluteUrl(path: string) {
  return new URL(path, SITE).toString();
}

export function storefrontMetadata(opts: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(href(opts.path, opts.locale));
  const altLocale = opts.locale === "ar" ? "en" : "ar";
  const alt = absoluteUrl(href(opts.path, altLocale));

  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical,
      languages: {
        ar: absoluteUrl(href(opts.path, "ar")),
        en: absoluteUrl(href(opts.path, "en")),
        "x-default": absoluteUrl(href(opts.path, "ar")),
      },
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: canonical,
      siteName: "RARE OUD",
      locale: opts.locale === "ar" ? "ar_AR" : "en_US",
      alternateLocale: [altLocale === "ar" ? "ar_AR" : "en_US"],
    },
    robots: opts.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    other: {
      // hint for later hreflang wiring
      "ro:alt": alt,
    },
  };
}

export function productJsonLd(input: {
  name: string;
  description?: string;
  images: string[];
  price?: number | null;
  currency?: string | null;
  url: string;
  /** Defaults to true (InStock). Pass false for OutOfStock. */
  available?: boolean;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.images,
    brand: { "@type": "Brand", name: "RARE OUD" },
    url: input.url,
  };
  if (input.price != null && input.currency) {
    data.offers = {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.currency,
      availability:
        input.available === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    };
  }
  return data;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RARE OUD",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/logo-mark.svg"),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RARE OUD",
    url: absoluteUrl("/"),
    inLanguage: ["ar", "en"],
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Default Open Graph image for storefront marketing pages (not PDP-specific). */
export function withDefaultOgImage(meta: Metadata): Metadata {
  const image = absoluteUrl("/brand/instruments/oud-atelier-light.jpg");
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      images: meta.openGraph?.images ?? [{ url: image }],
    },
  };
}

/** Serialise JSON-LD safely for inline <script type="application/ld+json">. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
