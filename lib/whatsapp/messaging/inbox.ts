/**
 * Admin inbox read models — safe DTOs only.
 * Never include session files, QR, Baileys socket, or credentials.
 */

import type { PrismaClient } from "@prisma/client";

import { prisma as defaultPrisma } from "@/lib/db/prisma";
import { WHATSAPP_CONNECTION_HEALTH_ID } from "@/lib/whatsapp/messaging/constants";
import {
  isWhatsAppActiveLinkType,
  type WhatsAppActiveLinkType,
  type WhatsAppLinkType,
} from "@/lib/whatsapp/messaging/link-constants";
import { isOutboundEnabled } from "@/lib/whatsapp/types";

export type DbClient = PrismaClient;

export type InboxLinkSummary = {
  linked: boolean;
  linkType: WhatsAppLinkType;
  linkId: string | null;
};

export type InboxConversationListItem = {
  id: string;
  /** Privacy-conscious display label (E.164 or masked chat id) */
  displayLabel: string;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  unreadCount: number;
  hasUnread: boolean;
  /** Lightweight link hint only — no business context payload */
  link: InboxLinkSummary;
};

export type InboxMessageItem = {
  id: string;
  direction: "inbound" | "outbound";
  messageType: "text" | "unsupported";
  body: string;
  status: string;
  errorSafe: string | null;
  waTimestamp: string | null;
  createdAt: string;
};

export type InboxConversationDetail = {
  id: string;
  displayLabel: string;
  waChatId: string;
  unreadCount: number;
  link: InboxLinkSummary;
  messages: InboxMessageItem[];
};

export type InboxHealthView = {
  state: string;
  detailSafe: string | null;
  lastConnectedAt: string | null;
  updatedAt: string | null;
  outboundEnabled: boolean;
};

/**
 * Build a privacy-conscious label from persisted identity fields only.
 * Does not invent customer names from business domains.
 */
export function formatConversationDisplayLabel(input: {
  participantE164: string | null;
  displayName: string | null;
  waChatId: string;
}): string {
  const e164 = input.participantE164?.trim();
  if (e164) {
    const name = input.displayName?.trim();
    return name ? `${name} · +${e164}` : `+${e164}`;
  }
  const name = input.displayName?.trim();
  const user = input.waChatId.split("@")[0] ?? input.waChatId;
  const masked =
    user.length <= 4 ? user : `${user.slice(0, 2)}…${user.slice(-4)}`;
  return name ? `${name} · ${masked}` : masked;
}

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toLinkSummary(row: {
  linkType: string;
  linkId: string | null;
}): InboxLinkSummary {
  if (row.linkId && isWhatsAppActiveLinkType(row.linkType)) {
    return {
      linked: true,
      linkType: row.linkType as WhatsAppActiveLinkType,
      linkId: row.linkId,
    };
  }
  return { linked: false, linkType: "none", linkId: null };
}

export async function listInboxConversations(
  db: DbClient = defaultPrisma,
  take = 100
): Promise<InboxConversationListItem[]> {
  const rows = await db.whatsAppConversation.findMany({
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    take,
    select: {
      id: true,
      waChatId: true,
      participantE164: true,
      displayName: true,
      lastMessagePreview: true,
      lastMessageAt: true,
      unreadCount: true,
      linkType: true,
      linkId: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    displayLabel: formatConversationDisplayLabel({
      participantE164: r.participantE164,
      displayName: r.displayName,
      waChatId: r.waChatId,
    }),
    lastMessagePreview: r.lastMessagePreview,
    lastMessageAt: toIso(r.lastMessageAt),
    unreadCount: r.unreadCount,
    hasUnread: r.unreadCount > 0,
    link: toLinkSummary(r),
  }));
}

export async function getInboxConversation(
  conversationId: string,
  db: DbClient = defaultPrisma
): Promise<InboxConversationDetail | null> {
  const id = conversationId.trim();
  if (!id) return null;

  const row = await db.whatsAppConversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: [
          { waTimestamp: "asc" },
          { createdAt: "asc" },
          { id: "asc" },
        ],
      },
    },
  });  if (!row) return null;

  return {
    id: row.id,
    displayLabel: formatConversationDisplayLabel({
      participantE164: row.participantE164,
      displayName: row.displayName,
      waChatId: row.waChatId,
    }),
    waChatId: row.waChatId,
    unreadCount: row.unreadCount,
    link: toLinkSummary(row),
    messages: row.messages.map((m) => ({
      id: m.id,
      direction: m.direction as "inbound" | "outbound",
      messageType: m.messageType as "text" | "unsupported",
      body: m.body,
      status: m.status,
      errorSafe: m.errorSafe,
      waTimestamp: toIso(m.waTimestamp),
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function markConversationRead(
  conversationId: string,
  db: DbClient = defaultPrisma
): Promise<boolean> {
  const id = conversationId.trim();
  if (!id) return false;
  const existing = await db.whatsAppConversation.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return false;
  await db.whatsAppConversation.update({
    where: { id },
    data: { unreadCount: 0 },
  });
  return true;
}

/**
 * Safe connection health for admin UI. Never returns QR/session material.
 */
export async function getInboxHealthView(
  db: DbClient = defaultPrisma
): Promise<InboxHealthView> {
  const row = await db.whatsAppConnectionHealth.findUnique({
    where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
  });

  return {
    state: row?.state ?? "DISCONNECTED",
    detailSafe: row?.detailSafe ?? null,
    lastConnectedAt: toIso(row?.lastConnectedAt ?? null),
    updatedAt: toIso(row?.updatedAt ?? null),
    outboundEnabled: isOutboundEnabled(),
  };
}
