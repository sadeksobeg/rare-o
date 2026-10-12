import { z } from "zod";
import {
  PRODUCT_AVAILABILITIES,
  PRODUCT_STATUSES,
} from "@/lib/catalog/constants";
import { isCurrencyCode } from "@/lib/catalog/currency";
import {
  RETAIL_REQUEST_CREATE_STATUSES,
  RETAIL_REQUEST_STATUSES,
} from "@/lib/retail-request/constants";
import {
  DEAL_KINDS,
  OPEN_DEAL_NEGOTIATION_ACTIONS,
  PUBLIC_OFFER_STATUSES,
} from "@/lib/deals/constants";
import {
  WHOLESALE_QTY_TECHNICAL_MAX,
  WHOLESALE_REQUEST_MODES,
  WHOLESALE_STATUSES,
} from "@/lib/wholesale/constants";

export const productUpsertSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug"),
  nameAr: z.string().max(200).default(""),
  nameEn: z.string().max(200).default(""),
  descriptionAr: z.string().max(10000).default(""),
  descriptionEn: z.string().max(10000).default(""),
  specsTextAr: z.string().max(10000).default(""),
  specsTextEn: z.string().max(10000).default(""),
  categoryId: z.string().min(1),
  retailPrice: z.coerce.number().nonnegative(),
  compareAtPrice: z
    .union([z.literal(""), z.coerce.number().nonnegative()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  currency: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .refine(isCurrencyCode, "Currency must be a short uppercase code"),
  status: z.enum(PRODUCT_STATUSES),
  availability: z.enum(PRODUCT_AVAILABILITIES),
  wholesaleEligible: z.coerce.boolean().default(false),
});

const PROMO_TONES = ["ink", "plum", "sand"] as const;
const PROMO_STATUSES = ["draft", "published"] as const;

export const promoBandUpsertSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug"),
    titleAr: z.string().max(200).default(""),
    titleEn: z.string().max(200).default(""),
    bodyAr: z.string().max(2000).default(""),
    bodyEn: z.string().max(2000).default(""),
    ctaLabelAr: z.string().max(80).default(""),
    ctaLabelEn: z.string().max(80).default(""),
    href: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^\/[a-zA-Z0-9/_-]*$/, "Href must be an internal path starting with /"),
    tone: z.enum(PROMO_TONES).default("ink"),
    imagePath: z
      .string()
      .trim()
      .max(300)
      .optional()
      .transform((v) => (v ? v : null)),
    sortOrder: z.coerce.number().int().min(0).max(999).default(0),
    status: z.enum(PROMO_STATUSES).default("draft"),
    startsAt: z
      .string()
      .optional()
      .transform((v) => {
        if (!v?.trim()) return null;
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
      }),
    endsAt: z
      .string()
      .optional()
      .transform((v) => {
        if (!v?.trim()) return null;
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
      }),
  })
  .refine(
    (v) => !v.startsAt || !v.endsAt || v.endsAt >= v.startsAt,
    { message: "endsAt must be after startsAt", path: ["endsAt"] }
  );

export type PromoBandUpsertInput = z.infer<typeof promoBandUpsertSchema>;

export const categoryLabelUpdateSchema = z.object({
  id: z.string().min(1),
  nameAr: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().min(1).max(120),
  sortOrder: z.coerce.number().int().min(0).max(100),
});

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const retailRequestCreateSchema = z.object({
  locale: z.enum(["ar", "en"]),
  customerName: z.string().trim().min(1).max(120),
  customerPhone: z.string().trim().min(5).max(40),
  customerNotes: z.string().trim().max(2000).optional().default(""),
  destinationCountry: z.string().trim().min(2).max(80),
  shippingMethodCode: z.string().trim().max(40).nullable().optional(),
  shippingMethodLabel: z.string().trim().max(120).nullable().optional(),
  lines: z.array(cartLineSchema).min(1),
  status: z.enum(RETAIL_REQUEST_CREATE_STATUSES).default("ready_for_handoff"),
});

export const retailRequestTransitionSchema = z.object({
  requestId: z.string().min(1),
  toStatus: z.enum(RETAIL_REQUEST_STATUSES),
  note: z.string().trim().max(500).optional().default(""),
});

