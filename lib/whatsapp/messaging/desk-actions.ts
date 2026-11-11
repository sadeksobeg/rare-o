/**
 * WA-W2 desk actions — archive / mute / block / unread / hide / phone reveal.
 * Additive fields only; never touches WhatsApp revoke APIs.
 */

import { prisma as defaultPrisma } from "@/lib/db/prisma";
import { publishInboxEvent } from "@/lib/whatsapp/messaging/inbox-events";

type Db = typeof defaultPrisma;

export async function markConversationUnread(
  conversationId: string,
  db: Db = defaultPrisma
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await db.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, unreadCount: true },
  });
  if (!row) return { ok: false, error: "NOT_FOUND" };
  const next = Math.max(1, row.unreadCount);
  await db.whatsAppConversation.update({
    where: { id: conversationId },
    data: { unreadCount: next },
  });
  void publishInboxEvent("conversation.updated", {
    conversationId,
    unreadCount: next,
  });
  return { ok: true };
}

export async function setConversationArchived(
  conversationId: string,
  archived: boolean,
  db: Db = defaultPrisma
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await db.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true },
  });
  if (!row) return { ok: false, error: "NOT_FOUND" };
  await db.whatsAppConversation.update({
    where: { id: conversationId },
    data: { archivedAt: archived ? new Date() : null },
  });
  void publishInboxEvent("conversation.updated", { conversationId });
  return { ok: true };
}

export async function setConversationMuted(
  conversationId: string,
  mutedUntil: Date | null,
  db: Db = defaultPrisma
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await db.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true },
  });
  if (!row) return { ok: false, error: "NOT_FOUND" };
  await db.whatsAppConversation.update({
    where: { id: conversationId },
    data: { mutedUntil },
  });
  void publishInboxEvent("conversation.updated", { conversationId });
  return { ok: true };
}

export async function setConversationBlocked(
  conversationId: string,
  blocked: boolean,
  adminId: string,
  db: Db = defaultPrisma
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await db.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true },
  });
  if (!row) return { ok: false, error: "NOT_FOUND" };
  await db.whatsAppConversation.update({
    where: { id: conversationId },
    data: blocked
      ? { blockedAt: new Date(), blockedByAdminId: adminId }
      : { blockedAt: null, blockedByAdminId: null },
  });
  void publishInboxEvent("conversation.updated", { conversationId });
  return { ok: true };
}

export async function hideMessageForMe(
  messageId: string,
  db: Db = defaultPrisma
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await db.whatsAppMessage.findUnique({
    where: { id: messageId },
    select: { id: true, conversationId: true },
  });
  if (!row) return { ok: false, error: "NOT_FOUND" };
  await db.whatsAppMessage.update({
    where: { id: messageId },
    data: { hiddenAt: new Date() },
  });
  void publishInboxEvent("message.status", {
    conversationId: row.conversationId,
    messageId,
    status: "hidden",
  });
  return { ok: true };
}

export async function revealConversationPhone(
  conversationId: string,
  adminId: string,
  db: Db = defaultPrisma
): Promise<
  | { ok: true; phone: string | null }
  | { ok: false; error: string }
> {
  const row = await db.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, participantE164: true },
  });
  if (!row) return { ok: false, error: "NOT_FOUND" };
  await db.whatsAppPhoneRevealAudit.create({
    data: { conversationId, adminId },
  });
  return { ok: true, phone: row.participantE164 };
}

export async function isConversationBlocked(
  conversationId: string,
  db: Db = defaultPrisma
): Promise<boolean> {
  const row = await db.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { blockedAt: true },
  });
  return Boolean(row?.blockedAt);
}

/** Server-side outbound gate — blocked / archived / actively muted. */
export function deskOutboundBlockedReason(row: {
  blockedAt: Date | null;
  archivedAt: Date | null;
  mutedUntil: Date | null;
} | null): "blocked" | "archived" | "muted" | null {
  if (!row) return null;
  if (row.blockedAt) return "blocked";
  if (row.archivedAt) return "archived";
  if (row.mutedUntil && row.mutedUntil.getTime() > Date.now()) return "muted";
  return null;
}

export async function assertDeskAllowsOutbound(
  waChatId: string,
  db: Db = defaultPrisma
): Promise<{ ok: true } | { ok: false; reason: "blocked" | "archived" | "muted" }> {
  const row = await db.whatsAppConversation.findUnique({
    where: { waChatId },
    select: { blockedAt: true, archivedAt: true, mutedUntil: true },
  });
  const reason = deskOutboundBlockedReason(row);
  if (reason) return { ok: false, reason };
  return { ok: true };
}
