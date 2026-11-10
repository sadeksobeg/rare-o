"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

import type { ActionResult } from "@/app/actions";
import {
  handleAdminSessionError,
  requireAdminSession,
} from "@/lib/auth/admin-session";
import {
  addInboxNote,
  addInboxTag,
  getInboxConversation,
  getInboxHealthView,
  listInboxConversations,
  markConversationRead,
  removeInboxTag,
} from "@/lib/whatsapp/messaging/inbox";
import {
  enqueueOutboundMedia,
  enqueueOutboundText,
} from "@/lib/whatsapp/messaging/service";
import { sendAdminPlatformMessage } from "@/lib/whatsapp/messaging/trader-channel";
import {
  applyFakeLogout,
  applyFakePairing,
  applyFakeReconnect,
  normalizePairingPhone,
  setLinkCommand,
} from "@/lib/whatsapp/messaging/pairing";
import { isFakeWhatsAppAdapter } from "@/lib/whatsapp/types";
import { MAX_OUTBOUND_TEXT_LENGTH } from "@/lib/whatsapp/messaging/constants";
import {
  clearConversationBusinessLink,
  getBusinessContextForConversation,
  linkConversationToBusinessRecord,
  setConversationCrmParty,
  suggestCrmPartiesForConversation,
} from "@/lib/whatsapp/messaging/linking";
import {
  mediaKindFromMime,
  normalizeOutboundMime,
  WHATSAPP_MAX_MEDIA_BYTES,
  WHATSAPP_OUTBOUND_MIME,
} from "@/lib/whatsapp/media-shared";
import { prisma } from "@/lib/db/prisma";
import { containsCI } from "@/lib/db/search";

/**
 * Admin WhatsApp actions — authorize every call server-side.
 * Never imports Baileys adapter. Outbound only enqueues pending rows.
 */

export async function adminListInboxConversationsAction(): Promise<
  ActionResult & { data?: Awaited<ReturnType<typeof listInboxConversations>> }
> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const data = await listInboxConversations();
  return { ok: true, data };
}

export async function adminGetInboxConversationAction(
  conversationId: string
): Promise<
  ActionResult & {
    data?: NonNullable<Awaited<ReturnType<typeof getInboxConversation>>>;
  }
> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const data = await getInboxConversation(conversationId);
  if (!data) return { ok: false, error: "NOT_FOUND" };
  return { ok: true, data };
}

export async function adminGetInboxHealthAction(): Promise<
  ActionResult & { data?: Awaited<ReturnType<typeof getInboxHealthView>> }
> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const data = await getInboxHealthView();
  return { ok: true, data };
}

