/**
 * WhatsApp messaging application service.
 *
 * Owns Conversation / Message / ConnectionHealth persistence.
 * Does not import Baileys. Transport is injected via WhatsAppAdapter.
 *
 * Business linking (Retail / Deal / Wholesale) is Phase D — not here.
 */

import type { PrismaClient } from "@prisma/client";

import { prisma as defaultPrisma } from "@/lib/db/prisma";
import { normalizeUserJid } from "@/lib/whatsapp/jid";
import { readWhatsAppMediaByKey, saveWhatsAppMediaBytes } from "@/lib/whatsapp/media";
import {
  isWhatsAppMediaMessageType,
  MAX_MESSAGE_PREVIEW_LENGTH,
  MAX_OUTBOUND_TEXT_LENGTH,
  WHATSAPP_CONNECTION_HEALTH_ID,
  type WhatsAppMediaMessageType,
} from "@/lib/whatsapp/messaging/constants";
import {
  MAX_OUTBOUND_ATTEMPTS,
  STALE_SENDING_MS,
} from "@/lib/whatsapp/messaging/reliability";
import {
  acquireOutboundSendSlot,
  assessOutboundEnqueue,
  recordOutboundSendFailure,
  recordOutboundSendSuccess,
} from "@/lib/whatsapp/outbound-safety";
import {
  isE164LikelyLidMirror,
  isLidJid,
} from "@/lib/whatsapp/jid";
import {
  isOutboundEnabled,
  type WhatsAppAdapter,
  type WhatsAppChatSeedEvent,
  type WhatsAppContactIdentityEvent,
  type WhatsAppHealth,
  type WhatsAppInboundMediaEvent,
  type WhatsAppInboundTextEvent,
  type WhatsAppOutboundEchoEvent,
} from "@/lib/whatsapp/types";

export type DbClient = PrismaClient;

export type PersistInboundTextResult =
  | {
      ok: true;
      created: boolean;
      conversationId: string;
      messageId: string;
    }
  | {
      ok: false;
      reason: "INVALID_INPUT" | "PERSIST_FAILED";
      error: string;
    };

export type PersistUnsupportedInboundInput = {
  waMessageId: string;
  waChatId: string;
  waRemoteJid: string;
  senderE164: string | null;
  displayName: string | null;
  timestamp: string;
  /** Safe label only — e.g. "image" — never raw media */
  kindHint?: string;
};

export type EnqueueOutboundTextInput = {
  waChatId: string;
  text: string;
  clientRequestId: string;
  adminId: string;
};

export type EnqueueOutboundMediaInput = {
  waChatId: string;
  clientRequestId: string;
  adminId: string;
  messageType: Exclude<WhatsAppMediaMessageType, "sticker">;
  bytes: Buffer;
  mime: string;
  fileName?: string | null;
  caption?: string | null;
};

export type EnqueueOutboundTextResult =
  | {
      ok: true;
      conversationId: string;
      messageId: string;
      status: "pending" | "sending" | "sent" | "failed";
      /** True when an existing row with this clientRequestId was returned */
      duplicate: boolean;
    }
  | {
      ok: false;
      code:
        | "OUTBOUND_DISABLED"
        | "INVALID_INPUT"
        | "PERSIST_FAILED"
        | "RATE_LIMITED"
        | "SAFETY_CIRCUIT"
        | "RECONNECT_COOLDOWN";
      error: string;
    };

export type DispatchOutboundResult =
  | {
      ok: true;
      messageId: string;
      waMessageId: string;
      status: "sent";
    }
  | {
      ok: false;
      messageId: string;
      status: "failed" | "pending" | "sending" | "sent";
      code:
        | "OUTBOUND_DISABLED"
        | "NOT_CONNECTED"
        | "INVALID_INPUT"
        | "SEND_FAILED"
        | "NOT_FOUND"
        | "ALREADY_FINAL"
        | "DUPLICATE"
        | "MAX_ATTEMPTS"
        | "CLAIM_FAILED"
        | "RATE_LIMITED"
        | "SAFETY_CIRCUIT"
        | "RECONNECT_COOLDOWN";
      error: string;
    };

export type RecoverInterruptedResult = {
  recoveredToPending: number;
  markedFailed: number;
  markedSent: number;
};

function previewOf(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_MESSAGE_PREVIEW_LENGTH) return t;
  return `${t.slice(0, MAX_MESSAGE_PREVIEW_LENGTH - 1)}…`;
}

