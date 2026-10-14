"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  dealProposalCreateSchema,
  negotiationEntrySchema,
  publicOfferStatusSchema,
  publicOfferUpsertSchema,
  traderCreateSchema,
  traderLoginSchema,
} from "@/lib/validation/schemas";
import {
  clearTraderSessionCookie,
  createTraderSessionToken,
  requireTraderSession,
  setTraderSessionCookie,
  verifyPassword,
} from "@/lib/auth/trader-session";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import {
  addNegotiationEntry,
  createDealProposal,
  createTraderAccount,
  setTraderAccountStatus,
} from "@/lib/deals/service";
import {
  createPublicCuratedOffer,
  setPublicOfferStatus,
  updatePublicCuratedOffer,
} from "@/lib/offers/service";
import type { ActionResult } from "@/app/actions";

export async function traderLoginAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = traderLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid credentials payload" };
  }

  const trader = await prisma.traderAccount.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!trader || trader.status !== "active") {
    return { ok: false, error: "Invalid email or password" };
  }

  const valid = await verifyPassword(parsed.data.password, trader.passwordHash);
  if (!valid) return { ok: false, error: "Invalid email or password" };

  const token = await createTraderSessionToken({
    sub: trader.id,
    email: trader.email,
    displayName: trader.displayName,
  });
  await setTraderSessionCookie(token);
  redirect("/trader");
}

export async function traderLogoutAction(): Promise<void> {
  await clearTraderSessionCookie();
  redirect("/trader/login");
}

function generateTempPassword(length = 14): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i]! % alphabet.length]!;
  }
  return out;
}

export async function adminCreateTraderAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const tempPassword = generateTempPassword();
  const parsed = traderCreateSchema.safeParse({
    email: formData.get("email"),
    password: tempPassword,
    displayName: formData.get("displayName"),
    companyName: formData.get("companyName") || "",
    phone: formData.get("phone") || "",
    adminNotes: formData.get("adminNotes") || "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid trader",
    };
  }

  try {
    await createTraderAccount(parsed.data);
    revalidatePath("/admin/traders");
    return {
      ok: true,
      message: "Trader created",
      data: {
        tempPassword,
        email: parsed.data.email.trim().toLowerCase(),
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    if (msg === "TRADER_EMAIL_EXISTS") {
      return { ok: false, error: "Email already exists" };
    }
    return { ok: false, error: msg };
  }
}

export async function adminSetTraderStatusAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const traderId = String(formData.get("traderId") || "");
  const status = String(formData.get("status") || "");
  if (!traderId || (status !== "active" && status !== "disabled")) {
    return { ok: false, error: "Invalid status change" };
  }

  try {
    await setTraderAccountStatus(traderId, status);
    revalidatePath("/admin/traders");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Update failed",
    };
  }
}

export async function traderCreateDealAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = dealProposalCreateSchema.safeParse({
    dealKind: formData.get("dealKind"),
    title: formData.get("title"),
    productId: formData.get("productId") || null,
    proposedPrice: formData.get("proposedPrice"),
    currency: formData.get("currency"),
    quantity: formData.get("quantity"),
    conditionsNotes: formData.get("conditionsNotes") || "",
    message: formData.get("message") || "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid proposal",
    };
  }

  try {
    // traderId from session only — ignore any client-supplied traderId
    const deal = await createDealProposal({
      traderId: session.sub,
      dealKind: parsed.data.dealKind,
      title: parsed.data.title,
      productId: parsed.data.productId,
      proposedPrice: parsed.data.proposedPrice,
      currency: parsed.data.currency,
      quantity: parsed.data.quantity,
      conditionsNotes: parsed.data.conditionsNotes,
      message: parsed.data.message,
    });
    revalidatePath("/trader/deals");
    redirect(`/trader/deals/${deal.id}`);
  } catch (e) {
    if (typeof e === "object" && e && "digest" in e) throw e;
    const msg = e instanceof Error ? e.message : "Create failed";
    return { ok: false, error: msg };
  }
}

