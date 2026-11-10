"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions";
import {
  handleAdminSessionError,
  requireAdminSession,
} from "@/lib/auth/admin-session";
import {
  handleTraderSessionError,
  requireTraderSession,
} from "@/lib/auth/trader-session";
import {
  wholesaleAdminTransitionSchema,
  wholesaleQuoteSchema,
  wholesaleRequestCreateSchema,
  wholesaleRequestIdSchema,
  wholesaleTraderRespondSchema,
} from "@/lib/validation/schemas";
import {
  adminProvideWholesaleQuote,
  adminTransitionWholesaleStatus,
  adminUpdateWholesaleShipping,
  createWholesaleRequest,
  markWholesaleHandoffOpened,
  traderCancelWholesaleRequest,
  traderRespondToWholesaleQuote,
} from "@/lib/wholesale/service";
import { isWholesaleStatus } from "@/lib/wholesale/constants";

/** Keep admin dashboard queue/KPIs in sync when wholesale records change. */
function revalidateWholesaleSurfaces(requestId?: string) {
  revalidatePath("/trader/wholesale");
  revalidatePath("/trader/wholesale/requests");
  revalidatePath("/admin");
  revalidatePath("/admin/wholesale");
  if (requestId) {
    revalidatePath(`/trader/wholesale/${requestId}`);
    revalidatePath(`/admin/wholesale/${requestId}`);
  }
}

export async function traderCreateWholesaleRequestAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch (e) {
    return handleTraderSessionError(e);
  }

  let linesRaw: unknown = [];
  try {
    linesRaw = JSON.parse(String(formData.get("linesJson") || "[]"));
  } catch {
    return { ok: false, error: "Invalid lines payload" };
  }

  const parsed = wholesaleRequestCreateSchema.safeParse({
    requestMode: formData.get("requestMode"),
    traderNotes: formData.get("traderNotes") || "",
    destinationCountry: formData.get("destinationCountry") || null,
    destinationCode: formData.get("destinationCode") || null,
    shippingMethodCode: formData.get("shippingMethodCode") || null,
    shippingMethodLabel: formData.get("shippingMethodLabel") || null,
    lines: linesRaw,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid wholesale request",
    };
  }

  try {
    // traderId from session only
    const request = await createWholesaleRequest({
      traderId: session.sub,
      requestMode: parsed.data.requestMode,
      traderNotes: parsed.data.traderNotes,
      destinationCountry: parsed.data.destinationCountry,
      destinationCode: parsed.data.destinationCode,
      shippingMethodCode: parsed.data.shippingMethodCode,
      shippingMethodLabel: parsed.data.shippingMethodLabel,
      lines: parsed.data.lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        proposedUnitPrice: l.proposedUnitPrice,
        currency: l.currency,
      })),
    });
    revalidateWholesaleSurfaces(request.id);
    // Client navigates — avoids blocking submit on detail-page RSC compile.
    return { ok: true, data: { id: request.id, reference: request.reference } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    if (msg === "PRODUCT_NOT_WHOLESALE_ELIGIBLE") {
      return {
        ok: false,
        error: "One or more products are not wholesale-eligible",
      };
    }
    if (msg === "INVALID_QUANTITY") {
      return { ok: false, error: "Invalid quantity" };
    }
    return { ok: false, error: msg };
  }
}

export async function traderRespondWholesaleQuoteAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch (e) {
    return handleTraderSessionError(e);
  }

  const parsed = wholesaleTraderRespondSchema.safeParse({
    requestId: formData.get("requestId"),
    accept: formData.get("accept"),
    note: formData.get("note") || "",
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid response" };
  }

  try {
    const { getRequestLocale } = await import("@/lib/i18n/server");
    const locale = await getRequestLocale();
    const updated = await traderRespondToWholesaleQuote({
      requestId: parsed.data.requestId,
      traderId: session.sub,
      accept: parsed.data.accept === "yes",
      note: parsed.data.note,
      locale,
    });
    revalidateWholesaleSurfaces(updated.id);
    return { ok: true, data: { status: updated.status } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Response failed";
    if (msg === "REQUEST_NOT_FOUND") {
      return { ok: false, error: "Not allowed" };
    }
    return { ok: false, error: msg };
  }
}

export async function traderCancelWholesaleRequestAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch (e) {
    return handleTraderSessionError(e);
  }

  const parsed = wholesaleRequestIdSchema.safeParse({
    requestId: formData.get("requestId"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  try {
    const updated = await traderCancelWholesaleRequest({
      requestId: parsed.data.requestId,
      traderId: session.sub,
      note: String(formData.get("note") || "") || undefined,
    });
    revalidateWholesaleSurfaces(updated.id);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Cancel failed";
    if (msg === "REQUEST_NOT_FOUND") {
      return { ok: false, error: "Not allowed" };
    }
    return { ok: false, error: msg };
  }
}

export async function adminTransitionWholesaleAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }

  const parsed = wholesaleAdminTransitionSchema.safeParse({
    requestId: formData.get("requestId"),
    toStatus: formData.get("toStatus"),
    note: formData.get("note") || "",
  });
  if (!parsed.success) return { ok: false, error: "Invalid transition" };
  if (!isWholesaleStatus(parsed.data.toStatus)) {
    return { ok: false, error: "Invalid status" };
  }

  try {
    const updated = await adminTransitionWholesaleStatus({
      requestId: parsed.data.requestId,
      toStatus: parsed.data.toStatus,
      actorAdminId: session.sub,
      note: parsed.data.note || undefined,
    });
    revalidateWholesaleSurfaces(updated.id);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Transition failed";
    return { ok: false, error: msg };
  }
}

export async function adminProvideWholesaleQuoteAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }

  const parsed = wholesaleQuoteSchema.safeParse({
    requestId: formData.get("requestId"),
    quoteMessage: formData.get("quoteMessage") || "",
    quoteCurrency: formData.get("quoteCurrency"),
    lineQuotesJson: formData.get("lineQuotesJson"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid quotation",
    };
  }

  let lineQuotes: Array<{ lineId: string; quotedUnitPrice: number }>;
  try {
    const raw = JSON.parse(parsed.data.lineQuotesJson) as unknown;
    if (!Array.isArray(raw)) throw new Error("bad");
    lineQuotes = raw.map((item) => {
      const row = item as { lineId?: string; quotedUnitPrice?: unknown };
      return {
        lineId: String(row.lineId || ""),
        quotedUnitPrice: Number(row.quotedUnitPrice),
      };
    });
  } catch {
    return { ok: false, error: "Invalid line quotes" };
  }

  try {
    const updated = await adminProvideWholesaleQuote({
      requestId: parsed.data.requestId,
      actorAdminId: session.sub,
      quoteMessage: parsed.data.quoteMessage,
      quoteCurrency: parsed.data.quoteCurrency,
      lineQuotes,
    });
    revalidateWholesaleSurfaces(updated.id);
    return { ok: true, data: { status: updated.status } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Quote failed";
    return { ok: false, error: msg };
  }
}

export async function adminUpdateWholesaleShippingAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }

  const requestId = String(formData.get("requestId") || "").trim();
  const carrier = String(formData.get("carrier") || "").trim();
  const trackingReference = String(
    formData.get("trackingReference") || ""
  ).trim();
  if (!requestId) return { ok: false, error: "Invalid request" };

  try {
    const updated = await adminUpdateWholesaleShipping({
      requestId,
      actorAdminId: session.sub,
      carrier,
      trackingReference,
      shippedAt: new Date(),
    });
    revalidateWholesaleSurfaces(updated.id);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Shipping update failed";
    return { ok: false, error: msg };
  }
}

export async function traderOpenWholesaleHandoffAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch (e) {
    return handleTraderSessionError(e);
  }
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return { ok: false, error: "Missing request" };
  try {
    await markWholesaleHandoffOpened({ requestId, traderId: session.sub });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  revalidatePath(`/trader/wholesale/${requestId}`);
  return { ok: true };
}
