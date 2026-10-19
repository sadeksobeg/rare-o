"use server";

import { redirect } from "next/navigation";
import {
  adminLoginSchema,
  categoryCreateSchema,
  categoryLabelUpdateSchema,
  productUpsertSchema,
  promoBandUpsertSchema,
  retailRequestCreateSchema,
  retailRequestIdSchema,
  retailRequestTransitionSchema,
} from "@/lib/validation/schemas";
import {
  clearAdminSessionCookie,
  createAdminSessionToken,
  requireAdminSession,
  setAdminSessionCookie,
  verifyPassword,
} from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import {
  createCategory,
  createProduct,
  deleteCategory,
  updateCategoryLabels,
  updateProduct,
} from "@/lib/catalog/service";
import {
  createPromoBand,
  deletePromoBand,
  updatePromoBand,
} from "@/lib/promos/service";
import {
  attachProductImage,
  removeProductImage,
  reorderProductImage,
  updateProductImageAlts,
  type ImageActionError,
} from "@/lib/catalog/images";
import {
  createRetailRequestFromCart,
  markRetailHandoffOpened,
  retriggerRetailHandoff,
  transitionRetailRequestStatus,
} from "@/lib/retail-request/service";
import { isRetailRequestStatus } from "@/lib/retail-request/constants";
import { LOCALE_COOKIE } from "@/lib/i18n/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type ActionResult =
  | { ok: true; message?: string; data?: unknown }
  | { ok: false; error: string };

export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale as Locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function adminLoginAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { clearLoginFailures, isLoginLocked, recordLoginFailure } =
    await import("@/lib/auth/rate-limit");

  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "LOGIN_INVALID" };
  }

  const email = parsed.data.email.toLowerCase();
  const lock = isLoginLocked("admin", email);
  if (lock.locked) {
    return { ok: false, error: "LOGIN_LOCKED" };
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email },
  });
  if (!admin) {
    recordLoginFailure("admin", email);
    return { ok: false, error: "LOGIN_INVALID" };
  }

  const valid = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!valid) {
    recordLoginFailure("admin", email);
    return { ok: false, error: "LOGIN_INVALID" };
  }

  clearLoginFailures("admin", email);
  const token = await createAdminSessionToken({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
  });
  await setAdminSessionCookie(token);
  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}