export async function adminMarkInboxConversationReadAction(
  conversationId: string
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const ok = await markConversationRead(conversationId);
  if (!ok) return { ok: false, error: "NOT_FOUND" };
  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/inbox/${conversationId}`);
  return { ok: true };
}

/**
 * Enqueue outbound text for a conversation.
 * clientRequestId may be supplied by the client for retry idempotency;
 * otherwise a server UUID is generated.
 */
export async function adminSendWhatsAppTextAction(
  formData: FormData
): Promise<
  ActionResult & {
    data?: {
      messageId: string;
      conversationId: string;
      status: string;
      duplicate: boolean;
    };
  }
> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }

  const conversationId = String(formData.get("conversationId") || "").trim();
  const text = String(formData.get("text") || "");
  const clientRequestId =
    String(formData.get("clientRequestId") || "").trim() || randomUUID();

  if (!conversationId) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  if (!text.trim()) {
    return { ok: false, error: "EMPTY_TEXT" };
  }
  if (text.trim().length > MAX_OUTBOUND_TEXT_LENGTH) {
    return { ok: false, error: "TEXT_TOO_LONG" };
  }

  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, waChatId: true },
  });
  if (!conversation) {
    return { ok: false, error: "NOT_FOUND" };
  }

  const result = await enqueueOutboundText({
    waChatId: conversation.waChatId,
    text,
    clientRequestId,
    adminId: session.sub,
    // W1: never invent a cold conversation from the admin composer
    allowCreateConversation: false,
  });

  if (!result.ok) {
    if (result.code === "OUTBOUND_DISABLED") {
      // Real WhatsApp send is unavailable (kill switch or no connection) —
      // fall back to the same platform channel the trader portal already
      // writes into, so the admin can still reply. Same conversation, same
      // thread the trader already reads; never a second inbox.
      const platformResult = await sendAdminPlatformMessage({
        conversationId: conversation.id,
        adminId: session.sub,
        text,
      });
      if (!platformResult.ok) {
        return { ok: false, error: platformResult.error };
      }
      revalidatePath("/admin/inbox");
      revalidatePath(`/admin/inbox/${conversationId}`);
      return {
        ok: true,
        data: {
          messageId: platformResult.messageId,
          conversationId: platformResult.conversationId,
          status: "sent",
          duplicate: false,
        },
      };
    }
    if (
      result.code === "RATE_LIMITED" ||
      result.code === "SAFETY_CIRCUIT" ||
      result.code === "RECONNECT_COOLDOWN"
    ) {
      return { ok: false, error: "RATE_LIMITED" };
    }
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/inbox/${conversationId}`);

  return {
    ok: true,
    data: {
      messageId: result.messageId,
      conversationId: result.conversationId,
      status: result.status,
      duplicate: result.duplicate,
    },
  };
}

/** Enqueue outbound image/video/audio/document from admin composer. */
export async function adminSendWhatsAppMediaAction(
  formData: FormData
): Promise<
  ActionResult & {
    data?: {
      messageId: string;
      conversationId: string;
      status: string;
      duplicate: boolean;
    };
  }
> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }

  const conversationId = String(formData.get("conversationId") || "").trim();
  const clientRequestId =
    String(formData.get("clientRequestId") || "").trim() || randomUUID();
  const caption = String(formData.get("caption") || "").trim() || null;
  const file = formData.get("file");

  if (!conversationId) return { ok: false, error: "INVALID_INPUT" };
  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false, error: "EMPTY_MEDIA" };
  }
  if (file.size > WHATSAPP_MAX_MEDIA_BYTES) {
    return { ok: false, error: "MEDIA_TOO_LARGE" };
  }

  const mime = normalizeOutboundMime(file.type || "");
  if (!WHATSAPP_OUTBOUND_MIME[mime]) {
    return { ok: false, error: "BAD_MIME" };
  }
  const kind = mediaKindFromMime(mime);
  if (!kind || kind === "sticker") {
    return { ok: false, error: "BAD_MIME" };
  }

  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, waChatId: true },
  });
  if (!conversation) return { ok: false, error: "NOT_FOUND" };

  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await enqueueOutboundMedia({
    waChatId: conversation.waChatId,
    clientRequestId,
    adminId: session.sub,
    messageType: kind,
    bytes,
    mime,
    fileName: file.name || null,
    caption,
  });

  if (!result.ok) {
    if (result.code === "OUTBOUND_DISABLED") {
      return { ok: false, error: "OUTBOUND_DISABLED" };
    }
    if (
      result.code === "RATE_LIMITED" ||
      result.code === "SAFETY_CIRCUIT" ||
      result.code === "RECONNECT_COOLDOWN"
    ) {
      return { ok: false, error: "RATE_LIMITED" };
    }
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/inbox/${conversationId}`);

  return {
    ok: true,
    data: {
      messageId: result.messageId,
      conversationId: result.conversationId,
      status: result.status,
      duplicate: result.duplicate,
    },
  };
}

export async function adminSetWhatsAppCrmPartyAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }

  const conversationId = String(formData.get("conversationId") || "").trim();
  const customerIdRaw = formData.get("customerId");
  const traderIdRaw = formData.get("traderId");
  const clear = String(formData.get("clear") || "") === "1";

  const result = await setConversationCrmParty({
    conversationId,
    adminId: session.sub,
    customerId: clear
      ? null
      : customerIdRaw != null
        ? String(customerIdRaw)
        : undefined,
    traderId: clear
      ? null
      : traderIdRaw != null
        ? String(traderIdRaw)
        : undefined,
  });

  if (!result.ok) return { ok: false, error: result.code };

  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/inbox/${conversationId}`);
  return { ok: true };
}

