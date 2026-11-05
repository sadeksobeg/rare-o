import { prisma } from "@/lib/db/prisma";
import { slugifyLatin } from "@/lib/catalog/slug";

/** Unique among products; optional excludeId for updates. */
export async function ensureUniqueProductSlug(
  base: string,
  excludeId?: string
): Promise<string> {
  const root = slugifyLatin(base) || "product";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const clash = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash || (excludeId && clash.id === excludeId)) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}