export async function upsertProductAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const id = String(formData.get("id") || "");
  const parsed = productUpsertSchema.safeParse({
    slug: formData.get("slug"),
    nameAr: formData.get("nameAr") || "",
    nameEn: formData.get("nameEn") || "",
    descriptionAr: formData.get("descriptionAr") || "",
    descriptionEn: formData.get("descriptionEn") || "",
    specsTextAr: formData.get("specsTextAr") || "",
    specsTextEn: formData.get("specsTextEn") || "",
    categoryId: formData.get("categoryId"),
    retailPrice: formData.get("retailPrice"),
    compareAtPrice: formData.get("compareAtPrice") ?? "",
    currency: formData.get("currency"),
    status: formData.get("status"),
    availability: formData.get("availability"),
    wholesaleEligible: formData.get("wholesaleEligible") === "on",
    badgeNew: formData.get("badgeNew") === "on",
    badgeFeatured: formData.get("badgeFeatured") === "on",
    badgeSale: formData.get("badgeSale") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product" };
  }

  if (parsed.data.status === "published") {
    if (!parsed.data.nameAr.trim()) {
      return { ok: false, error: "PUBLISH_NEEDS_NAME_AR" };
    }
    if (id) {
      const imageCount = await prisma.productImage.count({
        where: { productId: id },
      });
      if (imageCount < 1) {
        return { ok: false, error: "PUBLISH_NEEDS_IMAGE" };
      }
    } else {
      return { ok: false, error: "PUBLISH_NEEDS_IMAGE" };
    }
  }

  try {
    // Always land on the edit page so image/video upload is visible next.
    if (id) {
      await updateProduct(id, parsed.data);
      revalidatePath(`/admin/products/${id}`);
      revalidatePath("/admin/products");
      revalidatePath("/catalog");
      redirect(`/admin/products/${id}`);
    }
    const created = await createProduct(parsed.data);
    revalidatePath("/admin/products");
    redirect(`/admin/products/${created.id}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    if (msg === "INVALID_CATEGORY") {
      return { ok: false, error: "Category not found" };
    }
    if (msg.includes("Unique constraint")) {
      return { ok: false, error: "Slug already exists" };
    }
    // Next.js redirect throws — rethrow
    if (typeof e === "object" && e && "digest" in e) throw e;
    return { ok: false, error: msg };
  }
}

function imageErrorMessage(code: ImageActionError): string {
  switch (code) {
    case "TYPE":
      return "TYPE";
    case "SIZE":
      return "SIZE";
    case "DIM":
      return "DIM";
    case "MAX":
      return "MAX";
    case "NOT_FOUND":
      return "NOT_FOUND";
    default:
      return "GENERIC";
  }
}

export async function attachProductImageAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const productId = String(formData.get("productId") || "");
  const file = formData.get("file");
  if (!productId || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "GENERIC" };
  }

  const result = await attachProductImage({
    productId,
    file,
    altAr: String(formData.get("altAr") || ""),
    altEn: String(formData.get("altEn") || ""),
  });

  if (!result.ok) {
    return { ok: false, error: imageErrorMessage(result.error) };
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  return { ok: true };
}

export async function removeProductImageAction(
  formData: FormData
): Promise<void> {
  await requireAdminSession();
  const imageId = String(formData.get("imageId") || "");
  const productId = String(formData.get("productId") || "");
  await removeProductImage(imageId);
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
}

export async function reorderProductImageAction(
  formData: FormData
): Promise<void> {
  await requireAdminSession();
  const imageId = String(formData.get("imageId") || "");
  const productId = String(formData.get("productId") || "");
  const direction = String(formData.get("direction") || "");
  if (direction !== "earlier" && direction !== "later") return;
  await reorderProductImage(imageId, direction);
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
}

export async function updateProductImageAltsAction(
  formData: FormData
): Promise<void> {
  await requireAdminSession();
  const imageId = String(formData.get("imageId") || "");
  const productId = String(formData.get("productId") || "");
  await updateProductImageAlts({
    imageId,
    altAr: String(formData.get("altAr") || ""),
    altEn: String(formData.get("altEn") || ""),
  });
  revalidatePath(`/admin/products/${productId}`);
}

export async function updateCategoryFormAction(
  formData: FormData
): Promise<void> {
  await requireAdminSession();

  const parsed = categoryLabelUpdateSchema.safeParse({
    id: formData.get("id"),
    nameAr: formData.get("nameAr"),
    nameEn: formData.get("nameEn"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) {
    throw new Error("Invalid category labels");
  }

  await updateCategoryLabels(parsed.data);
  redirect("/admin/categories");
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
}

/** AD-08 — edit labels + sortOrder (dialog form; returns a result, no redirect). */
export async function updateCategoryAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
  const parsed = categoryLabelUpdateSchema.safeParse({
    id: formData.get("id"),
    nameAr: formData.get("nameAr"),
    nameEn: formData.get("nameEn"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { ok: false, error: "CATEGORY_INVALID" };
  try {
    await updateCategoryLabels(parsed.data);
  } catch {
    return { ok: false, error: "CATEGORY_INVALID" };
  }
  revalidateCategoryPaths();
  return { ok: true };
}

/** AD-08 — create a category. */
export async function createCategoryAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
  const parsed = categoryCreateSchema.safeParse({
    slug: formData.get("slug"),
    nameAr: formData.get("nameAr"),
    nameEn: formData.get("nameEn"),
    sortOrder: formData.get("sortOrder") || "0",
  });
  if (!parsed.success) return { ok: false, error: "CATEGORY_INVALID" };
  try {
    await createCategory(parsed.data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "SLUG_EXISTS" || msg.includes("Unique constraint")) {
      return { ok: false, error: "CATEGORY_SLUG_EXISTS" };
    }
    return { ok: false, error: "CATEGORY_INVALID" };
  }
  revalidateCategoryPaths();
  return { ok: true };
}

/** AD-08 — delete a category; rejected server-side when it still has products. */
export async function deleteCategoryAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, error: "CATEGORY_INVALID" };
  try {
    await deleteCategory(id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "CATEGORY_HAS_PRODUCTS" || msg === "CATEGORY_LAUNCH") {
      return { ok: false, error: msg };
    }
    return { ok: false, error: "CATEGORY_INVALID" };
  }
  revalidateCategoryPaths();
  return { ok: true };
}

export async function createRetailRequestAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const linesRaw = String(formData.get("linesJson") || "[]");
  let lines: unknown = [];
  try {
    lines = JSON.parse(linesRaw);
  } catch {
    return { ok: false, error: "Invalid cart payload" };
  }

  const parsed = retailRequestCreateSchema.safeParse({
    locale: formData.get("locale"),
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerNotes: formData.get("customerNotes") || "",
    destinationCountry: formData.get("destinationCountry"),
    shippingMethodCode: formData.get("shippingMethodCode") || null,
    shippingMethodLabel: formData.get("shippingMethodLabel") || null,
    lines,
    status: "ready_for_handoff",
    idempotencyKey: formData.get("idempotencyKey") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  try {
    const { request } = await createRetailRequestFromCart(parsed.data);
    return {
      ok: true,
      data: {
        reference: request.reference,
        id: request.id,
        status: request.status,
        whatsAppDeepLink: request.whatsAppDeepLink,
        handoffMessageText: request.handoffMessageText,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    if (msg === "WHATSAPP_BUSINESS_E164_MISSING") {
      return {
        ok: false,
        error: "WhatsApp business number is not configured",
      };
    }
    if (msg === "WHATSAPP_BUSINESS_E164_INVALID") {
      return {
        ok: false,
        error: "WhatsApp business number is invalid",
      };
    }
    return { ok: false, error: msg };
  }
}

export async function markRetailHandoffOpenedAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = retailRequestIdSchema.safeParse({
    requestId: formData.get("requestId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid request" };
  }

  try {
    const updated = await markRetailHandoffOpened({
      requestId: parsed.data.requestId,
      actor: "customer",
    });
    return {
      ok: true,
      data: {
        id: updated.id,
        status: updated.status,
        whatsAppDeepLink: updated.whatsAppDeepLink,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Handoff open failed";
    return { ok: false, error: msg };
  }
}

export async function adminTransitionRetailRequestAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = retailRequestTransitionSchema.safeParse({
    requestId: formData.get("requestId"),
    toStatus: formData.get("toStatus"),
    note: formData.get("note") || "",
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid transition" };
  }
  if (!isRetailRequestStatus(parsed.data.toStatus)) {
    return { ok: false, error: "Invalid status" };
  }

  try {
    await transitionRetailRequestStatus({
      requestId: parsed.data.requestId,
      toStatus: parsed.data.toStatus,
      actorAdminId: session.sub,
      note: parsed.data.note || undefined,
    });
    revalidatePath(`/admin/requests/${parsed.data.requestId}`);
    revalidatePath("/admin/requests");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Transition failed";
    return { ok: false, error: msg };
  }
}

export async function adminRetriggerRetailHandoffAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = retailRequestIdSchema.safeParse({
    requestId: formData.get("requestId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid request" };
  }

  try {
    const updated = await retriggerRetailHandoff({
      requestId: parsed.data.requestId,
      actorAdminId: session.sub,
    });
    revalidatePath(`/admin/requests/${parsed.data.requestId}`);
    revalidatePath("/admin/requests");
    revalidatePath("/admin");
    return {
      ok: true,
      data: {
        whatsAppDeepLink: updated.whatsAppDeepLink,
        handoffMessageText: updated.handoffMessageText,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Retrigger failed";
    if (msg === "WHATSAPP_BUSINESS_E164_MISSING") {
      return {
        ok: false,
        error: "WhatsApp business number is not configured",
      };
    }
    return { ok: false, error: msg };
  }
}

export async function adminMarkRetailHandoffOpenedAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = retailRequestIdSchema.safeParse({
    requestId: formData.get("requestId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid request" };
  }

  try {
    const updated = await markRetailHandoffOpened({
      requestId: parsed.data.requestId,
      actor: "admin",
      actorAdminId: session.sub,
    });
    revalidatePath(`/admin/requests/${parsed.data.requestId}`);
    revalidatePath("/admin/requests");
    revalidatePath("/admin");
    return {
      ok: true,
      data: {
        status: updated.status,
        whatsAppDeepLink: updated.whatsAppDeepLink,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Open failed";
    return { ok: false, error: msg };
  }
}

export async function upsertPromoBandAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const id = String(formData.get("id") || "");
  const parsed = promoBandUpsertSchema.safeParse({
    slug: formData.get("slug"),
    titleAr: formData.get("titleAr") || "",
    titleEn: formData.get("titleEn") || "",
    bodyAr: formData.get("bodyAr") || "",
    bodyEn: formData.get("bodyEn") || "",
    ctaLabelAr: formData.get("ctaLabelAr") || "",
    ctaLabelEn: formData.get("ctaLabelEn") || "",
    href: formData.get("href"),
    tone: formData.get("tone") || "ink",
    imagePath: formData.get("imagePath") || "",
    sortOrder: formData.get("sortOrder") || "0",
    status: formData.get("status") || "draft",
    startsAt: formData.get("startsAt") || "",
    endsAt: formData.get("endsAt") || "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid promo",
    };
  }

  try {
    if (id) {
      await updatePromoBand(id, parsed.data);
    } else {
      await createPromoBand(parsed.data);
    }
    revalidatePath("/");
    revalidatePath("/admin/promos");
    redirect("/admin/promos");
  } catch (e) {
    if (typeof e === "object" && e && "digest" in e) throw e;
    const msg = e instanceof Error ? e.message : "Save failed";
    if (msg.includes("Unique constraint")) {
      return { ok: false, error: "Slug already exists" };
    }
    return { ok: false, error: msg };
  }
}

export async function deletePromoBandAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await deletePromoBand(id);
  revalidatePath("/");
  revalidatePath("/admin/promos");
  redirect("/admin/promos");
}
