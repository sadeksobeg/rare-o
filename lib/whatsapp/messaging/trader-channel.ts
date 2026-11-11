/**
 * Trader-portal in-app messaging — platform channel on the SAME
 * WhatsAppConversation as WhatsApp when ownership is unambiguous.
 *
 * Ownership rules (CHAT-F1):
 *  - One conversation per traderId at the app layer (findFirst by traderId).
 *  - If a waChatId/JID for the trader's phone already belongs to a *different*
 *    traderId, NEVER write into that row — isolate on trader-{id}@platform.local
 *    and flag the conflict for admins (tag + audit).
 *  - Unowned phone JID (traderId null) may be claimed by the first matching trader.
 */
import { cache } from "react";
import type { PrismaClient } from "@prisma/client";

import { prisma as defaultPrisma } from "@/lib/db/prisma";
import { normalizeUserJid, toE164Digits } from "@/lib/whatsapp/jid";
import { mediaUrl, parseStorageKey } from "@/lib/whatsapp/media";
import { MAX_OUTBOUND_TEXT_LENGTH } from "@/lib/whatsapp/messaging/constants";
import type { InboxMessageItem } from "@/lib/whatsapp/messaging/inbox";
import {
  publishInboxEvent,
  truncatePreview,
} from "@/lib/whatsapp/messaging/inbox-events";

export type DbClient = PrismaClient;

export const PHONE_CONFLICT_TAG = "phone-conflict";

export type TraderConversationView = {
  conversationId: string;
  messages: InboxMessageItem[];
  updatedAt: string;
  lastMessageId: string | null;
};

function previewOf(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed;
}

function mapMessages(
  messages: Array<{
    id: string;
    direction: string;
    channel: string;
    messageType: string;
    body: string;
    caption: string | null;
    mediaMime: string | null;
    mediaFileName: string | null;
    mediaSize: number | null;
    mediaDurationSec: number | null;
    storageKey: string | null;
    thumbnailKey: string | null;
    isPtt: boolean;
    status: string;
    errorSafe: string | null;
    clientRequestId: string | null;
    waTimestamp: Date | null;
    createdAt: Date;
  }>
): InboxMessageItem[] {
  return messages.map((m) => {
    const parsed = m.storageKey ? parseStorageKey(m.storageKey) : null;
    const thumb = m.thumbnailKey ? parseStorageKey(m.thumbnailKey) : null;
    const isWaMedia =
      m.channel === "whatsapp" &&
      Boolean(m.storageKey) &&
      ["image", "video", "audio", "document", "sticker"].includes(m.messageType);
    return {
      id: m.id,
      direction: m.direction as "inbound" | "outbound",
      channel: m.channel,
      messageType: m.messageType,
      body: m.body,
      caption: m.caption,
      mediaMime: m.mediaMime,
      mediaFileName: m.mediaFileName,
      mediaSize: m.mediaSize ?? null,
      mediaDurationSec: m.mediaDurationSec ?? null,
      // Never hand traders a media URL they cannot fetch (admin-only route).
      mediaUrl:
        !isWaMedia && parsed
          ? mediaUrl(parsed.conversationId, parsed.fileName)
          : null,
      thumbnailUrl:
        !isWaMedia && thumb
          ? mediaUrl(thumb.conversationId, thumb.fileName)
          : null,
      isPtt: m.isPtt === true,
      replyTo: null,
      status: m.status,
      errorSafe: m.errorSafe,
      clientRequestId: m.clientRequestId ?? null,
      waTimestamp: m.waTimestamp ? m.waTimestamp.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
      /** Trader UI: show placeholder instead of broken media */
      whatsappMediaUnavailable: isWaMedia,
    };
  });
}

