"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

import type { ActionResult } from "@/app/actions";
import { requireAdminSession } from "@/lib/auth/admin-session";
import {
  getInboxConversation,
  getInboxHealthView,
  listInboxConversations,
  markConversationRead,
} from "@/lib/whatsapp/messaging/inbox";
import { enqueueOutboundText } from "@/lib/whatsapp/messaging/service";
import { MAX_OUTBOUND_TEXT_LENGTH } from "@/lib/whatsapp/messaging/constants";
import {
  clearConversationBusinessLink,
  getBusinessContextForConversation,
  linkConversationToBusinessRecord,
} from "@/lib/whatsapp/messaging/linking";
import { prisma } from "@/lib/db/prisma";

/**
 * Admin WhatsApp actions — authorize every call server-side.
 * Never imports Baileys adapter. Outbound only enqueues pending rows.
 */

export async function adminListInboxConversationsAction(): Promise<
  ActionResult & { data?: Awaited<ReturnType<typeof listInboxConversations>> }
> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
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
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
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
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
  }
  const data = await getInboxHealthView();
  return { ok: true, data };
}

export async function adminMarkInboxConversationReadAction(
  conversationId: string
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
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
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
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
  });

  if (!result.ok) {
    if (result.code === "OUTBOUND_DISABLED") {
      return { ok: false, error: "OUTBOUND_DISABLED" };
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
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
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
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
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
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
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
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
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
    data: { status: "pending", errorSafe: null },
  });

  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/inbox/${row.conversationId}`);
  return { ok: true, data: { messageId: row.id, status: "pending" } };
}

export type LinkableRecordHit = {
  id: string;
  reference: string;
  label: string;
  linkType: "retail_request" | "deal_proposal" | "wholesale_request";
};

/** Search domain records for A17 RecordPicker (reference / title). */
export async function adminSearchLinkableRecordsAction(
  formData: FormData
): Promise<ActionResult & { data?: LinkableRecordHit[] }> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
  }

  const linkType = String(formData.get("linkType") || "").trim();
  const q = String(formData.get("q") || "").trim().slice(0, 80);

  if (
    linkType !== "retail_request" &&
    linkType !== "deal_proposal" &&
    linkType !== "wholesale_request"
  ) {
    return { ok: false, error: "UNSUPPORTED_LINK_TYPE" };
  }

  const take = 20;
  if (linkType === "retail_request") {
    const rows = await prisma.retailRequest.findMany({
      where: q
        ? {
            OR: [
              { reference: { contains: q } },
              { customerName: { contains: q } },
              { customerPhone: { contains: q } },
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
              { reference: { contains: q } },
              { title: { contains: q } },
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

  const rows = await prisma.wholesaleRequest.findMany({
    where: q ? { reference: { contains: q } } : undefined,
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