function parseWaTimestamp(iso: string | undefined): Date {
  if (!iso) return new Date();
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

/**
 * Upsert conversation by waChatId and persist an inbound text message.
 * Idempotent on waMessageId (DB unique).
 */
export async function persistInboundText(
  event: WhatsAppInboundTextEvent,
  db: DbClient = defaultPrisma
): Promise<PersistInboundTextResult> {
  const waMessageId = event.waMessageId?.trim();
  const waChatId = event.waChatId?.trim() || event.waRemoteJid?.trim();
  const text = event.text?.trim() ?? "";

  if (!waMessageId || !waChatId) {
    return {
      ok: false,
      reason: "INVALID_INPUT",
      error: "waMessageId and waChatId are required",
    };
  }
  if (!text) {
    return {
      ok: false,
      reason: "INVALID_INPUT",
      error: "Empty text is not persisted as inbound text",
    };
  }

  const existing = await db.whatsAppMessage.findUnique({
    where: { waMessageId },
    select: { id: true, conversationId: true },
  });
  if (existing) {
    return {
      ok: true,
      created: false,
      conversationId: existing.conversationId,
      messageId: existing.id,
    };
  }

  const waTimestamp = parseWaTimestamp(event.timestamp);
  const remoteJid = event.waRemoteJid?.trim() || waChatId;

  try {
    const result = await db.$transaction(async (tx) => {
      const conversation = await tx.whatsAppConversation.upsert({
        where: { waChatId },
        create: {
          waChatId,
          remoteJid,
          participantE164: event.senderE164,
          displayName: event.displayName,
          lastMessageAt: waTimestamp,
          lastMessagePreview: previewOf(text),
          unreadCount: 1,
        },
        update: {
          remoteJid,
          ...(event.senderE164 ? { participantE164: event.senderE164 } : {}),
          ...(event.displayName ? { displayName: event.displayName } : {}),
          lastMessageAt: waTimestamp,
          lastMessagePreview: previewOf(text),
          unreadCount: { increment: 1 },
        },
      });

      try {
        const message = await tx.whatsAppMessage.create({
          data: {
            conversationId: conversation.id,
            direction: "inbound",
            messageType: "text",
            body: text,
            waMessageId,
            status: "received",
            waTimestamp,
          },
        });
        return { conversationId: conversation.id, messageId: message.id, created: true };
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        const again = await tx.whatsAppMessage.findUnique({
          where: { waMessageId },
          select: { id: true, conversationId: true },
        });
        if (!again) throw err;
        return {
          conversationId: again.conversationId,
          messageId: again.id,
          created: false,
        };
      }
    });

    return {
      ok: true,
      created: result.created,
      conversationId: result.conversationId,
      messageId: result.messageId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persist failed";
    return { ok: false, reason: "PERSIST_FAILED", error: message.slice(0, 200) };
  }
}

/**
 * Persist unsupported inbound (non-text) without crashing the worker.
 * Idempotent on waMessageId. Does not invent business data.
 */
export async function persistUnsupportedInbound(
  input: PersistUnsupportedInboundInput,
  db: DbClient = defaultPrisma
): Promise<PersistInboundTextResult> {
  const waMessageId = input.waMessageId?.trim();
  const waChatId = input.waChatId?.trim() || input.waRemoteJid?.trim();
  if (!waMessageId || !waChatId) {
    return {
      ok: false,
      reason: "INVALID_INPUT",
      error: "waMessageId and waChatId are required",
    };
  }

  const existing = await db.whatsAppMessage.findUnique({
    where: { waMessageId },
    select: { id: true, conversationId: true },
  });
  if (existing) {
    return {
      ok: true,
      created: false,
      conversationId: existing.conversationId,
      messageId: existing.id,
    };
  }

  const waTimestamp = parseWaTimestamp(input.timestamp);
  const remoteJid = input.waRemoteJid?.trim() || waChatId;
  const body = input.kindHint
    ? `[unsupported:${input.kindHint}]`
    : "[unsupported]";

  try {
    const result = await db.$transaction(async (tx) => {
      const conversation = await tx.whatsAppConversation.upsert({
        where: { waChatId },
        create: {
          waChatId,
          remoteJid,
          participantE164: input.senderE164,
          displayName: input.displayName,
          lastMessageAt: waTimestamp,
          lastMessagePreview: body,
          unreadCount: 1,
        },
        update: {
          remoteJid,
          ...(input.senderE164 ? { participantE164: input.senderE164 } : {}),
          ...(input.displayName ? { displayName: input.displayName } : {}),
          lastMessageAt: waTimestamp,
          lastMessagePreview: body,
          unreadCount: { increment: 1 },
        },
      });

      try {
        const message = await tx.whatsAppMessage.create({
          data: {
            conversationId: conversation.id,
            direction: "inbound",
            messageType: "unsupported",
            body,
            waMessageId,
            status: "received",
            waTimestamp,
          },
        });
        return { conversationId: conversation.id, messageId: message.id, created: true };
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        const again = await tx.whatsAppMessage.findUnique({
          where: { waMessageId },
          select: { id: true, conversationId: true },
        });
        if (!again) throw err;
        return {
          conversationId: again.conversationId,
          messageId: again.id,
          created: false,
        };
      }
    });

    return {
      ok: true,
      created: result.created,
      conversationId: result.conversationId,
      messageId: result.messageId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persist failed";
    return { ok: false, reason: "PERSIST_FAILED", error: message.slice(0, 200) };
  }
}

function mediaPreview(
  messageType: string,
  caption: string | null | undefined,
  fileName: string | null | undefined
): string {
  const cap = caption?.trim();
  if (cap) return previewOf(cap);
  if (fileName?.trim()) return previewOf(`[${messageType}] ${fileName.trim()}`);
  return `[${messageType}]`;
}

/**
 * Persist inbound media / location / contact. Bytes already downloaded in worker.
 */
export async function persistInboundMedia(
  event: WhatsAppInboundMediaEvent,
  db: DbClient = defaultPrisma
): Promise<PersistInboundTextResult> {
  const waMessageId = event.waMessageId?.trim();
  const waChatId = event.waChatId?.trim() || event.waRemoteJid?.trim();
  if (!waMessageId || !waChatId) {
    return {
      ok: false,
      reason: "INVALID_INPUT",
      error: "waMessageId and waChatId are required",
    };
  }

  const existing = await db.whatsAppMessage.findUnique({
    where: { waMessageId },
    select: { id: true, conversationId: true },
  });
  if (existing) {
    return {
      ok: true,
      created: false,
      conversationId: existing.conversationId,
      messageId: existing.id,
    };
  }

  const waTimestamp = parseWaTimestamp(event.timestamp);
  const remoteJid = event.waRemoteJid?.trim() || waChatId;
  const messageType = event.messageType;
  const caption = event.caption?.trim() || null;
  const preview = mediaPreview(messageType, caption, event.fileName);

  try {
    const result = await db.$transaction(async (tx) => {
      const conversation = await tx.whatsAppConversation.upsert({
        where: { waChatId },
        create: {
          waChatId,
          remoteJid,
          participantE164: event.senderE164,
          displayName: event.displayName,
          lastMessageAt: waTimestamp,
          lastMessagePreview: preview,
          unreadCount: 1,
        },
        update: {
          remoteJid,
          ...(event.senderE164 ? { participantE164: event.senderE164 } : {}),
          ...(event.displayName ? { displayName: event.displayName } : {}),
          lastMessageAt: waTimestamp,
          lastMessagePreview: preview,
          unreadCount: { increment: 1 },
        },
      });

      let storageKey: string | null = null;
      let mediaMime: string | null = event.mime;
      let mediaSize: number | null = null;
      let mediaSha256: string | null = null;
      let mediaFileName: string | null = event.fileName;
      let body = caption ?? "";

      if (
        event.bytes &&
        (messageType === "image" ||
          messageType === "video" ||
          messageType === "audio" ||
          messageType === "document" ||
          messageType === "sticker")
      ) {
        const saved = await saveWhatsAppMediaBytes({
          conversationId: conversation.id,
          bytes: event.bytes,
          mime: event.mime || "application/octet-stream",
          kind:
            messageType === "sticker"
              ? "image"
              : (messageType as "image" | "video" | "audio" | "document"),
          originalName: event.fileName ?? undefined,
        });
        if (!saved.ok) {
          throw new Error(`Media save failed: ${saved.error}`);
        }
        storageKey = saved.saved.storageKey;
        mediaMime = saved.saved.mime;
        mediaSize = saved.saved.size;
        mediaSha256 = saved.saved.sha256;
        if (!mediaFileName) mediaFileName = saved.saved.fileName;
      } else if (event.structuredBody) {
        body = event.structuredBody;
      }

      try {
        const message = await tx.whatsAppMessage.create({
          data: {
            conversationId: conversation.id,
            direction: "inbound",
            messageType,
            body,
            caption,
            mediaMime,
            mediaSize,
            mediaDurationSec: event.durationSec,
            mediaFileName,
            mediaSha256,
            storageKey,
            waMessageId,
            status: "received",
            waTimestamp,
          },
        });
        return {
          conversationId: conversation.id,
          messageId: message.id,
          created: true,
        };
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        const again = await tx.whatsAppMessage.findUnique({
          where: { waMessageId },
          select: { id: true, conversationId: true },
        });
        if (!again) throw err;
        return {
          conversationId: again.conversationId,
          messageId: again.id,
          created: false,
        };
      }
    });

    return {
      ok: true,
      created: result.created,
      conversationId: result.conversationId,
      messageId: result.messageId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persist failed";
    return { ok: false, reason: "PERSIST_FAILED", error: message.slice(0, 200) };
  }
}

/** Ensure a 1:1 conversation exists from history chat list (WhatsApp-like roster). */
export async function seedConversationFromChat(
  event: WhatsAppChatSeedEvent,
  db: DbClient = defaultPrisma
): Promise<PersistInboundTextResult> {
  const waChatId = event.waChatId?.trim();
  if (
    !waChatId ||
    waChatId.endsWith("@g.us") ||
    waChatId === "status@broadcast" ||
    waChatId === "0@s.whatsapp.net" ||
    waChatId.startsWith("0@")
  ) {
    return { ok: false, reason: "INVALID_INPUT", error: "Invalid chat id" };
  }
  // Keep a real E.164 even on @lid chats; only reject LID-digit mirrors
  const participantE164 =
    event.participantE164 &&
    !isE164LikelyLidMirror(event.participantE164, waChatId)
      ? event.participantE164
      : null;
  try {
    const lastAt = event.lastMessageAt
      ? parseWaTimestamp(event.lastMessageAt)
      : null;
    const existing = await db.whatsAppConversation.findUnique({
      where: { waChatId },
      select: { participantE164: true },
    });
    const clearBadPhone = isE164LikelyLidMirror(
      existing?.participantE164,
      waChatId
    );
    const conversation = await db.whatsAppConversation.upsert({
      where: { waChatId },
      create: {
        waChatId,
        remoteJid: waChatId,
        participantE164,
        displayName: event.displayName,
        lastMessageAt: lastAt,
        lastMessagePreview: previewOf(event.lastMessagePreview || ""),
        unreadCount: 0,
      },
      update: {
        ...(event.displayName ? { displayName: event.displayName } : {}),
        ...(participantE164
          ? { participantE164 }
          : clearBadPhone
            ? { participantE164: null }
            : {}),
        ...(lastAt
          ? {
              lastMessageAt: lastAt,
              lastMessagePreview: previewOf(event.lastMessagePreview || ""),
            }
          : {}),
      },
    });
    return {
      ok: true,
      created: true,
      conversationId: conversation.id,
      messageId: conversation.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persist failed";
    return { ok: false, reason: "PERSIST_FAILED", error: message.slice(0, 200) };
  }
}

/**
 * Apply contact / LID↔phone identity onto matching inbox conversations.
 */
export async function applyContactIdentity(
  event: WhatsAppContactIdentityEvent,
  db: DbClient = defaultPrisma
): Promise<{ updated: number }> {
  const ids = [event.waChatId, event.altWaChatId]
    .map((v) => v?.trim())
    .filter((v): v is string => !!v);
  if (ids.length === 0) return { updated: 0 };

  const rows = await db.whatsAppConversation.findMany({
    where: { waChatId: { in: ids } },
    select: { id: true, waChatId: true, participantE164: true, displayName: true },
  });
  let updated = 0;
  for (const row of rows) {
    const data: {
      participantE164?: string | null;
      displayName?: string | null;
      remoteJid?: string;
    } = {};
    if (event.participantE164) {
      data.participantE164 = event.participantE164;
    } else if (isE164LikelyLidMirror(row.participantE164, row.waChatId)) {
      data.participantE164 = null;
    }
    if (event.displayName?.trim()) {
      data.displayName = event.displayName.trim();
    }
    if (event.altWaChatId && isLidJid(row.waChatId)) {
      // Keep waChatId stable (LID) for addressing; mirror phone on remoteJid when known
      data.remoteJid = event.altWaChatId;
    }
    if (Object.keys(data).length === 0) continue;
    await db.whatsAppConversation.update({ where: { id: row.id }, data });
    updated += 1;
  }
  return { updated };
}

/**
 * Persist a message that originated on the linked phone (history or fromMe).
 * Idempotent on waMessageId. Does not go through the outbound queue.
 */
export async function persistOutboundEcho(
  event: WhatsAppOutboundEchoEvent,
  db: DbClient = defaultPrisma
): Promise<PersistInboundTextResult> {
  const waMessageId = event.waMessageId?.trim();
  const waChatId = event.waChatId?.trim() || event.waRemoteJid?.trim();
  const text = event.text?.trim() ?? "";
  if (!waMessageId || !waChatId) {
    return {
      ok: false,
      reason: "INVALID_INPUT",
      error: "waMessageId and waChatId are required",
    };
  }
  if (!text) {
    return {
      ok: false,
      reason: "INVALID_INPUT",
      error: "Empty echo text skipped",
    };
  }

  const existing = await db.whatsAppMessage.findUnique({
    where: { waMessageId },
    select: { id: true, conversationId: true },
  });
  if (existing) {
    return {
      ok: true,
      created: false,
      conversationId: existing.conversationId,
      messageId: existing.id,
    };
  }

  const waTimestamp = parseWaTimestamp(event.timestamp);
  const remoteJid = event.waRemoteJid?.trim() || waChatId;

  try {
    const result = await db.$transaction(async (tx) => {
      const conversation = await tx.whatsAppConversation.upsert({
        where: { waChatId },
        create: {
          waChatId,
          remoteJid,
          lastMessageAt: waTimestamp,
          lastMessagePreview: previewOf(text),
          unreadCount: 0,
        },
        update: {
          remoteJid,
          lastMessageAt: waTimestamp,
          lastMessagePreview: previewOf(text),
        },
      });
      try {
        const message = await tx.whatsAppMessage.create({
          data: {
            conversationId: conversation.id,
            direction: "outbound",
            messageType: "text",
            body: text,
            waMessageId,
            status: "sent",
            waTimestamp,
          },
        });
        return {
          conversationId: conversation.id,
          messageId: message.id,
          created: true,
        };
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        const again = await tx.whatsAppMessage.findUnique({
          where: { waMessageId },
          select: { id: true, conversationId: true },
        });
        if (!again) throw err;
        return {
          conversationId: again.conversationId,
          messageId: again.id,
          created: false,
        };
      }
    });
    return {
      ok: true,
      created: result.created,
      conversationId: result.conversationId,
      messageId: result.messageId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persist failed";
    return { ok: false, reason: "PERSIST_FAILED", error: message.slice(0, 200) };
  }
}

/**
 * Mirror adapter health into DB for admin UI (Phase C). Never stores secrets/QR.
 */
export async function upsertConnectionHealth(
  health: WhatsAppHealth,
  db: DbClient = defaultPrisma
): Promise<void> {
  const lastConnectedAt = health.lastConnectedAt
    ? parseWaTimestamp(health.lastConnectedAt)
    : null;

  await db.whatsAppConnectionHealth.upsert({
    where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
    create: {
      id: WHATSAPP_CONNECTION_HEALTH_ID,
      state: health.state,
      detailSafe: health.detail?.slice(0, 300) ?? null,
      lastConnectedAt,
    },
    update: {
      state: health.state,
      detailSafe: health.detail?.slice(0, 300) ?? null,
      ...(lastConnectedAt ? { lastConnectedAt } : {}),
    },
  });
}

/**
 * Application-layer outbound enqueue.
 * Creates/updates conversation and a pending message.
 * Does not call Baileys — worker (or sendOutboundText) dispatches.
 * Kill switch blocks enqueue so no send path is created while disabled.
 */
export async function enqueueOutboundText(
  input: EnqueueOutboundTextInput,
  db: DbClient = defaultPrisma
): Promise<EnqueueOutboundTextResult> {
  if (!isOutboundEnabled()) {
    return {
      ok: false,
      code: "OUTBOUND_DISABLED",
      error: "Outbound messaging is disabled (WHATSAPP_OUTBOUND_ENABLED)",
    };
  }

  const safety = assessOutboundEnqueue();
  if (!safety.ok) {
    return {
      ok: false,
      code: safety.code,
      error: safety.error,
    };
  }

  const clientRequestId = input.clientRequestId?.trim() ?? "";
  const adminId = input.adminId?.trim() ?? "";
  const text = input.text?.trim() ?? "";
  const jid = normalizeUserJid(input.waChatId);

  if (!clientRequestId) {
    return { ok: false, code: "INVALID_INPUT", error: "clientRequestId is required" };
  }
  if (!adminId) {
    return { ok: false, code: "INVALID_INPUT", error: "adminId is required" };
  }
  if (!text) {
    return { ok: false, code: "INVALID_INPUT", error: "Message text is empty" };
  }
  if (text.length > MAX_OUTBOUND_TEXT_LENGTH) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      error: `Message exceeds ${MAX_OUTBOUND_TEXT_LENGTH} characters`,
    };
  }
  if (!jid) {
    return { ok: false, code: "INVALID_INPUT", error: "Invalid waChatId" };
  }

  const existing = await db.whatsAppMessage.findUnique({
    where: { clientRequestId },
    select: {
      id: true,
      conversationId: true,
      status: true,
    },
  });
  if (existing) {
    return {
      ok: true,
      conversationId: existing.conversationId,
      messageId: existing.id,
      status: existing.status as "pending" | "sending" | "sent" | "failed",
      duplicate: true,
    };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const conversation = await tx.whatsAppConversation.upsert({
        where: { waChatId: jid },
        create: {
          waChatId: jid,
          remoteJid: jid,
          lastMessageAt: new Date(),
          lastMessagePreview: previewOf(text),
          unreadCount: 0,
        },
        update: {
          lastMessageAt: new Date(),
          lastMessagePreview: previewOf(text),
        },
      });

      try {
        const message = await tx.whatsAppMessage.create({
          data: {
            conversationId: conversation.id,
            direction: "outbound",
            messageType: "text",
            body: text,
            clientRequestId,
            status: "pending",
            attemptCount: 0,
            adminId,
          },
        });
        return {
          conversationId: conversation.id,
          messageId: message.id,
          status: "pending" as const,
          duplicate: false,
        };
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        const again = await tx.whatsAppMessage.findUnique({
          where: { clientRequestId },
          select: { id: true, conversationId: true, status: true },
        });
        if (!again) throw err;
        return {
          conversationId: again.conversationId,
          messageId: again.id,
          status: again.status as "pending" | "sending" | "sent" | "failed",
          duplicate: true,
        };
      }
    });

    return { ok: true, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persist failed";
    return { ok: false, code: "PERSIST_FAILED", error: message.slice(0, 200) };
  }
}

/** Enqueue outbound media (image/video/audio/document) — worker transmits. */
export async function enqueueOutboundMedia(
  input: EnqueueOutboundMediaInput,
  db: DbClient = defaultPrisma
): Promise<EnqueueOutboundTextResult> {
  if (!isOutboundEnabled()) {
    return {
      ok: false,
      code: "OUTBOUND_DISABLED",
      error: "Outbound messaging is disabled (WHATSAPP_OUTBOUND_ENABLED)",
    };
  }

  const safety = assessOutboundEnqueue();
  if (!safety.ok) {
    return {
      ok: false,
      code: safety.code,
      error: safety.error,
    };
  }

  const clientRequestId = input.clientRequestId?.trim() ?? "";
  const adminId = input.adminId?.trim() ?? "";
  const jid = normalizeUserJid(input.waChatId);
  const messageType = input.messageType;
  const caption = input.caption?.trim() || null;

  if (!clientRequestId) {
    return { ok: false, code: "INVALID_INPUT", error: "clientRequestId is required" };
  }
  if (!adminId) {
    return { ok: false, code: "INVALID_INPUT", error: "adminId is required" };
  }
  if (!jid) {
    return { ok: false, code: "INVALID_INPUT", error: "Invalid waChatId" };
  }
  if (!input.bytes?.length) {
    return { ok: false, code: "INVALID_INPUT", error: "Media is empty" };
  }

  const existing = await db.whatsAppMessage.findUnique({
    where: { clientRequestId },
    select: { id: true, conversationId: true, status: true },
  });
  if (existing) {
    return {
      ok: true,
      conversationId: existing.conversationId,
      messageId: existing.id,
      status: existing.status as "pending" | "sending" | "sent" | "failed",
      duplicate: true,
    };
  }

  try {
    const conversation = await db.whatsAppConversation.upsert({
      where: { waChatId: jid },
      create: {
        waChatId: jid,
        remoteJid: jid,
        lastMessageAt: new Date(),
        lastMessagePreview: mediaPreview(messageType, caption, input.fileName),
        unreadCount: 0,
      },
      update: {
        lastMessageAt: new Date(),
        lastMessagePreview: mediaPreview(messageType, caption, input.fileName),
      },
    });

    const saved = await saveWhatsAppMediaBytes({
      conversationId: conversation.id,
      bytes: input.bytes,
      mime: input.mime,
      kind: messageType,
      originalName: input.fileName ?? undefined,
    });
    if (!saved.ok) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        error: `Media rejected (${saved.error})`,
      };
    }

    try {
      const message = await db.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          direction: "outbound",
          messageType,
          body: caption ?? "",
          caption,
          mediaMime: saved.saved.mime,
          mediaSize: saved.saved.size,
          mediaFileName: input.fileName?.trim() || saved.saved.fileName,
          mediaSha256: saved.saved.sha256,
          storageKey: saved.saved.storageKey,
          clientRequestId,
          status: "pending",
          adminId,
        },
      });
      return {
        ok: true,
        conversationId: conversation.id,
        messageId: message.id,
        status: "pending",
        duplicate: false,
      };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      const again = await db.whatsAppMessage.findUnique({
        where: { clientRequestId },
        select: { id: true, conversationId: true, status: true },
      });
      if (!again) throw err;
      return {
        ok: true,
        conversationId: again.conversationId,
        messageId: again.id,
        status: again.status as "pending" | "sending" | "sent" | "failed",
        duplicate: true,
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persist failed";
    return { ok: false, code: "PERSIST_FAILED", error: message.slice(0, 200) };
  }
}

