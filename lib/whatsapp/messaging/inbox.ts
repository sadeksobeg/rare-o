/**
 * Admin inbox read models — safe DTOs only.
 * Never include session files, Baileys socket, or credentials.
 * Health view carries ephemeral admin pairing display (code / QR) only —
 * consumed by admin-protected UI, never logged.
 */

import { cache } from "react";
import type { PrismaClient } from "@prisma/client";

import { prisma as defaultPrisma } from "@/lib/db/prisma";
import { WHATSAPP_CONNECTION_HEALTH_ID } from "@/lib/whatsapp/messaging/constants";
import {
  isWhatsAppActiveLinkType,
  type WhatsAppActiveLinkType,
  type WhatsAppLinkType,
} from "@/lib/whatsapp/messaging/link-constants";
import { mediaUrl, parseStorageKey } from "@/lib/whatsapp/media";
import { formatMaskedPhone } from "@/lib/whatsapp/messaging/phone-format";
import {
  isOutboundEnvEnabled,
  primeOutboundKillSwitch,
} from "@/lib/whatsapp/types";
import { configureGlobalEnqueueRateLimit } from "@/lib/whatsapp/messaging/enqueue-rate-limit";

export type DbClient = PrismaClient;

export type InboxLinkSummary = {
  linked: boolean;
  linkType: WhatsAppLinkType;
  linkId: string | null;
};

export type InboxConversationListItem = {
  id: string;
  /** Privacy-conscious display label (never full phone until reveal) */
  displayLabel: string;
  /** Persisted name, when known — separate from displayLabel so the UI can
   *  show a masked phone alongside it rather than the full number. */
  name: string | null;
  /** Masked phone only — full E.164 only via audited reveal action. */
  participantE164: string | null;
  /** True when a full number exists server-side (enables reveal). */
  hasPhone: boolean;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  /** Direction/status of the newest visible message (list preview prefix + tick). */
  lastMessageDirection: "inbound" | "outbound" | null;
  lastMessageStatus: string | null;
  unreadCount: number;
  hasUnread: boolean;
  archived: boolean;
  muted: boolean;
  blocked: boolean;
  /** Lightweight link hint only — no business context payload */
  link: InboxLinkSummary;
  /** CHAT-F1: same-phone ownership conflict — desk badge only */
  phoneConflict: boolean;
};

export type InboxMessageItem = {
  id: string;
  direction: "inbound" | "outbound";
  /** whatsapp | platform — see WhatsAppMessage.channel */
  channel: string;
  messageType: string;
  body: string;
  caption: string | null;
  mediaMime: string | null;
  mediaFileName: string | null;
  mediaSize: number | null;
  mediaDurationSec: number | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  isPtt: boolean;
  replyTo: {
    id: string;
    body: string;
    messageType: string;
    direction: string;
  } | null;
  status: string;
  errorSafe: string | null;
  /** Outbound idempotency key — used to reconcile optimistic UI bubbles */
  clientRequestId: string | null;
  waTimestamp: string | null;
  createdAt: string;
  /** Trader portal: WhatsApp media exists but is not fetchable here */
  whatsappMediaUnavailable?: boolean;
};

export type InboxCrmParty = {
  customer: { id: string; name: string; phone: string } | null;
  trader: {
    id: string;
    displayName: string;
    phone: string;
    companyName: string;
    /** active | … — only an active account can read platform replies */
    status: string;
  } | null;
};

