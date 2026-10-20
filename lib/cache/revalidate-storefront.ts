import { revalidateTag } from "next/cache";

/** Invalidate homepage discovery + catalog list caches after CMS mutations. */
export function revalidateHomepageAndCatalogTags() {
  revalidateTag("homepage");
  revalidateTag("catalog");
}