/**
 * Worker restart recovery for interrupted `sending` rows.
 *
 * - If waMessageId already present → mark sent (do not resend).
 * - Else if attempts exhausted → failed (manual intervention).
 * - Else → pending for bounded retry.
 * Only touches stale `sending` rows (or all sending when forceAll=true for tests).
 */
export async function recoverInterruptedOutbound(
  db: DbClient = defaultPrisma,
  options?: { forceAll?: boolean; now?: Date }
): Promise<RecoverInterruptedResult> {
  const now = options?.now ?? new Date();
  const staleBefore = new Date(now.getTime() - STALE_SENDING_MS);

  const interrupted = await db.whatsAppMessage.findMany({
    where: {
      direction: "outbound",
      status: "sending",
      ...(options?.forceAll
        ? {}
        : {
            OR: [
              { lastAttemptAt: null },
              { lastAttemptAt: { lte: staleBefore } },
            ],
          }),
    },
    select: {
      id: true,
      waMessageId: true,
      attemptCount: true,
    },
  });

  let recoveredToPending = 0;
  let markedFailed = 0;
  let markedSent = 0;

  for (const row of interrupted) {
    if (row.waMessageId) {
      await db.whatsAppMessage.update({
        where: { id: row.id },
        data: {
          status: "sent",
          errorSafe: null,
        },
      });
      markedSent += 1;
      continue;
    }

    if (row.attemptCount >= MAX_OUTBOUND_ATTEMPTS) {
      await db.whatsAppMessage.update({
        where: { id: row.id },
        data: {
          status: "failed",
          errorSafe:
            "Interrupted during send; max attempts reached — manual review required",
        },
      });
      markedFailed += 1;
      continue;
    }

    await db.whatsAppMessage.update({
      where: { id: row.id },
      data: {
        status: "pending",
        errorSafe: "Recovered after interrupted send — awaiting retry",
      },
    });
    recoveredToPending += 1;
  }

  return { recoveredToPending, markedFailed, markedSent };
}

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  read: 4,
};