export type InboxNoteItem = {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type InboxConversationDetail = {
  id: string;
  displayLabel: string;
  name: string | null;
  waChatId: string;
  /** Masked phone only — full E.164 only via audited reveal action. */
  participantE164: string | null;
  hasPhone: boolean;
  unreadCount: number;
  archived: boolean;
  muted: boolean;
  blocked: boolean;
  link: InboxLinkSummary;
  crm: InboxCrmParty;
  messages: InboxMessageItem[];
  notes: InboxNoteItem[];
  tags: string[];
};

export type InboxHealthView = {
  /** Staleness-checked for display — see getInboxHealthView. Never raw-trust
   *  a persisted "CONNECTED" with no recent heartbeat. */
  state: string;
  /** The raw, unadjusted state column, before the staleness check below. */
  rawState: string;
  detailSafe: string | null;
  lastConnectedAt: string | null;
  /** Last worker liveness ping while connected — null if never connected
   *  since this field was introduced, or genuinely stale. */
  lastHeartbeatAt: string | null;
  updatedAt: string | null;
  outboundEnabled: boolean;
  /** Runtime DB kill switch (W1) — independent of env flag */
  outboundKillSwitch: boolean;
  outboundKillSwitchAt: string | null;
  outboundKillSwitchBy: string | null;
  outboundKillSwitchReason: string | null;
  /** Global enqueue cap (messages / rolling minute) from settings */
  outboundGlobalRatePerMin: number;
  /** Admin-only pairing display (ephemeral; null once expired / cleared) */
  pairingPhone: string | null;
  pairingCode: string | null;
  qrDataUrl: string | null;
  pairingExpiresAt: string | null;
  /** none | pair | qr | reconnect | logout */
  linkCommand: string;
};

/**
 * Build a privacy-conscious label from persisted identity fields only.
 * Does not invent customer names from business domains.
 */
export function resolveConversationPhoneDigits(input: {
  participantE164: string | null;
  waChatId: string;
}): string | null {
  const server = (input.waChatId.split("@")[1] ?? "").toLowerCase();
  const user = (input.waChatId.split("@")[0] ?? "").split(":")[0] ?? "";
  const rawE164 = input.participantE164?.trim() || null;
  // LID digits must never be treated as a phone number
  const e164 =
    rawE164 && !(server === "lid" && rawE164 === user.replace(/\D/g, ""))
      ? rawE164.replace(/\D/g, "")
      : server === "s.whatsapp.net" || server === "c.us"
        ? user.replace(/\D/g, "") || null
        : null;
  if (!e164 || e164.length < 8 || e164.length > 15) return null;
  return e164;
}

export function formatConversationDisplayLabel(input: {
  participantE164: string | null;
  displayName: string | null;
  waChatId: string;
}): string {
  const name = input.displayName?.trim() || null;
  const digits = resolveConversationPhoneDigits(input);
  const phone = formatMaskedPhone(digits);

  if (name && phone) return `${name} · ${phone}`;
  if (name) return name;
  if (phone) return phone;

  const user = (input.waChatId.split("@")[0] ?? "").split(":")[0] ?? "";
  const masked =
    user.length <= 4 ? user : `${user.slice(0, 2)}…${user.slice(-4)}`;
  return masked;
}

export { formatMaskedPhone } from "@/lib/whatsapp/messaging/phone-format";

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

async function listInboxConversationsImpl(
  db: DbClient,
  take: number
): Promise<InboxConversationListItem[]> {
  const now = new Date();
  const rows = await db.whatsAppConversation.findMany({
    where: { archivedAt: null },
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
      archivedAt: true,
      mutedUntil: true,
      blockedAt: true,
      linkType: true,
      linkId: true,
      tags: true,
      // Fallback when denormalized preview/time are empty — latest message only.
      messages: {
        where: { hiddenAt: null },
        orderBy: [{ waTimestamp: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          body: true,
          caption: true,
          messageType: true,
          waTimestamp: true,
          createdAt: true,
          direction: true,
          status: true,
        },
      },
    },
  });

  return rows
    .filter(
      (r) =>
        r.waChatId !== "0@s.whatsapp.net" && !r.waChatId.startsWith("0@")
    )
    .map((r) => {
      const latest = r.messages[0];
      const storedPreview = (r.lastMessagePreview ?? "").trim();
      const derivedPreview =
        storedPreview ||
        (latest?.caption?.trim() ||
          latest?.body?.trim() ||
          (latest?.messageType && latest.messageType !== "text"
            ? `[${latest.messageType}]`
            : "")) ||
        "";
      const lastAt = r.lastMessageAt ?? latest?.waTimestamp ?? latest?.createdAt ?? null;
      const phoneDigits = resolveConversationPhoneDigits({
        participantE164: r.participantE164,
        waChatId: r.waChatId,
      });
      return {
        id: r.id,
        displayLabel: formatConversationDisplayLabel({
          participantE164: r.participantE164,
          displayName: r.displayName,
          waChatId: r.waChatId,
        }),
        name: r.displayName?.trim() || null,
        participantE164: formatMaskedPhone(phoneDigits),
        hasPhone: Boolean(phoneDigits),
        // Raw tags — UI humanizes via humanizeInboxPreview.
        lastMessagePreview: derivedPreview,
        lastMessageAt: toIso(lastAt),
        lastMessageDirection:
          latest?.direction === "outbound"
            ? "outbound"
            : latest?.direction === "inbound"
              ? "inbound"
              : null,
        lastMessageStatus: latest?.status ?? null,
        unreadCount: r.unreadCount,
        hasUnread: r.unreadCount > 0,
        archived: Boolean(r.archivedAt),
        muted: Boolean(r.mutedUntil && r.mutedUntil.getTime() > now.getTime()),
        blocked: Boolean(r.blockedAt),
        link: toLinkSummary(r),
        phoneConflict: r.tags.includes("phone-conflict"),
      };
    });
}

/** Per-request cache for default inbox list (layout + children share one query). */
const listInboxConversationsCached = cache((take: number) =>
  listInboxConversationsImpl(defaultPrisma, take)
);

export async function listInboxConversations(
  db: DbClient = defaultPrisma,
  take = 500
): Promise<InboxConversationListItem[]> {
  if (db === defaultPrisma) {
    return listInboxConversationsCached(take);
  }
  return listInboxConversationsImpl(db, take);
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
      customer: { select: { id: true, name: true, phone: true } },
      trader: {
        select: { id: true, displayName: true, phone: true, companyName: true, status: true },
      },
      messages: {
        where: { hiddenAt: null },
        orderBy: [
          { waTimestamp: "asc" },
          { createdAt: "asc" },
          { id: "asc" },
        ],
        include: {
          replyTo: {
            select: {
              id: true,
              body: true,
              caption: true,
              messageType: true,
              direction: true,
            },
          },
        },
      },
      notes: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!row) return null;

  const now = new Date();
  const phoneDigits = resolveConversationPhoneDigits({
    participantE164: row.participantE164,
    waChatId: row.waChatId,
  });
  return {
    id: row.id,
    displayLabel: formatConversationDisplayLabel({
      participantE164: row.participantE164,
      displayName: row.displayName,
      waChatId: row.waChatId,
    }),
    name: row.displayName?.trim() || null,
    waChatId: row.waChatId,
    participantE164: formatMaskedPhone(phoneDigits),
    hasPhone: Boolean(phoneDigits),
    unreadCount: row.unreadCount,
    archived: Boolean(row.archivedAt),
    muted: Boolean(row.mutedUntil && row.mutedUntil.getTime() > now.getTime()),
    blocked: Boolean(row.blockedAt),
    link: toLinkSummary(row),
    crm: {
      customer: row.customer,
      trader: row.trader,
    },
    messages: row.messages.map((m) => {
      const parsed = m.storageKey ? parseStorageKey(m.storageKey) : null;
      const thumb = m.thumbnailKey ? parseStorageKey(m.thumbnailKey) : null;
      return {
        id: m.id,
        direction: m.direction as "inbound" | "outbound",
        channel: m.channel,
        messageType: m.messageType,
        body: m.body,
        caption: m.caption,
        mediaMime: m.mediaMime,
        mediaFileName: m.mediaFileName,
        mediaSize: m.mediaSize,
        mediaDurationSec: m.mediaDurationSec,
        mediaUrl: parsed
          ? mediaUrl(parsed.conversationId, parsed.fileName)
          : null,
        thumbnailUrl: thumb
          ? mediaUrl(thumb.conversationId, thumb.fileName)
          : null,
        isPtt: m.isPtt === true,
        replyTo: m.replyTo
          ? {
              id: m.replyTo.id,
              body: (m.replyTo.caption || m.replyTo.body || "").slice(0, 120),
              messageType: m.replyTo.messageType,
              direction: m.replyTo.direction,
            }
          : null,
        status: m.status,
        errorSafe: m.errorSafe,
        clientRequestId: m.clientRequestId ?? null,
        waTimestamp: toIso(m.waTimestamp),
        createdAt: m.createdAt.toISOString(),
      };
    }),
    notes: row.notes.map((n) => ({
      id: n.id,
      body: n.body,
      authorName: n.authorName,
      createdAt: n.createdAt.toISOString(),
    })),
    tags: row.tags,
  };
}

