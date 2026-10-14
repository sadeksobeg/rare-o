import { prisma } from "@/lib/db/prisma";
import type { PublicOfferStatus } from "@/lib/deals/constants";

export type UpsertPublicOfferInput = {
  slug: string;
  titleAr?: string;
  titleEn?: string;
  summaryAr?: string;
  summaryEn?: string;
  dealProposalId?: string | null;
  productId?: string | null;
  sortOrder?: number;
};

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function createPublicCuratedOffer(input: UpsertPublicOfferInput) {
  const slug = slugify(input.slug);
  if (!slug) throw new Error("INVALID_SLUG");

  if (input.dealProposalId) {
    const deal = await prisma.dealProposal.findUnique({
      where: { id: input.dealProposalId },
    });
    if (!deal) throw new Error("DEAL_NOT_FOUND");
  }
  if (input.productId) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
  }

  return prisma.publicCuratedOffer.create({
    data: {
      slug,
      titleAr: input.titleAr?.trim() || "",
      titleEn: input.titleEn?.trim() || "",
      summaryAr: input.summaryAr?.trim() || "",
      summaryEn: input.summaryEn?.trim() || "",
      dealProposalId: input.dealProposalId || null,
      productId: input.productId || null,
      sortOrder: input.sortOrder ?? 0,
      status: "draft",
    },
  });
}

export async function updatePublicCuratedOffer(
  id: string,
  input: UpsertPublicOfferInput
) {
  const slug = slugify(input.slug);
  if (!slug) throw new Error("INVALID_SLUG");

  return prisma.publicCuratedOffer.update({
    where: { id },
    data: {
      slug,
      titleAr: input.titleAr?.trim() || "",
      titleEn: input.titleEn?.trim() || "",
      summaryAr: input.summaryAr?.trim() || "",
      summaryEn: input.summaryEn?.trim() || "",
      dealProposalId: input.dealProposalId || null,
      productId: input.productId || null,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function setPublicOfferStatus(
  id: string,
  status: PublicOfferStatus,
  opts?: { plateAck?: boolean }
) {
  if (status === "published") {
    const offer = await prisma.publicCuratedOffer.findUnique({
      where: { id },
    });
    if (!offer) throw new Error("OFFER_NOT_FOUND");
    if (!offer.titleAr.trim()) throw new Error("PUBLISH_NEEDS_TITLE_AR");
    if (!offer.summaryAr.trim()) throw new Error("PUBLISH_NEEDS_SUMMARY_AR");
    if (!offer.productId && !opts?.plateAck) {
      throw new Error("PUBLISH_NEEDS_PRODUCT_OR_PLATE");
    }
  }

  return prisma.publicCuratedOffer.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "published" ? new Date() : null,
    },
  });
}

export async function listPublishedPublicOffers() {
  return prisma.publicCuratedOffer.findMany({
    where: { status: "published" },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          nameAr: true,
          nameEn: true,
          currency: true,
          retailPrice: true,
        },
      },
    },
  });
}

export async function getPublishedPublicOfferBySlug(slug: string) {
  return prisma.publicCuratedOffer.findFirst({
    where: { slug, status: "published" },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          nameAr: true,
          nameEn: true,
          descriptionAr: true,
          descriptionEn: true,
          currency: true,
          retailPrice: true,
        },
      },
    },
  });
}

export async function listPublicOffersForAdmin() {
  return prisma.publicCuratedOffer.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: {
      dealProposal: { select: { id: true, reference: true, title: true } },
      product: { select: { id: true, slug: true, nameEn: true } },
    },
  });
}
