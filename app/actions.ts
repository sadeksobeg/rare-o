"use server";

import { redirect } from "next/navigation";
import { safePortalReturnTo } from "@/lib/auth/return-to";
import {
  adminLoginSchema,
  categoryCreateSchema,
  categoryLabelUpdateSchema,
  changePasswordSchema,
  productUpsertSchema,
  promoBandUpsertSchema,
  customerUpdateSchema,
  retailRequestCreateSchema,
  retailRequestIdSchema,
  retailRequestTransitionSchema,
} from "@/lib/validation/schemas";
import { oudSpecsFromFormData } from "@/lib/catalog/oud-specs";
import {
  createAdminSessionToken,
  handleAdminSessionError,
  hashPassword,
  requireAdminSession,
  requireAdminSessionAllowPasswordChange,
  setAdminSessionCookie,
  verifyPassword,
} from "@/lib/auth/admin-session";
import { checkNewPassword } from "@/lib/auth/password-policy";
import { prisma } from "@/lib/db/prisma";
import {
  createCategory,
  createProduct,
  deleteCategory,
  updateCategoryLabels,
  updateProduct,
} from "@/lib/catalog/service";
import { productSlugCandidate } from "@/lib/catalog/slug";
import { ensureUniqueProductSlug } from "@/lib/catalog/slug-unique";
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
import { revalidatePath } from "next/cache";
import { revalidateHomepageAndCatalogTags } from "@/lib/cache/revalidate-storefront";

export type ActionResult =
  | { ok: true; message?: string; data?: unknown }
  | { ok: false; error: string; data?: unknown };

export async function adminLoginAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { clearLoginFailures, isLoginLocked, recordLoginFailure } =
    await import("@/lib/auth/rate-limit");

  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    totpCode: formData.get("totpCode") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "LOGIN_INVALID" };
  }

  const email = parsed.data.email.toLowerCase();
  const lock = isLoginLocked("admin", email);
  if (lock.locked) {
    return {
      ok: false,
      error: "LOGIN_LOCKED",
      data: { retryAfterSec: lock.retryAfterSec ?? 60 },
    };
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

  const require2fa = process.env.REQUIRE_ADMIN_2FA === "1";
  const totpEnabled = Boolean(admin.totpEnabledAt && admin.totpSecretEnc);

  if (require2fa && !totpEnabled) {
    return { ok: false, error: "TOTP_ENROLL_REQUIRED" };
  }

  if (totpEnabled) {
    const code = (parsed.data.totpCode || "").trim();
    if (!code) {
      return { ok: false, error: "TOTP_REQUIRED" };
    }
    const {
      decryptTotpSecret,
      verifyTotp,
      consumeRecoveryCode,
    } = await import("@/lib/auth/totp");
    const { writeAdminAudit } = await import("@/lib/auth/admin-audit");
    let ok = false;
    try {
      const secret = decryptTotpSecret(admin.totpSecretEnc!);
      ok = verifyTotp(secret, code);
    } catch {
      ok = false;
    }
    if (!ok) {
      const recovered = await consumeRecoveryCode(
        admin.totpRecoveryHashes,
        code
      );
      if (recovered.ok) {
        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { totpRecoveryHashes: recovered.remainingJson },
        });
        ok = true;
        await writeAdminAudit({
          adminId: admin.id,
          action: "admin.login.recovery_code",
        });
      }
    }
    if (!ok) {
      recordLoginFailure("admin", email);
      return { ok: false, error: "TOTP_INVALID" };
    }
  }

  clearLoginFailures("admin", email);
  const { writeAdminAudit } = await import("@/lib/auth/admin-audit");
  await writeAdminAudit({
    adminId: admin.id,
    action: "admin.login",
  });
  const token = await createAdminSessionToken({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    mustChangePassword: admin.mustChangePassword,
    pwv: admin.passwordChangedAt?.getTime() ?? 0,
  });
  await setAdminSessionCookie(token);
  redirect(safePortalReturnTo(formData.get("returnTo"), "/admin"));
}

/** Used both by the forced /admin/force-password-change screen and the
 *  normal security-settings "change password" section — same policy either way. */
export async function adminChangePasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSessionAllowPasswordChange();
  } catch (e) {
    return handleAdminSessionError(e);
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, error: "LOGIN_INVALID" };
  }

  const { clearLoginFailures, isLoginLocked, recordLoginFailure } =
    await import("@/lib/auth/rate-limit");
  const lock = isLoginLocked("admin-pwchange", session.sub);
  if (lock.locked) {
    return {
      ok: false,
      error: "LOGIN_LOCKED",
      data: { retryAfterSec: lock.retryAfterSec ?? 60 },
    };
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  if (!admin) {
    return { ok: false, error: "Unauthorized" };
  }

  const currentOk = await verifyPassword(
    parsed.data.currentPassword,
    admin.passwordHash
  );
  if (!currentOk) {
    recordLoginFailure("admin-pwchange", session.sub);
    return { ok: false, error: "CURRENT_WRONG" };
  }
  clearLoginFailures("admin-pwchange", session.sub);

  const policyError = checkNewPassword(
    parsed.data.newPassword,
    parsed.data.confirmPassword,
    parsed.data.currentPassword,
    admin.email
  );
  if (policyError) {
    return { ok: false, error: policyError };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const now = new Date();
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash, mustChangePassword: false, passwordChangedAt: now },
  });

  const { writeAdminAudit } = await import("@/lib/auth/admin-audit");
  await writeAdminAudit({
    adminId: admin.id,
    action: "admin.password_change",
  });

  const token = await createAdminSessionToken({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    mustChangePassword: false,
    pwv: now.getTime(),
  });
  await setAdminSessionCookie(token);
  return { ok: true };
}