export async function adminSuggestWhatsAppCrmPartiesAction(
  conversationId: string
): Promise<
  ActionResult & {
    data?: Awaited<ReturnType<typeof suggestCrmPartiesForConversation>>;
  }
> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const data = await suggestCrmPartiesForConversation(conversationId);
  return { ok: true, data };
}

/**
 * Explicitly link a conversation to an existing Week 3 domain record.
 * Allowlisted link types only. Does not mutate business status.
 */
export async function adminLinkWhatsAppConversationAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }

  const conversationId = String(formData.get("conversationId") || "").trim();
  const linkType = String(formData.get("linkType") || "").trim();
  const linkId = String(formData.get("linkId") || "").trim();

  const result = await linkConversationToBusinessRecord({
    conversationId,
    linkType,
    linkId,
    adminId: session.sub,
  });

  if (!result.ok) {
    return { ok: false, error: result.code };
  }

  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/inbox/${conversationId}`);
  return { ok: true, message: result.action };
}

/**
 * Clear the primary business link on a conversation.
 */
export async function adminUnlinkWhatsAppConversationAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }

  const conversationId = String(formData.get("conversationId") || "").trim();
  const result = await clearConversationBusinessLink({
    conversationId,
    adminId: session.sub,
  });

  if (!result.ok) {
    return { ok: false, error: result.code };
  }

  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/inbox/${conversationId}`);
  return { ok: true };
}

export async function adminGetBusinessContextAction(
  conversationId: string
): Promise<
  ActionResult & {
    data?: Awaited<ReturnType<typeof getBusinessContextForConversation>>;
  }
> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const data = await getBusinessContextForConversation(conversationId);
  return { ok: true, data };
}

/**
 * Re-queue a failed outbound message as pending (same row — no duplicate).
 * Does not touch Baileys adapter; the worker drains pending as usual.
 * Idempotent: if already pending/sending/sent, returns without duplicating.
 */
