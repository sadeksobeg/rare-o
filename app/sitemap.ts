import type { MetadataRoute } from "next";
import { listPublishedProducts } from "@/lib/catalog/service";
import { listPublishedPublicOffers } from "@/lib/offers/service";
import { href } from "@/lib/href";
import { absoluteUrl } from "@/lib/seo";

// Reads published rows from the database at request time.
export const dynamic = "force-dynamic";

const STATIC_PATHS = ["/", "/catalog", "/offers", "/contact", "/privacy"];

function entry(
  path: string,
  lastModified?: Date
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(href(path, "ar")),
    ...(lastModified ? { lastModified } : {}),
    alternates: {
      languages: {
        ar: absoluteUrl(href(path, "ar")),
        en: absoluteUrl(href(path, "en")),
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => entry(p));

  try {
    const [products, offers] = await Promise.all([
      listPublishedProducts(),
      listPublishedPublicOffers(),
    ]);
    for (const p of products) {
      entries.push(entry(`/product/${p.slug}`, p.updatedAt));
    }
    for (const o of offers) {
      entries.push(entry(`/offers/${o.slug}`, o.updatedAt));
    }
  } catch {
    // Database unavailable: still serve the static, indexable routes.
  }

  return entries;
}