/**
 * Apply a delivery/read receipt from the transport (Baileys `messages.update`
 * ack levels). Only ever moves status forward — a late-arriving "delivered"
 * after "read" (out-of-order receipts happen) or any receipt for a message
 * already "failed" is a no-op, never a downgrade.
 */
export async function recordOutboundStatusUpdate(
  waMessageId: string,
  status: "delivered" | "read",
  db: DbClient = defaultPrisma
): Promise<{ ok: boolean; applied: boolean }> {
  const id = waMessageId.trim();
  if (!id) return { ok: false, applied: false };

  const row = await db.whatsAppMessage.findUnique({
    where: { waMessageId: id },
    select: { id: true, status: true, direction: true },
  });
  if (!row || row.direction !== "outbound") return { ok: false, applied: false };

  const current = STATUS_RANK[row.status] ?? -1;
  const next = STATUS_RANK[status];
  if (next <= current) return { ok: true, applied: false };

  await db.whatsAppMessage.update({
    where: { id: row.id },
    data: { status },
  });
  return { ok: true, applied: true };
}

/**
 * Atomically claim a pending outbound row for sending.
 * Prevents duplicate concurrent dispatch across workers/polls.
 */
export async function claimOutboundForSend(
  messageId: string,
  db: DbClient = defaultPrisma
): Promise<
  | {
      ok: true;
      attemptCount: number;
      clientRequestId: string;
      waChatId: string;
      body: string;
      adminId: string | null;
      messageType: string;
      caption: string | null;
      mediaMime: string | null;
      mediaFileName: string | null;
      storageKey: string | null;
    }
  | { ok: false; reason: "NOT_FOUND" | "NOT_CLAIMABLE" | "MAX_ATTEMPTS" }