/** Append-only — no edit/delete yet, matching the reference's own minimal note UI. */
export async function addInboxNote(
  input: { conversationId: string; adminId: string; adminName: string; body: string },
  db: DbClient = defaultPrisma
): Promise<InboxNoteItem | null> {
  const body = input.body.trim().slice(0, 2000);
  if (!body) return null;
  const row = await db.whatsAppConversationNote.create({
    data: {
      conversationId: input.conversationId,
      authorAdminId: input.adminId,
      authorName: input.adminName,
      body,
    },
  });
  return {
    id: row.id,
    body: row.body,
    authorName: row.authorName,
    createdAt: row.createdAt.toISOString(),
  };
}

const MAX_TAG_LENGTH = 30;
const MAX_TAGS_PER_CONVERSATION = 12;

export async function addInboxTag(
  input: { conversationId: string; tag: string },
  db: DbClient = defaultPrisma
): Promise<string[]> {
  const tag = input.tag.trim().slice(0, MAX_TAG_LENGTH);
  if (!tag) {
    const row = await db.whatsAppConversation.findUnique({
      where: { id: input.conversationId },
      select: { tags: true },
    });
    return row?.tags ?? [];
  }
  const row = await db.whatsAppConversation.findUnique({
    where: { id: input.conversationId },
    select: { tags: true },
  });
  if (!row) return [];
  if (row.tags.includes(tag) || row.tags.length >= MAX_TAGS_PER_CONVERSATION) {
    return row.tags;
  }
  const updated = await db.whatsAppConversation.update({
    where: { id: input.conversationId },
    data: { tags: { push: tag } },
    select: { tags: true },
  });
  return updated.tags;
}