/** Finds the trader's conversation without creating one — read-only, for the page load. */
export async function getTraderConversation(
  traderId: string,
  db: DbClient = defaultPrisma
): Promise<TraderConversationView | null> {
  const row = await db.whatsAppConversation.findFirst({
    where: { traderId },
    include: {
      messages: {
        where: { hiddenAt: null },
        orderBy: [{ waTimestamp: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      },
    },
  });
  if (!row) return null;

  const messages = mapMessages(row.messages);
  const last = messages[messages.length - 1] ?? null;
  return {
    conversationId: row.id,
    messages,
    updatedAt: row.updatedAt.toISOString(),
    lastMessageId: last?.id ?? null,
  };
}

/** Request-scoped memo — safe to call from multiple server components per render. */
export const getTraderConversationCached = cache(getTraderConversation);

/** Cheap poll payload for /trader/messages live updates. */
export async function getTraderConversationCursor(
  traderId: string,
  db: DbClient = defaultPrisma
): Promise<{
  conversationId: string | null;
  lastMessageId: string | null;
  updatedAt: string | null;
  unreadCount: number;
} | null> {
  const row = await db.whatsAppConversation.findFirst({
    where: { traderId },
    select: {
      id: true,
      updatedAt: true,
      traderUnreadCount: true,
      messages: {
        where: { hiddenAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!row) {
    return {
      conversationId: null,
      lastMessageId: null,
      updatedAt: null,
      unreadCount: 0,
    };
  }
  return {
    conversationId: row.id,
    lastMessageId: row.messages[0]?.id ?? null,
    updatedAt: row.updatedAt.toISOString(),
    unreadCount: row.traderUnreadCount,
  };
}

async function flagPhoneConflict(input: {
  claimedConversationId: string;
  isolatedConversationId: string;
  traderId: string;
  ownerTraderId: string;
  db: DbClient;
}): Promise<void> {
  const claimed = await input.db.whatsAppConversation.findUnique({
    where: { id: input.claimedConversationId },
    select: { tags: true },
  });
  const tags = new Set(claimed?.tags ?? []);
  tags.add(PHONE_CONFLICT_TAG);
  await input.db.whatsAppConversation.update({
    where: { id: input.claimedConversationId },
    data: { tags: [...tags] },
  });
  const isolated = await input.db.whatsAppConversation.findUnique({
    where: { id: input.isolatedConversationId },
    select: { tags: true },
  });
  const isoTags = new Set(isolated?.tags ?? []);
  isoTags.add(PHONE_CONFLICT_TAG);
  await input.db.whatsAppConversation.update({
    where: { id: input.isolatedConversationId },
    data: { tags: [...isoTags] },
  });
  try {
    await input.db.adminAuditLog.create({
      data: {
        adminId: null,
        action: "whatsapp.phone_conflict",
        target: `WhatsAppConversation:${input.claimedConversationId}`,
        metaJson: JSON.stringify({
          isolatedConversationId: input.isolatedConversationId,
          traderId: input.traderId,
          ownerTraderId: input.ownerTraderId,
        }),
        ip: "",
      },
    });
  } catch (e) {
    console.error("phone_conflict_audit_failed", e);
  }
  void publishInboxEvent("conversation.updated", {
    conversationId: input.claimedConversationId,
    preview: "phone-conflict",
  });
}

async function ensureIsolatedPlatformConversation(
  traderId: string,
  displayName: string | null,
  db: DbClient
): Promise<{ id: string }> {
  const waChatId = `trader-${traderId}@platform.local`;
  const existing = await db.whatsAppConversation.findUnique({
    where: { waChatId },
    select: { id: true, traderId: true },
  });
  if (existing) {
    if (!existing.traderId) {
      await db.whatsAppConversation.update({
        where: { id: existing.id },
        data: { traderId },
      });
    }
    return { id: existing.id };
  }
  const created = await db.whatsAppConversation.create({
    data: {
      waChatId,
      remoteJid: waChatId,
      participantE164: null,
      displayName: displayName,
      traderId,
      unreadCount: 0,
      lastMessagePreview: "",
      tags: [],
    },
    select: { id: true },
  });
  return created;
}

/**
 * Resolve (or create) the trader's single conversation.
 * Never returns a conversation owned by a different traderId.
 */
export async function ensureTraderConversation(
  traderId: string,
  db: DbClient = defaultPrisma
): Promise<{ id: string; phoneConflict: boolean }> {
  const existing = await db.whatsAppConversation.findFirst({
    where: { traderId },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return { id: existing.id, phoneConflict: false };

  const trader = await db.traderAccount.findUnique({
    where: { id: traderId },
    select: { phone: true, displayName: true },
  });
  if (!trader) throw new Error("TRADER_NOT_FOUND");

  // Empty / whitespace phone must never claim a WhatsApp JID or conflict badge.
  const phone = trader.phone?.trim() || null;
  const jid = phone ? normalizeUserJid(phone) : null;
  const e164 = phone ? toE164Digits(phone) : null;

  if (jid) {
    const byChatId = await db.whatsAppConversation.findUnique({
      where: { waChatId: jid },
      select: { id: true, traderId: true },
    });
    if (byChatId) {
      if (!byChatId.traderId) {
        await db.whatsAppConversation.update({
          where: { id: byChatId.id },
          data: {
            traderId,
            participantE164: e164,
            displayName: trader.displayName,
          },
        });
        return { id: byChatId.id, phoneConflict: false };
      }
      if (byChatId.traderId === traderId) {
        return { id: byChatId.id, phoneConflict: false };
      }
      // Owned by someone else — isolate; never write into their thread.
      const isolated = await ensureIsolatedPlatformConversation(
        traderId,
        trader.displayName,
        db
      );
      await flagPhoneConflict({
        claimedConversationId: byChatId.id,
        isolatedConversationId: isolated.id,
        traderId,
        ownerTraderId: byChatId.traderId,
        db,
      });
      return { id: isolated.id, phoneConflict: true };
    }

    const created = await db.whatsAppConversation.create({
      data: {
        waChatId: jid,
        remoteJid: jid,
        participantE164: e164,
        displayName: trader.displayName,
        traderId,
        unreadCount: 0,
        lastMessagePreview: "",
      },
      select: { id: true },
    });
    return { id: created.id, phoneConflict: false };
  }

  const isolated = await ensureIsolatedPlatformConversation(
    traderId,
    trader.displayName,
    db
  );
  return { id: isolated.id, phoneConflict: false };
}

export type SendTraderMessageResult =
  | { ok: true; messageId: string; conversationId: string; phoneConflict?: boolean }
  | {
      ok: false;
      error:
        | "EMPTY_TEXT"
        | "TEXT_TOO_LONG"
        | "TRADER_NOT_FOUND"
        | "RATE_LIMITED";
    };

/** Trader → admin, in-app. Always succeeds at the storage layer (no transport to fail). */
export async function sendTraderPlatformMessage(
  input: { traderId: string; text: string },
  db: DbClient = defaultPrisma
): Promise<SendTraderMessageResult> {
  const text = input.text.trim();
  if (!text) return { ok: false, error: "EMPTY_TEXT" };
  if (text.length > MAX_OUTBOUND_TEXT_LENGTH) {
    return { ok: false, error: "TEXT_TOO_LONG" };
  }

  let conversation: { id: string; phoneConflict: boolean };
  try {
    conversation = await ensureTraderConversation(input.traderId, db);
  } catch {
    return { ok: false, error: "TRADER_NOT_FOUND" };
  }

  const now = new Date();
  const result = await db.$transaction(async (tx) => {
    const message = await tx.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "inbound",
        channel: "platform",
        messageType: "text",
        body: text,
        status: "received",
        waTimestamp: now,
      },
    });
    const updated = await tx.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: now,
        lastMessagePreview: previewOf(text),
        unreadCount: { increment: 1 },
      },
      select: { unreadCount: true },
    });
    return { message, unreadCount: updated.unreadCount };
  });

  void publishInboxEvent("message.new", {
    conversationId: conversation.id,
    messageId: result.message.id,
    status: "received",
    direction: "inbound",
    messageType: "text",
    preview: truncatePreview(text),
    unreadCount: result.unreadCount,
  });
  void publishInboxEvent("conversation.updated", {
    conversationId: conversation.id,
    preview: truncatePreview(text),
    unreadCount: result.unreadCount,
  });

  return {
    ok: true,
    messageId: result.message.id,
    conversationId: conversation.id,
    phoneConflict: conversation.phoneConflict,
  };
}

export type SendAdminPlatformMessageResult =
  | { ok: true; messageId: string; conversationId: string }
  | { ok: false; error: "EMPTY_TEXT" | "TEXT_TOO_LONG" | "NOT_FOUND" };

/**
 * Admin → trader, in-app — mirror of sendTraderPlatformMessage / WA fallback.
 */
export async function sendAdminPlatformMessage(
  input: {
    conversationId: string;
    adminId: string;
    text: string;
    clientRequestId?: string | null;
  },
  db: DbClient = defaultPrisma
): Promise<SendAdminPlatformMessageResult> {
  const text = input.text.trim();
  if (!text) return { ok: false, error: "EMPTY_TEXT" };
  if (text.length > MAX_OUTBOUND_TEXT_LENGTH) {
    return { ok: false, error: "TEXT_TOO_LONG" };
  }

  const clientRequestId = input.clientRequestId?.trim() || null;
  if (clientRequestId) {
    const existing = await db.whatsAppMessage.findUnique({
      where: { clientRequestId },
      select: { id: true, conversationId: true },
    });
    if (existing) {
      return {
        ok: true,
        messageId: existing.id,
        conversationId: existing.conversationId,
      };
    }
  }

  const conversation = await db.whatsAppConversation.findUnique({
    where: { id: input.conversationId },
    select: { id: true },
  });
  if (!conversation) return { ok: false, error: "NOT_FOUND" };

  const now = new Date();
  const result = await db.$transaction(async (tx) => {
    const message = await tx.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "outbound",
        channel: "platform",
        messageType: "text",
        body: text,
        status: "sent",
        waTimestamp: now,
        adminId: input.adminId,
        ...(clientRequestId ? { clientRequestId } : {}),
      },
    });
    await tx.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: now,
        lastMessagePreview: previewOf(text),
        traderUnreadCount: { increment: 1 },
      },
    });
    return message;
  });

  void publishInboxEvent("message.new", {
    conversationId: conversation.id,
    messageId: result.id,
    status: "sent",
    direction: "outbound",
    messageType: "text",
    preview: truncatePreview(text),
  });
  void publishInboxEvent("conversation.updated", {
    conversationId: conversation.id,
    preview: truncatePreview(text),
  });

  return { ok: true, messageId: result.id, conversationId: conversation.id };
}

/**
 * Clears trader unread badge and marks platform outbound messages as read.
 */
export async function markTraderMessagesRead(
  traderId: string,
  db: DbClient = defaultPrisma
): Promise<void> {
  const conv = await db.whatsAppConversation.findFirst({
    where: { traderId },
    select: { id: true },
  });
  if (!conv) return;

  await db.$transaction([
    db.whatsAppConversation.updateMany({
      where: { id: conv.id, traderUnreadCount: { gt: 0 } },
      data: { traderUnreadCount: 0 },
    }),
    db.whatsAppMessage.updateMany({
      where: {
        conversationId: conv.id,
        direction: "outbound",
        channel: "platform",
        status: { in: ["sent", "delivered"] },
      },
      data: { status: "read" },
    }),
  ]);
}

/** Trader-nav badge count — 0 if the trader has no conversation yet. */
export async function getTraderUnreadCount(
  traderId: string,
  db: DbClient = defaultPrisma
): Promise<number> {
  const row = await db.whatsAppConversation.findFirst({
    where: { traderId },
    select: { traderUnreadCount: true },
  });
  return row?.traderUnreadCount ?? 0;
}