> {
  const row = await db.whatsAppMessage.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });
  if (!row || row.direction !== "outbound") {
    return { ok: false, reason: "NOT_FOUND" };
  }
  if (row.status === "sent" || row.status === "failed") {
    return { ok: false, reason: "NOT_CLAIMABLE" };
  }
  if (row.status === "sending") {
    return { ok: false, reason: "NOT_CLAIMABLE" };
  }
  if (row.status !== "pending") {
    return { ok: false, reason: "NOT_CLAIMABLE" };
  }
  if (!row.clientRequestId) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  if (row.attemptCount >= MAX_OUTBOUND_ATTEMPTS) {
    await db.whatsAppMessage.update({
      where: { id: messageId },
      data: {
        status: "failed",
        errorSafe: "Max outbound attempts reached",
      },
    });
    return { ok: false, reason: "MAX_ATTEMPTS" };
  }

  const nextAttempt = row.attemptCount + 1;
  const claimed = await db.whatsAppMessage.updateMany({
    where: { id: messageId, status: "pending", direction: "outbound" },
    data: {
      status: "sending",
      attemptCount: nextAttempt,
      lastAttemptAt: new Date(),
      errorSafe: null,
    },
  });
  if (claimed.count !== 1) {
    return { ok: false, reason: "NOT_CLAIMABLE" };
  }

  return {
    ok: true,
    attemptCount: nextAttempt,
    clientRequestId: row.clientRequestId,
    waChatId: row.conversation.waChatId,
    body: row.body,
    adminId: row.adminId,
    messageType: row.messageType,
    caption: row.caption,
    mediaMime: row.mediaMime,
    mediaFileName: row.mediaFileName,
    storageKey: row.storageKey,
  };
}