export async function traderNegotiateAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = negotiationEntrySchema.safeParse({
    dealId: formData.get("dealId"),
    action: formData.get("action"),
    message: formData.get("message") || "",
    proposedPrice: formData.get("proposedPrice"),
    currency: formData.get("currency"),
    quantity: formData.get("quantity"),
    conditionsNotes: formData.get("conditionsNotes"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid entry",
    };
  }

  try {
    const updated = await addNegotiationEntry({
      dealId: parsed.data.dealId,
      action: parsed.data.action,
      actorRole: "trader",
      actorTraderId: session.sub,
      message: parsed.data.message,
      proposedPrice: parsed.data.proposedPrice,
      currency: parsed.data.currency,
      quantity: parsed.data.quantity,
      conditionsNotes: parsed.data.conditionsNotes,
    });
    revalidatePath(`/trader/deals/${updated.id}`);
    revalidatePath("/trader/deals");
    return { ok: true, data: { status: updated.status } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Negotiation failed";
    if (msg === "FORBIDDEN" || msg === "DEAL_NOT_FOUND") {
      return { ok: false, error: "Not allowed" };
    }
    return { ok: false, error: msg };
  }
}

export async function adminNegotiateAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = negotiationEntrySchema.safeParse({
    dealId: formData.get("dealId"),
    action: formData.get("action"),
    message: formData.get("message") || "",
    proposedPrice: formData.get("proposedPrice"),
    currency: formData.get("currency"),
    quantity: formData.get("quantity"),
    conditionsNotes: formData.get("conditionsNotes"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid entry",
    };
  }

  try {
    const updated = await addNegotiationEntry({
      dealId: parsed.data.dealId,
      action: parsed.data.action,
      actorRole: "admin",
      actorAdminId: session.sub,
      message: parsed.data.message,
      proposedPrice: parsed.data.proposedPrice,
      currency: parsed.data.currency,
      quantity: parsed.data.quantity,
      conditionsNotes: parsed.data.conditionsNotes,
    });
    revalidatePath(`/admin/deals/${updated.id}`);
    revalidatePath("/admin/deals");
    return { ok: true, data: { status: updated.status } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Negotiation failed";
    return { ok: false, error: msg };
  }
}

export async function adminUpsertPublicOfferAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const id = String(formData.get("id") || "");
  const parsed = publicOfferUpsertSchema.safeParse({
    id: id || undefined,
    slug: formData.get("slug"),
    titleAr: formData.get("titleAr") || "",
    titleEn: formData.get("titleEn") || "",
    summaryAr: formData.get("summaryAr") || "",
    summaryEn: formData.get("summaryEn") || "",
    dealProposalId: formData.get("dealProposalId") || null,
    productId: formData.get("productId") || null,
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid offer",
    };
  }

  try {
    if (id) {
      await updatePublicCuratedOffer(id, parsed.data);
      revalidatePath("/admin/offers");
      revalidatePath(`/admin/offers/${id}`);
      revalidatePath("/offers");
      return { ok: true };
    }
    const offer = await createPublicCuratedOffer(parsed.data);
    revalidatePath("/admin/offers");
    redirect(`/admin/offers/${offer.id}`);
  } catch (e) {
    if (typeof e === "object" && e && "digest" in e) throw e;
    const msg = e instanceof Error ? e.message : "Save failed";
    if (msg.includes("Unique constraint")) {
      return { ok: false, error: "Slug already exists" };
    }
    return { ok: false, error: msg };
  }
}

export async function adminSetPublicOfferStatusAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = publicOfferStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid status" };
  }

  const plateAck =
    formData.get("plateAck") === "on" || formData.get("plateAck") === "true";

  try {
    await setPublicOfferStatus(parsed.data.id, parsed.data.status, {
      plateAck,
    });
    revalidatePath("/admin/offers");
    revalidatePath(`/admin/offers/${parsed.data.id}`);
    revalidatePath("/offers");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Status update failed",
    };
  }
}

export async function adminCreateOfferDraftFromDealAction(
  formData: FormData
): Promise<void> {
  await requireAdminSession();

  const dealId = String(formData.get("dealId") || "");
  if (!dealId) throw new Error("Missing deal");

  const deal = await prisma.dealProposal.findUnique({ where: { id: dealId } });
  if (!deal) throw new Error("Deal not found");

  const slugBase = deal.reference.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const offer = await createPublicCuratedOffer({
    slug: `${slugBase}-offer`,
    titleEn: deal.title,
    titleAr: deal.title,
    summaryEn: deal.conditionsNotes || "",
    summaryAr: deal.conditionsNotes || "",
    dealProposalId: deal.id,
    productId: deal.productId,
  });
  revalidatePath("/admin/offers");
  revalidatePath(`/admin/deals/${dealId}`);
  redirect(`/admin/offers/${offer.id}`);
}
