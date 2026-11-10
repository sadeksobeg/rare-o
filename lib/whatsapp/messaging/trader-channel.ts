/**
 * Trader-portal in-app messaging — the "keep talking even if WhatsApp is
 * banned/down" channel. Writes into the SAME WhatsAppConversation a trader
 * would otherwise have over real WhatsApp, so the two histories stay one
 * unified thread regardless of which channel any given message came in on:
 *
 *  - If the conversation already exists (admin manually linked it, or the
 *    trader has messaged in over real WhatsApp before), reuse it as-is.
 *  - Otherwise, derive the conversation's waChatId from the trader's own
 *    phone number (normalizeUserJid) — the exact same JID a real inbound
 *    WhatsApp message from that number would resolve to. If that phone
 *    number messages in for real later, Baileys' own upsert-by-waChatId
 *    naturally merges into this same row instead of creating a duplicate.
 *  - A trader with no phone on file gets a synthetic, non-JID-colliding
 *    conversation id (`trader-{id}@platform.local`) so platform messaging
 *    still works; it just won't auto-unify with a future WhatsApp number
 *    until an admin links it manually or the trader adds a phone.
 */
import { cache } from "react";
import type { PrismaClient } from "@prisma/client";

import { prisma as defaultPrisma } from "@/lib/db/prisma";
import { normalizeUserJid, toE164Digits } from "@/lib/whatsapp/jid";
import { mediaUrl, parseStorageKey } from "@/lib/whatsapp/media";
import { MAX_OUTBOUND_TEXT_LENGTH } from "@/lib/whatsapp/messaging/constants";
import type { InboxMessageItem } from "@/lib/whatsapp/messaging/inbox";

export type DbClient = PrismaClient;

export type TraderConversationView = {
  conversationId: string;
  messages: InboxMessageItem[];
};

function previewOf(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed;
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
        orderBy: [{ waTimestamp: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      },
    },
  });
  if (!row) return null;

  return {
    conversationId: row.id,
    messages: row.messages.map((m) => {
      const parsed = m.storageKey ? parseStorageKey(m.storageKey) : null;
      return {
        id: m.id,
        direction: m.direction as "inbound" | "outbound",
        channel: m.channel,
        messageType: m.messageType,
        body: m.body,
        caption: m.caption,
        mediaMime: m.mediaMime,
        mediaFileName: m.mediaFileName,
        mediaUrl: parsed ? mediaUrl(parsed.conversationId, parsed.fileName) : null,
        status: m.status,
        errorSafe: m.errorSafe,
        waTimestamp: m.waTimestamp ? m.waTimestamp.toISOString() : null,
        createdAt: m.createdAt.toISOString(),
      };
    }),
  };
}

/** Request-scoped memo — safe to call from multiple server components per render. */
export const getTraderConversationCached = cache(getTraderConversation);

async function ensureTraderConversation(
  traderId: string,
  db: DbClient
): Promise<{ id: string }> {
  const existing = await db.whatsAppConversation.findFirst({
    where: { traderId },
    select: { id: true },
  });
  if (existing) return existing;

  const trader = await db.traderAccount.findUnique({
    where: { id: traderId },
    select: { phone: true, displayName: true },
  });
  if (!trader) throw new Error("TRADER_NOT_FOUND");

  const jid = trader.phone ? normalizeUserJid(trader.phone) : null;
  const waChatId = jid ?? `trader-${traderId}@platform.local`;

  // A real WhatsApp conversation may already exist under this phone number
  // (inbound message arrived before the trader ever opened this page) —
  // reuse and link it rather than creating a duplicate.
  const byChatId = await db.whatsAppConversation.findUnique({
    where: { waChatId },
    select: { id: true, traderId: true },
  });
  if (byChatId) {
    if (!byChatId.traderId) {
      await db.whatsAppConversation.update({
        where: { id: byChatId.id },
        data: { traderId },
      });
    }
    return byChatId;
  }

  const created = await db.whatsAppConversation.create({
    data: {
      waChatId,
      remoteJid: waChatId,
      participantE164: jid ? toE164Digits(trader.phone) : null,
      displayName: trader.displayName,
      traderId,
      unreadCount: 0,
      lastMessagePreview: "",
    },
    select: { id: true },
  });
  return created;
}

export type SendTraderMessageResult =
  | { ok: true; messageId: string }
  | { ok: false; error: "EMPTY_TEXT" | "TEXT_TOO_LONG" | "TRADER_NOT_FOUND" };

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

  let conversation: { id: string };
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
    await tx.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: now,
        lastMessagePreview: previewOf(text),
        unreadCount: { increment: 1 },
      },
    });
    return message;
  });

  return { ok: true, messageId: result.id };
}

export type SendAdminPlatformMessageResult =
  | { ok: true; messageId: string; conversationId: string }
  | { ok: false; error: "EMPTY_TEXT" | "TEXT_TOO_LONG" | "NOT_FOUND" };

/**
 * Admin → trader, in-app — the mirror of sendTraderPlatformMessage. Used as
 * the automatic fallback when real WhatsApp outbound is unavailable
 * (WHATSAPP_OUTBOUND_ENABLED=false or the adapter isn't connected), so the
 * admin can still reply instead of hitting a dead end. Writes into the same
 * conversation the admin was already looking at — never creates a second
 * thread — and bumps traderUnreadCount so the trader portal can surface it.
 */
export async function sendAdminPlatformMessage(
  input: { conversationId: string; adminId: string; text: string },
  db: DbClient = defaultPrisma
): Promise<SendAdminPlatformMessageResult> {
  const text = input.text.trim();
  if (!text) return { ok: false, error: "EMPTY_TEXT" };
  if (text.length > MAX_OUTBOUND_TEXT_LENGTH) {
    return { ok: false, error: "TEXT_TOO_LONG" };
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

  return { ok: true, messageId: result.id, conversationId: conversation.id };
}

/** Clears the trader-facing unread counter — called when the trader opens the thread. */
export async function markTraderMessagesRead(
  traderId: string,
  db: DbClient = defaultPrisma
): Promise<void> {
  await db.whatsAppConversation.updateMany({
    where: { traderId, traderUnreadCount: { gt: 0 } },
    data: { traderUnreadCount: 0 },
  });
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
