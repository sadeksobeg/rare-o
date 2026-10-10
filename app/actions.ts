"use server";

import { redirect } from "next/navigation";
import {
  adminLoginSchema,
  categoryLabelUpdateSchema,
  productUpsertSchema,
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
  createProduct,
  updateCategoryLabels,
  updateProduct,
} from "@/lib/catalog/service";
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
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid credentials payload" };
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!admin) return { ok: false, error: "Invalid email or password" };

  const valid = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!valid) return { ok: false, error: "Invalid email or password" };

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
    currency: formData.get("currency"),
    status: formData.get("status"),
    availability: formData.get("availability"),
    wholesaleEligible: formData.get("wholesaleEligible") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product" };
  }

  try {
    if (id) {
      await updateProduct(id, parsed.data);
    } else {
      await createProduct(parsed.data);
    }
    redirect("/admin/products");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    if (msg === "INVALID_CATEGORY") {
      return { ok: false, error: "Category must be one of the two launch categories" };
    }
    if (msg.includes("Unique constraint")) {
      return { ok: false, error: "Slug already exists" };
    }
    // Next.js redirect throws — rethrow
    if (typeof e === "object" && e && "digest" in e) throw e;
    return { ok: false, error: msg };
  }
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
