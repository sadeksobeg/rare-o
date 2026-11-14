/**
 * Inbox realtime bus (WA-W1): persist event + Postgres NOTIFY.
 * Payloads must never include phones, QR, session material, or full bodies.
 */

import { prisma as defaultPrisma } from "@/lib/db/prisma";

export const INBOX_NOTIFY_CHANNEL = "rareoud_wa_inbox";

export const INBOX_EVENT_TYPES = [
  "message.new",
  "message.status",
  "conversation.updated",
  "connection.state",
] as const;

export type InboxEventType = (typeof INBOX_EVENT_TYPES)[number];

export type InboxEventPayload = {
  conversationId?: string;
  messageId?: string;
  clientRequestId?: string | null;
  status?: string;
  direction?: string;
  messageType?: string;
  /** Truncated preview for list UI — max ~80 chars, never full body */
  preview?: string;
  unreadCount?: number;
  /** Admin toast kind (e.g. customer_confirmed) — no PII. */
  kind?: string;
  requestId?: string;
  /** retail (default) | wholesale | deal — picks the admin page the toast opens. */
  domain?: string;
  /** Short Arabic title for the toast, e.g. the request reference. */
  title?: string;
  connectionState?: string;
  outboundEnabled?: boolean;
  outboundKillSwitch?: boolean;
  outboundKillSwitchAt?: string | null;
  outboundKillSwitchBy?: string | null;
  outboundKillSwitchReason?: string | null;
};

type DbLike = {
  whatsAppInboxEvent: {
    create: (args: {
      data: { type: string; payloadJson: string };
      select: { id: true; type: true; payloadJson: true; createdAt: true };
    }) => Promise<{
      id: string;
      type: string;
      payloadJson: string;
      createdAt: Date;
    }>;
  };
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
};

const PREVIEW_MAX = 80;

export function truncatePreview(text: string | null | undefined): string {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= PREVIEW_MAX) return t;
  return `${t.slice(0, PREVIEW_MAX - 1)}…`;
}

export type PublishedInboxEvent = {
  id: string;
  type: InboxEventType;
  payload: InboxEventPayload;
  createdAt: string;
};

/**
 * Write durable event then NOTIFY listeners with the event id only.
 * Failures are swallowed after log-safe message — never block message persist.
 */
export async function publishInboxEvent(
  type: InboxEventType,
  payload: InboxEventPayload,
  db: DbLike = defaultPrisma as unknown as DbLike
): Promise<PublishedInboxEvent | null> {
  try {
    const safe: InboxEventPayload = {
      ...(payload.conversationId
        ? { conversationId: payload.conversationId }
        : {}),
      ...(payload.messageId ? { messageId: payload.messageId } : {}),
      ...(payload.clientRequestId !== undefined
        ? { clientRequestId: payload.clientRequestId }
        : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.direction ? { direction: payload.direction } : {}),
      ...(payload.messageType ? { messageType: payload.messageType } : {}),
      ...(payload.preview !== undefined
        ? { preview: truncatePreview(payload.preview) }
        : {}),
      ...(typeof payload.unreadCount === "number"
        ? { unreadCount: payload.unreadCount }
        : {}),
      ...(payload.kind ? { kind: String(payload.kind).slice(0, 40) } : {}),
      ...(payload.requestId ? { requestId: String(payload.requestId).slice(0, 40) } : {}),
      ...(payload.domain ? { domain: String(payload.domain).slice(0, 20) } : {}),
      ...(payload.title ? { title: String(payload.title).slice(0, 80) } : {}),
      ...(payload.connectionState
        ? { connectionState: payload.connectionState }
        : {}),
      ...(typeof payload.outboundEnabled === "boolean"
        ? { outboundEnabled: payload.outboundEnabled }
        : {}),
      ...(typeof payload.outboundKillSwitch === "boolean"
        ? { outboundKillSwitch: payload.outboundKillSwitch }
        : {}),
      ...(payload.outboundKillSwitchAt !== undefined
        ? { outboundKillSwitchAt: payload.outboundKillSwitchAt }
        : {}),
      ...(payload.outboundKillSwitchBy !== undefined
        ? { outboundKillSwitchBy: payload.outboundKillSwitchBy }
        : {}),
      ...(payload.outboundKillSwitchReason !== undefined
        ? { outboundKillSwitchReason: payload.outboundKillSwitchReason }
        : {}),
    };

    const row = await db.whatsAppInboxEvent.create({
      data: {
        type,
        payloadJson: JSON.stringify(safe),
      },
      select: { id: true, type: true, payloadJson: true, createdAt: true },
    });

    // NOTIFY payload is the event id only (≤8000 bytes; keep tiny).
    // Channel name is a compile-time constant — never interpolate user input.
    await db.$executeRawUnsafe(
      `SELECT pg_notify('${INBOX_NOTIFY_CHANNEL}', $1)`,
      row.id
    );

    return {
      id: row.id,
      type: row.type as InboxEventType,
      payload: safe,
      createdAt: row.createdAt.toISOString(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "publish failed";
    console.error("[inbox-events] publish failed:", msg.slice(0, 120));
    return null;
  }
}

export async function listInboxEventsAfter(
  afterId: string | null,
  limit = 200,
  db: typeof defaultPrisma = defaultPrisma
): Promise<PublishedInboxEvent[]> {
  let createdAfter: Date | null = null;
  if (afterId) {
    const anchor = await db.whatsAppInboxEvent.findUnique({
      where: { id: afterId },
      select: { createdAt: true },
    });
    createdAfter = anchor?.createdAt ?? null;
  }

  const rows = await db.whatsAppInboxEvent.findMany({
    where: createdAfter
      ? {
          OR: [
            { createdAt: { gt: createdAfter } },
            { createdAt: createdAfter, id: { gt: afterId! } },
          ],
        }
      : undefined,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: Math.min(Math.max(limit, 1), 500),
  });

  return rows.map((row) => {
    let payload: InboxEventPayload = {};
    try {
      payload = JSON.parse(row.payloadJson) as InboxEventPayload;
    } catch {
      payload = {};
    }
    return {
      id: row.id,
      type: row.type as InboxEventType,
      payload,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export async function loadInboxEventById(
  id: string,
  db: typeof defaultPrisma = defaultPrisma
): Promise<PublishedInboxEvent | null> {
  const row = await db.whatsAppInboxEvent.findUnique({ where: { id } });
  if (!row) return null;
  let payload: InboxEventPayload = {};
  try {
    payload = JSON.parse(row.payloadJson) as InboxEventPayload;
  } catch {
    payload = {};
  }
  return {
    id: row.id,
    type: row.type as InboxEventType,
    payload,
    createdAt: row.createdAt.toISOString(),
  };
}