/** AUTH-07 — bump passwordChangedAt so other JWTs fail pwv without changing the password. */
export async function adminInvalidateOtherSessionsAction(): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, mustChangePassword: true },
  });
  if (!admin) {
    return { ok: false, error: "Unauthorized" };
  }

  const now = new Date();
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordChangedAt: now },
  });

  const { writeAdminAudit } = await import("@/lib/auth/admin-audit");
  await writeAdminAudit({
    adminId: admin.id,
    action: "admin.sessions.invalidate_others",
  });

  const token = await createAdminSessionToken({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    mustChangePassword: admin.mustChangePassword,
    pwv: now.getTime(),
  });
  await setAdminSessionCookie(token);
  return { ok: true };
}

/** Start TOTP enrollment — returns otpauth URL + plaintext recovery codes once. */
export async function enrollAdminTotpAction(): Promise<
  | {
      ok: true;
      otpauthUrl: string;
      secret: string;
      recoveryCodes: string[];
      qrDataUrl: string;
    }
  | { ok: false; error: string }
> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }
  const {
    generateTotpSecret,
    encryptTotpSecret,
    generateRecoveryCodes,
    hashRecoveryCodes,
  } = await import("@/lib/auth/totp");
  const QRCode = (await import("qrcode")).default;
  const { secret, otpauthUrl } = generateTotpSecret(session.email);
  const recoveryCodes = generateRecoveryCodes(8);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 200,
    color: { dark: "#08060a", light: "#ffffff" },
  });
  await prisma.adminUser.update({
    where: { id: session.sub },
    data: {
      totpSecretEnc: encryptTotpSecret(secret),
      totpRecoveryHashes: await hashRecoveryCodes(recoveryCodes),
      totpEnabledAt: null,
    },
  });
  return { ok: true, otpauthUrl, secret, recoveryCodes, qrDataUrl };
}

/** Clear TOTP so the admin can enroll again (e.g. new authenticator). */
export async function disableAdminTotpAction(): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }
  const { writeAdminAudit } = await import("@/lib/auth/admin-audit");
  await prisma.adminUser.update({
    where: { id: session.sub },
    data: {
      totpSecretEnc: null,
      totpRecoveryHashes: "[]",
      totpEnabledAt: null,
    },
  });
  await writeAdminAudit({
    adminId: session.sub,
    action: "admin.totp.disabled",
  });
  return { ok: true };
}

/** Confirm TOTP enrollment with a live code. */
export async function confirmAdminTotpAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }
  const code = String(formData.get("totpCode") || "").trim();
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.sub },
  });
  if (!admin?.totpSecretEnc) {
    return { ok: false, error: "TOTP_NOT_STARTED" };
  }
  const { decryptTotpSecret, verifyTotp } = await import("@/lib/auth/totp");
  const { writeAdminAudit } = await import("@/lib/auth/admin-audit");
  let secret: string;
  try {
    secret = decryptTotpSecret(admin.totpSecretEnc);
  } catch {
    return { ok: false, error: "TOTP_INVALID" };
  }
  if (!verifyTotp(secret, code)) {
    return { ok: false, error: "TOTP_INVALID" };
  }
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpEnabledAt: new Date() },
  });
  await writeAdminAudit({
    adminId: admin.id,
    action: "admin.totp.enabled",
  });
  return { ok: true };
}

export async function upsertProductAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let adminSession;
  try {
    adminSession = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
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
    oudSpecs: oudSpecsFromFormData(formData),
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
    weightKg: formData.get("weightKg") ?? "",
    shippingClass: formData.get("shippingClass") || "other",
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
      const prev = await prisma.product.findUnique({
        where: { id },
        select: { status: true, slug: true },
      });
      if (!prev) return { ok: false, error: "NOT_FOUND" };
      // Slug is system-protected after create — never accept client changes.
      await updateProduct(id, { ...parsed.data, slug: prev.slug });
      if (
        parsed.data.status === "published" &&
        prev.status !== "published"
      ) {
        const { writeAdminAudit } = await import("@/lib/auth/admin-audit");
        await writeAdminAudit({
          adminId: adminSession.sub,
          action: "product.publish",
          targetType: "product",
          targetId: id,
        });
      }
      revalidatePath(`/admin/products/${id}`);
      revalidatePath("/admin/products");
      revalidateProductStorefront();
      redirect(`/admin/products/${id}`);
    }
    const slug = await ensureUniqueProductSlug(
      productSlugCandidate(parsed.data.nameEn, parsed.data.nameAr)
    );
    const created = await createProduct({ ...parsed.data, slug });
    revalidatePath("/admin/products");
    revalidateProductStorefront();
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