export async function removeInboxTag(
  input: { conversationId: string; tag: string },
  db: DbClient = defaultPrisma
): Promise<string[]> {
  const row = await db.whatsAppConversation.findUnique({
    where: { id: input.conversationId },
    select: { tags: true },
  });
  if (!row) return [];
  const next = row.tags.filter((t) => t !== input.tag);
  const updated = await db.whatsAppConversation.update({
    where: { id: input.conversationId },
    data: { tags: next },
    select: { tags: true },
  });
  return updated.tags;
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
 * A CONNECTED row is only trusted while the worker's heartbeat is recent.
 * The worker pings every 45s (HEARTBEAT_MS in worker/whatsapp-worker.ts)
 * while its socket reports CONNECTED; a worker that dies without a clean
 * disconnect event (killed process, crashed host) never gets the chance to
 * flip the row to DISCONNECTED, so without this check the admin UI would
 * show "connected" indefinitely against a dead connection. 2.5x the
 * heartbeat interval tolerates one missed tick before downgrading the
 * DISPLAYED state — the raw DB row (state column) is never overwritten by
 * this check, only the value returned to callers.
 */
const HEARTBEAT_STALE_AFTER_MS = 45_000 * 2.5;

/**
 * Safe connection health for admin UI. Never returns session material;
 * pairing code / QR are ephemeral and hidden once expired.
 */
async function getInboxHealthViewImpl(
  db: DbClient
): Promise<InboxHealthView> {
  const row = await db.whatsAppConnectionHealth.findUnique({
    where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
  });

  const pairingExpired =
    !!row?.pairingExpiresAt && row.pairingExpiresAt.getTime() < Date.now();

  const rawState = row?.state ?? "DISCONNECTED";
  const heartbeatAgeMs = row?.lastHeartbeatAt
    ? Date.now() - row.lastHeartbeatAt.getTime()
    : null;
  const heartbeatStale =
    heartbeatAgeMs === null || heartbeatAgeMs > HEARTBEAT_STALE_AFTER_MS;
  // A claimed CONNECTED with no recent heartbeat is displayed as
  // RECONNECTING, not CONNECTED and not DISCONNECTED: the worker may still
  // be alive and about to catch up (don't scare the admin into re-pairing),
  // but it must not say "connected" while unconfirmed.
  const state = rawState === "CONNECTED" && heartbeatStale ? "RECONNECTING" : rawState;

  const kill = row?.outboundKillSwitch === true;
  primeOutboundKillSwitch(kill);
  const ratePerMin = row?.outboundGlobalRatePerMin ?? 20;
  configureGlobalEnqueueRateLimit(ratePerMin);

  const view: InboxHealthView = {
    state,
    rawState,
    detailSafe: row?.detailSafe ?? null,
    lastConnectedAt: toIso(row?.lastConnectedAt ?? null),
    lastHeartbeatAt: toIso(row?.lastHeartbeatAt ?? null),
    updatedAt: toIso(row?.updatedAt ?? null),
    outboundEnabled: isOutboundEnvEnabled() && !kill,
    outboundKillSwitch: kill,
    outboundKillSwitchAt: toIso(row?.outboundKillSwitchAt ?? null),
    outboundKillSwitchBy: row?.outboundKillSwitchBy ?? null,
    outboundKillSwitchReason: row?.outboundKillSwitchReason ?? null,
    outboundGlobalRatePerMin: ratePerMin,
    pairingPhone: row?.pairingPhone ?? null,
    pairingCode: pairingExpired ? null : (row?.pairingCode ?? null),
    qrDataUrl: pairingExpired ? null : (row?.qrDataUrl ?? null),
    pairingExpiresAt: toIso(row?.pairingExpiresAt ?? null),
    linkCommand: row?.linkCommand ?? "none",
  };

  // Local gate only — never production. Does not touch Baileys / real WA.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.WA_V_GATE_MOCK_CONNECTED === "1"
  ) {
    return {
      ...view,
      state: "CONNECTED",
      rawState: "CONNECTED",
      outboundEnabled: true,
      outboundKillSwitch: false,
      outboundKillSwitchAt: null,
      outboundKillSwitchBy: null,
      outboundKillSwitchReason: null,
      lastHeartbeatAt: new Date().toISOString(),
      detailSafe: "WA_V_GATE_MOCK_CONNECTED",
    };
  }

  return view;
}

const getInboxHealthViewCached = cache(() =>
  getInboxHealthViewImpl(defaultPrisma)
);

export async function getInboxHealthView(
  db: DbClient = defaultPrisma
): Promise<InboxHealthView> {
  if (db === defaultPrisma) {
    return getInboxHealthViewCached();
  }
  return getInboxHealthViewImpl(db);
}