export async function adminRetryWhatsAppMessageAction(
  formData: FormData
): Promise<ActionResult & { data?: { messageId: string; status: string } }> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }

  const messageId = String(formData.get("messageId") || "").trim();
  if (!messageId) return { ok: false, error: "INVALID_INPUT" };

  const row = await prisma.whatsAppMessage.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      direction: true,
      status: true,
      attemptCount: true,
      conversationId: true,
    },
  });
  if (!row || row.direction !== "outbound") {
    return { ok: false, error: "NOT_FOUND" };
  }
  if (row.status === "sent" || row.status === "pending" || row.status === "sending") {
    return { ok: true, data: { messageId: row.id, status: row.status } };
  }
  if (row.status !== "failed") {
    return { ok: false, error: "NOT_RETRYABLE" };
  }

  const { MAX_OUTBOUND_ATTEMPTS } = await import(
    "@/lib/whatsapp/messaging/reliability"
  );
  if (row.attemptCount >= MAX_OUTBOUND_ATTEMPTS) {
    return { ok: false, error: "MAX_ATTEMPTS" };
  }

  await prisma.whatsAppMessage.update({
    where: { id: messageId },
    data: { status: "pending", errorSafe: null, nextRetryAt: null },
  });

  const { publishInboxEvent } = await import(
    "@/lib/whatsapp/messaging/inbox-events"
  );
  void publishInboxEvent("message.status", {
    conversationId: row.conversationId,
    messageId: row.id,
    status: "pending",
    direction: "outbound",
  });

  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/inbox/${row.conversationId}`);
  return { ok: true, data: { messageId: row.id, status: "pending" } };
}

export type LinkableRecordHit = {
  id: string;
  reference: string;
  label: string;
  linkType:
    | "retail_request"
    | "deal_proposal"
    | "wholesale_request"
    | "brokerage_request";
};

/** Search domain records for A17 RecordPicker (reference / title). */
export async function adminSearchLinkableRecordsAction(
  formData: FormData
): Promise<ActionResult & { data?: LinkableRecordHit[] }> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }

  const linkType = String(formData.get("linkType") || "").trim();
  const q = String(formData.get("q") || "").trim().slice(0, 80);

  if (
    linkType !== "retail_request" &&
    linkType !== "deal_proposal" &&
    linkType !== "wholesale_request" &&
    linkType !== "brokerage_request"
  ) {
    return { ok: false, error: "UNSUPPORTED_LINK_TYPE" };
  }

  const take = 20;
  if (linkType === "retail_request") {
    const rows = await prisma.retailRequest.findMany({
      where: q
        ? {
            OR: [
              { reference: containsCI(q) },
              { customerName: containsCI(q) },
              { customerPhone: containsCI(q) },
            ],
          }
        : undefined,
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, reference: true, customerName: true },
    });
    return {
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        reference: r.reference,
        label: r.customerName || r.reference,
        linkType: "retail_request" as const,
      })),
    };
  }

  if (linkType === "deal_proposal") {
    const rows = await prisma.dealProposal.findMany({
      where: q
        ? {
            OR: [
              { reference: containsCI(q) },
              { title: containsCI(q) },
            ],
          }
        : undefined,
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, reference: true, title: true },
    });
    return {
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        reference: r.reference,
        label: r.title || r.reference,
        linkType: "deal_proposal" as const,
      })),
    };
  }

  if (linkType === "wholesale_request") {
    const rows = await prisma.wholesaleRequest.findMany({
      where: q ? { reference: containsCI(q) } : undefined,
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, reference: true },
    });
    return {
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        reference: r.reference,
        label: r.reference,
        linkType: "wholesale_request" as const,
      })),
    };
  }

  const rows = await prisma.brokerageRequest.findMany({
    where: q
      ? {
          OR: [
            { reference: containsCI(q) },
            { descriptionAr: containsCI(q) },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take,
    select: { id: true, reference: true, descriptionAr: true },
  });
  return {
    ok: true,
    data: rows.map((r) => ({
      id: r.id,
      reference: r.reference,
      label: r.descriptionAr.slice(0, 60) || r.reference,
      linkType: "brokerage_request" as const,
    })),
  };
}

/**
 * Admin WhatsApp account linking (pairing).
 * Fake mode (WHATSAPP_ADAPTER=fake) mutates the DB directly — no worker needed.
 * Real mode queues a linkCommand the worker polls and executes.
 * Never broadcasts; pairs a single account only.
 */
export async function adminRequestWhatsAppPairingAction(
  phone: string,
  wantQr = false
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }

  const digits = normalizePairingPhone(String(phone ?? ""));
  if (!digits) return { ok: false, error: "INVALID_PHONE" };

  if (isFakeWhatsAppAdapter()) {
    const res = await applyFakePairing(digits, Boolean(wantQr));
    if (!res.ok) return { ok: false, error: res.error };
  } else {
    await setLinkCommand(wantQr ? "qr" : "pair", digits);
  }

  revalidatePath("/admin/inbox");
  return { ok: true };
}

export async function adminWhatsAppReconnectAction(): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }

  if (isFakeWhatsAppAdapter()) {
    await applyFakeReconnect();
  } else {
    await setLinkCommand("reconnect");
  }

  revalidatePath("/admin/inbox");
  return { ok: true };
}

export async function adminWhatsAppLogoutAction(): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }

  if (isFakeWhatsAppAdapter()) {
    await applyFakeLogout();
  } else {
    await setLinkCommand("logout");
  }

  revalidatePath("/admin/inbox");
  return { ok: true };
}

/** Internal note — never sent to the customer. Round 3 inbox context panel. */
export async function adminAddInboxNoteAction(
  formData: FormData
): Promise<ActionResult & { data?: { id: string; body: string; authorName: string; createdAt: string } }> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const conversationId = String(formData.get("conversationId") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!conversationId) return { ok: false, error: "INVALID_INPUT" };
  if (!body) return { ok: false, error: "EMPTY_TEXT" };

  const note = await addInboxNote({
    conversationId,
    adminId: session.sub,
    adminName: session.name,
    body,
  });
  if (!note) return { ok: false, error: "EMPTY_TEXT" };
  revalidatePath(`/admin/inbox/${conversationId}`);
  return { ok: true, data: note };
}

export async function adminAddInboxTagAction(
  formData: FormData
): Promise<ActionResult & { data?: { tags: string[] } }> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const conversationId = String(formData.get("conversationId") || "").trim();
  const tag = String(formData.get("tag") || "").trim();
  if (!conversationId || !tag) return { ok: false, error: "INVALID_INPUT" };

  const tags = await addInboxTag({ conversationId, tag });
  revalidatePath(`/admin/inbox/${conversationId}`);
  return { ok: true, data: { tags } };
}

export async function adminRemoveInboxTagAction(
  formData: FormData
): Promise<ActionResult & { data?: { tags: string[] } }> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const conversationId = String(formData.get("conversationId") || "").trim();
  const tag = String(formData.get("tag") || "").trim();
  if (!conversationId || !tag) return { ok: false, error: "INVALID_INPUT" };

  const tags = await removeInboxTag({ conversationId, tag });
  revalidatePath(`/admin/inbox/${conversationId}`);
  return { ok: true, data: { tags } };
}

/** W1 runtime outbound kill — no .env edit, no session touch, no restart. */
export async function adminSetOutboundKillSwitchAction(
  formData: FormData
): Promise<
  ActionResult & {
    data?: {
      outboundEnabled: boolean;
      killSwitch: boolean;
      killSwitchAt: string | null;
      killSwitchBy: string | null;
      killSwitchReason: string | null;
    };
  }
> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const raw = String(formData.get("enabled") || "").trim().toLowerCase();
  const enabled = raw === "1" || raw === "true" || raw === "yes" || raw === "on";
  const reason = String(formData.get("reason") || "").trim().slice(0, 240);
  const { setOutboundKillSwitch } = await import(
    "@/lib/whatsapp/messaging/outbound-kill-switch"
  );
  const result = await setOutboundKillSwitch(enabled, undefined, {
    by: session.email || session.name || session.sub,
    reason: enabled ? reason || null : null,
  });
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/admin/inbox");
  return {
    ok: true,
    data: {
      outboundEnabled: result.outboundEnabled,
      killSwitch: result.killSwitch,
      killSwitchAt: result.killSwitchAt,
      killSwitchBy: result.killSwitchBy,
      killSwitchReason: result.killSwitchReason,
    },
  };
}

/** W1 — configure global outbound enqueue rate (messages / rolling minute). */
export async function adminSetOutboundGlobalRateAction(
  formData: FormData
): Promise<ActionResult & { data?: { perMin: number } }> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const raw = String(formData.get("perMin") || "").trim();
  const perMin = Number.parseInt(raw, 10);
  if (!Number.isFinite(perMin) || perMin < 1 || perMin > 120) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const { setOutboundGlobalRatePerMin } = await import(
    "@/lib/whatsapp/messaging/outbound-kill-switch"
  );
  const result = await setOutboundGlobalRatePerMin(perMin);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/admin/inbox");
  return { ok: true, data: { perMin: result.perMin } };
}