/** CAT-01 — one-click publish/unpublish from the products gallery/table. */
export async function adminQuickSetProductStatusAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }

  const id = String(formData.get("productId") || "");
  const nextStatus = String(formData.get("status") || "");
  if (!id || (nextStatus !== "published" && nextStatus !== "draft")) {
    return { ok: false, error: "Invalid status" };
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      nameAr: true,
      status: true,
      _count: { select: { images: true } },
    },
  });
  if (!product) return { ok: false, error: "Not found" };

  if (nextStatus === "published") {
    if (!product.nameAr.trim()) {
      return { ok: false, error: "PUBLISH_NEEDS_NAME_AR" };
    }
    if (product._count.images < 1) {
      return { ok: false, error: "PUBLISH_NEEDS_IMAGE" };
    }
  }

  await prisma.product.update({
    where: { id },
    data: { status: nextStatus },
  });

  if (nextStatus === "published" && product.status !== "published") {
    const { writeAdminAudit } = await import("@/lib/auth/admin-audit");
    await writeAdminAudit({
      adminId: session.sub,
      action: "product.publish",
      targetType: "product",
      targetId: id,
    });
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidateProductStorefront();
  return { ok: true };
}

/** CAT-02 — persist drag-reorder as contiguous sortOrder values. */
export async function adminReorderCategoriesAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }

  const ids = formData
    .getAll("ids")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (ids.length === 0) return { ok: false, error: "Empty order" };

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );
  revalidateCategoryPaths();
  return { ok: true };
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
  } catch (e) {
    return handleAdminSessionError(e);
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
  revalidateProductStorefront();
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
  revalidateProductStorefront();
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
  revalidateProductStorefront();
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
  revalidatePath("/");
  revalidateHomepageAndCatalogTags();
}

function revalidateProductStorefront() {
  revalidatePath("/catalog");
  revalidatePath("/");
  revalidateHomepageAndCatalogTags();
}

/** AD-08 — edit labels + sortOrder (dialog form; returns a result, no redirect). */
export async function updateCategoryAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
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
  } catch (e) {
    return handleAdminSessionError(e);
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
  } catch (e) {
    return handleAdminSessionError(e);
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
  const honeypot = String(formData.get("companyWebsite") || "").trim();
  if (honeypot) {
    return { ok: false, error: "Invalid request" };
  }

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
    destinationCode: formData.get("destinationCode") || null,
    shippingMethodCode: formData.get("shippingMethodCode") || null,
    shippingMethodLabel: formData.get("shippingMethodLabel") || null,
    whatsappShippingOptIn: formData.get("whatsappShippingOptIn") === "on",
    shippingInquiry:
      formData.get("shippingInquiry") === "1" ||
      formData.get("shippingInquiry") === "on",
    lines,
    status: "ready_for_handoff",
    idempotencyKey: formData.get("idempotencyKey") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const { headers } = await import("next/headers");
  const { checkRetailRequestRateLimit } = await import(
    "@/lib/auth/public-rate-limit"
  );
  const h = await headers();
  const clientKey =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "local";
  const rl = checkRetailRequestRateLimit({
    clientKey,
    phone: parsed.data.customerPhone,
  });
  if (!rl.allowed) {
    return {
      ok: false,
      error: `Rate limit exceeded — retry in ${rl.retryAfterSec ?? 60}s`,
    };
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
  } catch (e) {
    return handleAdminSessionError(e);
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
  } catch (e) {
    return handleAdminSessionError(e);
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
  } catch (e) {
    return handleAdminSessionError(e);
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
  } catch (e) {
    return handleAdminSessionError(e);
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

export async function adminUpdateCustomerAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }

  const parsed = customerUpdateSchema.safeParse({
    customerId: formData.get("customerId"),
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid customer",
    };
  }

  const existing = await prisma.customer.findUnique({
    where: { id: parsed.data.customerId },
    select: { id: true, name: true, phone: true },
  });
  if (!existing) {
    return { ok: false, error: "Customer not found" };
  }

  await prisma.customer.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
    },
  });

  const { writeAdminAudit } = await import("@/lib/auth/admin-audit");
  await writeAdminAudit({
    adminId: session.sub,
    action: "customer.update",
    targetType: "customer",
    targetId: existing.id,
    meta: {
      nameFrom: existing.name,
      nameTo: parsed.data.name,
      phoneChanged: existing.phone !== parsed.data.phone,
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${existing.id}`);
  return { ok: true, message: "Customer updated" };
}