/**
 * Dispatch a pending outbound message through the injected adapter.
 * Marks sent only when adapter returns ok with waMessageId.
 * Kill switch is re-checked here AND inside the adapter send boundary.
 */
export async function dispatchOutboundMessage(
  adapter: WhatsAppAdapter,
  messageId: string,
  db: DbClient = defaultPrisma
): Promise<DispatchOutboundResult> {
  // Final application-layer kill switch before claim/send
  if (!isOutboundEnabled()) {
    return {
      ok: false,
      messageId,
      status: "pending",
      code: "OUTBOUND_DISABLED",
      error: "Outbound messaging is disabled (WHATSAPP_OUTBOUND_ENABLED)",
    };
  }

  const existing = await db.whatsAppMessage.findUnique({
    where: { id: messageId },
  });
  if (!existing || existing.direction !== "outbound") {
    return {
      ok: false,
      messageId,
      status: "failed",
      code: "NOT_FOUND",
      error: "Outbound message not found",
    };
  }
  if (existing.status === "sent") {
    return {
      ok: false,
      messageId,
      status: "sent",
      code: "ALREADY_FINAL",
      error: "Message already sent",
    };
  }
  if (existing.status === "failed") {
    return {
      ok: false,
      messageId,
      status: "failed",
      code: "ALREADY_FINAL",
      error: "Message already failed",
    };
  }

  // Number-survival gate BEFORE claim so a rejected slot does not burn attemptCount
  const slot = await acquireOutboundSendSlot();
  if (!slot.ok) {
    return {
      ok: false,
      messageId,
      status: existing.status as "pending" | "sending" | "sent" | "failed",
      code: slot.code,
      error: slot.error,
    };
  }

  const claimed = await claimOutboundForSend(messageId, db);
  if (!claimed.ok) {
    if (claimed.reason === "MAX_ATTEMPTS") {
      return {
        ok: false,
        messageId,
        status: "failed",
        code: "MAX_ATTEMPTS",
        error: "Max outbound attempts reached",
      };
    }
    return {
      ok: false,
      messageId,
      status: existing.status as "pending" | "sending" | "sent" | "failed",
      code: "CLAIM_FAILED",
      error: "Could not claim message for send",
    };
  }

  // Re-check kill switch after claim (env may flip); never transmit
  if (!isOutboundEnabled()) {
    await db.whatsAppMessage.update({
      where: { id: messageId },
      data: {
        status: "pending",
        errorSafe: "Outbound disabled after claim — returned to pending",
      },
    });
    return {
      ok: false,
      messageId,
      status: "pending",
      code: "OUTBOUND_DISABLED",
      error: "Outbound messaging is disabled (WHATSAPP_OUTBOUND_ENABLED)",
    };
  }

  let send: Awaited<ReturnType<WhatsAppAdapter["sendText"]>>;

  if (
    isWhatsAppMediaMessageType(claimed.messageType) &&
    claimed.messageType !== "sticker" &&
    claimed.storageKey
  ) {
    const bytes = await readWhatsAppMediaByKey(claimed.storageKey);
    if (!bytes || !adapter.sendMedia) {
      await db.whatsAppMessage.update({
        where: { id: messageId },
        data: {
          status: "pending",
          errorSafe: !bytes
            ? "Media file missing on disk — awaiting retry"
            : "Adapter does not support media send",
        },
      });
      return {
        ok: false,
        messageId,
        status: "pending",
        code: "SEND_FAILED",
        error: !bytes ? "Media file missing" : "Media send not supported",
      };
    }
    send = await adapter.sendMedia({
      waChatId: claimed.waChatId,
      clientRequestId: claimed.clientRequestId,
      adminId: claimed.adminId ?? "unknown",
      messageType: claimed.messageType,
      mime: claimed.mediaMime || "application/octet-stream",
      fileName: claimed.mediaFileName,
      caption: claimed.caption,
      bytes,
      ptt: claimed.messageType === "audio",
    });
  } else {
    send = await adapter.sendText({
      waChatId: claimed.waChatId,
      text: claimed.body,
      clientRequestId: claimed.clientRequestId,
      adminId: claimed.adminId ?? "unknown",
    });
  }

  if (send.ok) {
    recordOutboundSendSuccess();
    await db.whatsAppMessage.update({
      where: { id: messageId },
      data: {
        status: "sent",
        waMessageId: send.waMessageId,
        errorSafe: null,
        waTimestamp: new Date(),
      },
    });
    return {
      ok: true,
      messageId,
      waMessageId: send.waMessageId,
      status: "sent",
    };
  }

  // Do not permanently fail on kill switch / not connected — return to pending
  if (send.code === "OUTBOUND_DISABLED" || send.code === "NOT_CONNECTED") {
    await db.whatsAppMessage.update({
      where: { id: messageId },
      data: {
        status: "pending",
        errorSafe: send.error.slice(0, 300),
      },
    });
    return {
      ok: false,
      messageId,
      status: "pending",
      code: send.code,
      error: send.error,
    };
  }

  recordOutboundSendFailure();

  if (claimed.attemptCount >= MAX_OUTBOUND_ATTEMPTS) {
    await db.whatsAppMessage.update({
      where: { id: messageId },
      data: {
        status: "failed",
        errorSafe: send.error.slice(0, 300),
      },
    });
    return {
      ok: false,
      messageId,
      status: "failed",
      code: send.code === "DUPLICATE" ? "DUPLICATE" : "SEND_FAILED",
      error: send.error,
    };
  }

  // Bounded retry remaining — park as pending
  await db.whatsAppMessage.update({
    where: { id: messageId },
    data: {
      status: "pending",
      errorSafe: `Attempt ${claimed.attemptCount}/${MAX_OUTBOUND_ATTEMPTS} failed: ${send.error}`.slice(
        0,
        300
      ),
    },
  });
  return {
    ok: false,
    messageId,
    status: "pending",
    code: send.code === "DUPLICATE" ? "DUPLICATE" : "SEND_FAILED",
    error: send.error,
  };
}