export const retailRequestIdSchema = z.object({
  requestId: z.string().min(1),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export const traderLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export const traderCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  displayName: z.string().trim().min(1).max(120),
  companyName: z.string().trim().max(160).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  adminNotes: z.string().trim().max(2000).optional().default(""),
});

const optionalMoney = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  return v;
}, z.coerce.number().nonnegative().nullable().optional());

const optionalQty = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  return v;
}, z.coerce.number().int().positive().max(999999).nullable().optional());

const optionalCurrency = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  return String(v)
    .trim()
    .toUpperCase();
}, z
  .string()
  .nullable()
  .optional()
  .refine(
    (s) => s == null || isCurrencyCode(s),
    "Currency must be a short uppercase code"
  ));

export const dealProposalCreateSchema = z
  .object({
    dealKind: z.enum(DEAL_KINDS),
    title: z.string().trim().min(1).max(200),
    productId: z.string().trim().min(1).optional().nullable(),
    proposedPrice: optionalMoney,
    currency: optionalCurrency,
    quantity: optionalQty,
    conditionsNotes: z.string().trim().max(5000).optional().default(""),
    message: z.string().trim().max(5000).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.dealKind === "catalog" && !data.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Catalog deals require a product reference",
        path: ["productId"],
      });
    }
    if (data.dealKind === "non_catalog" && data.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Non-catalog deals must not reference a product",
        path: ["productId"],
      });
    }
  });

export const negotiationEntrySchema = z.object({
  dealId: z.string().min(1),
  action: z.enum(OPEN_DEAL_NEGOTIATION_ACTIONS),
  message: z.string().trim().max(5000).optional().default(""),
  proposedPrice: optionalMoney,
  currency: optionalCurrency,
  quantity: optionalQty,
  conditionsNotes: z.string().trim().max(5000).optional().nullable(),
});

export const publicOfferUpsertSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug"),
  titleAr: z.string().max(200).optional().default(""),
  titleEn: z.string().max(200).optional().default(""),
  summaryAr: z.string().max(5000).optional().default(""),
  summaryEn: z.string().max(5000).optional().default(""),
  dealProposalId: z.string().trim().min(1).optional().nullable(),
  productId: z.string().trim().min(1).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
});

export const publicOfferStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(PUBLIC_OFFER_STATUSES),
});

export const wholesaleLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce
    .number()
    .int()
    .min(1)
    .max(WHOLESALE_QTY_TECHNICAL_MAX),
  proposedUnitPrice: optionalMoney,
  currency: optionalCurrency,
});

export const wholesaleRequestCreateSchema = z
  .object({
    requestMode: z.enum(WHOLESALE_REQUEST_MODES),
    traderNotes: z.string().trim().max(5000).optional().default(""),
    lines: z.array(wholesaleLineSchema).min(1).max(50),
  })
  .superRefine((data, ctx) => {
    if (data.requestMode === "propose_price") {
      data.lines.forEach((line, i) => {
        if (line.proposedUnitPrice == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Proposed unit price required",
            path: ["lines", i, "proposedUnitPrice"],
          });
        }
        if (!line.currency) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Currency required with proposed price",
            path: ["lines", i, "currency"],
          });
        }
      });
    }
  });

export const wholesaleAdminTransitionSchema = z.object({
  requestId: z.string().min(1),
  toStatus: z.enum(WHOLESALE_STATUSES),
  note: z.string().trim().max(2000).optional().default(""),
});

export const wholesaleQuoteSchema = z.object({
  requestId: z.string().min(1),
  quoteMessage: z.string().trim().max(5000).optional().default(""),
  quoteCurrency: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .refine(isCurrencyCode, "Invalid currency"),
  lineQuotesJson: z.string().min(2),
});

export const wholesaleTraderRespondSchema = z.object({
  requestId: z.string().min(1),
  accept: z.enum(["yes", "no"]),
  note: z.string().trim().max(2000).optional().default(""),
});

export const wholesaleRequestIdSchema = z.object({
  requestId: z.string().min(1),
});

export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;
export type RetailRequestCreateInput = z.infer<typeof retailRequestCreateSchema>;
export type DealProposalCreateInput = z.infer<typeof dealProposalCreateSchema>;
export type NegotiationEntryInput = z.infer<typeof negotiationEntrySchema>;
export type WholesaleRequestCreateInput = z.infer<
  typeof wholesaleRequestCreateSchema
>;