/**
 * Full application outbound path: enqueue then dispatch via adapter.
 * Prefer this when the caller holds a live WhatsAppAdapter (worker).
 */
export async function sendOutboundText(
  adapter: WhatsAppAdapter,
  input: EnqueueOutboundTextInput,
  db: DbClient = defaultPrisma
): Promise<DispatchOutboundResult & { conversationId?: string }> {
  const enqueued = await enqueueOutboundText(input, db);
  if (!enqueued.ok) {
    return {
      ok: false,
      messageId: "",
      status: "failed",
      code:
        enqueued.code === "OUTBOUND_DISABLED"
          ? "OUTBOUND_DISABLED"
          : enqueued.code === "RATE_LIMITED"
            ? "RATE_LIMITED"
            : enqueued.code === "SAFETY_CIRCUIT"
              ? "SAFETY_CIRCUIT"
              : enqueued.code === "PERSIST_FAILED"
                ? "SEND_FAILED"
                : "INVALID_INPUT",
      error: enqueued.error,
    };
  }

  if (enqueued.duplicate && enqueued.status === "sent") {
    const existing = await db.whatsAppMessage.findUnique({
      where: { id: enqueued.messageId },
      select: { waMessageId: true },
    });
    return {
      ok: true,
      messageId: enqueued.messageId,
      waMessageId: existing?.waMessageId ?? "",
      status: "sent",
      conversationId: enqueued.conversationId,
    };
  }

  if (enqueued.duplicate && enqueued.status === "failed") {
    return {
      ok: false,
      messageId: enqueued.messageId,
      status: "failed",
      code: "ALREADY_FINAL",
      error: "Prior send with this clientRequestId already failed",
      conversationId: enqueued.conversationId,
    };
  }

  if (enqueued.duplicate && enqueued.status === "sending") {
    return {
      ok: false,
      messageId: enqueued.messageId,
      status: "sending",
      code: "CLAIM_FAILED",
      error: "Send already in progress for this clientRequestId",
      conversationId: enqueued.conversationId,
    };
  }

  const dispatched = await dispatchOutboundMessage(
    adapter,
    enqueued.messageId,
    db
  );
  return { ...dispatched, conversationId: enqueued.conversationId };
}

/**
 * Process pending outbound rows (worker restart / queue drain).
 * Does not pick `sending` rows — those are recovered first.
 */
export async function dispatchPendingOutbound(
  adapter: WhatsAppAdapter,
  db: DbClient = defaultPrisma,
  limit = 20
): Promise<{ processed: number; results: DispatchOutboundResult[] }> {
  if (!isOutboundEnabled()) {
    return { processed: 0, results: [] };
  }

  const pending = await db.whatsAppMessage.findMany({
    where: { direction: "outbound", status: "pending" },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit,
    select: { id: true },
  });

  const results: DispatchOutboundResult[] = [];
  for (const row of pending) {
    results.push(await dispatchOutboundMessage(adapter, row.id, db));
  }
  return { processed: results.length, results };
}
