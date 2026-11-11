/**
 * CHAT-F2 — unify WhatsApp (@lid / phone JID) with the trader's platform thread.
 * No schema change: re-point messages, drop empty shell, audit ids only.
 */
import type { PrismaClient } from "@prisma/client";

import { prisma as defaultPrisma } from "@/lib/db/prisma";
import { isLidJid, isPhoneUserJid, toE164Digits } from "@/lib/whatsapp/jid";
import { publishInboxEvent } from "@/lib/whatsapp/messaging/inbox-events";

export type DbClient = PrismaClient;

export type UnifyDryRun = {
  dryRun: true;
  traderId: string;
  primaryId: string | null;
  secondaryIds: string[];
  messageMoveCount: number;
  wouldDelete: string[];
  skippedReason?: string;
};

export type UnifyResult =
  | {
      ok: true;
      dryRun: false;
      traderId: string;
      primaryId: string;
      mergedSecondaryIds: string[];
      messagesMoved: number;
    }
  | ({ ok: true } & UnifyDryRun)
  | { ok: false; error: string };

function isPlatformLocalJid(waChatId: string): boolean {
  return waChatId.endsWith("@platform.local");
}

/** Prefer a real WhatsApp addressing JID over platform.local isolation. */
export function scoreWhatsAppPrimary(waChatId: string): number {
  if (isPhoneUserJid(waChatId)) return 300;
  if (isLidJid(waChatId)) return 200;
  if (isPlatformLocalJid(waChatId)) return 50;
  return 100;
}

/**
 * Exactly one trader with a non-empty phone matching the digits.
 * Empty / whitespace phones never match.
 */
export async function findUniqueTraderIdByPhone(
  e164Raw: string | null | undefined,
  db: DbClient = defaultPrisma
): Promise<string | null> {
  const e164 = e164Raw ? toE164Digits(e164Raw) : null;
  if (!e164) return null;

  const traders = await db.traderAccount.findMany({
    where: {
      AND: [
        { phone: { not: "" } },
        { NOT: { phone: { equals: "   " } } },
      ],
    },
    select: { id: true, phone: true },
  });

  const hits = traders.filter((t) => {
    const p = t.phone?.trim();
    if (!p) return false;
    return toE164Digits(p) === e164;
  });
  if (hits.length !== 1) return null;
  return hits[0]!.id;
}

export type UnifySecondarySnapshot = {
  id: string;
  waChatId: string;
  remoteJid: string;
  participantE164: string | null;
  displayName: string | null;
  tags: string[];
  unreadCount: number;
  traderUnreadCount: number;
  messageCount: number;
  movedMessageIds: string[];
};

async function writeUnifyAudit(input: {
  db: DbClient;
  primaryId: string;
  primaryWaChatId?: string | null;
  secondaryIds: string[];
  secondarySnapshots?: UnifySecondarySnapshot[];
  traderId: string;
  messagesMoved: number;
  dryRun: boolean;
}): Promise<void> {
  try {
    await input.db.adminAuditLog.create({
      data: {
        adminId: null,
        action: input.dryRun ? "whatsapp.unify_dry_run" : "whatsapp.unify_merge",
        target: `WhatsAppConversation:${input.primaryId}`,
        metaJson: JSON.stringify({
          traderId: input.traderId,
          primaryId: input.primaryId,
          primaryWaChatId: input.primaryWaChatId ?? null,
          secondaryIds: input.secondaryIds,
          secondarySnapshots: input.secondarySnapshots ?? [],
          messagesMoved: input.messagesMoved,
        }),
        ip: "",
      },
    });
  } catch (e) {
    console.error("unify_audit_failed", e);
  }
}

/**
 * Merge all conversations owned by traderId into the WhatsApp-primary one.
 * Idempotent: if only one conversation exists, no-op success.
 */
export async function unifyTraderConversations(
  traderId: string,
  opts: {
    dryRun?: boolean;
    db?: DbClient;
    /** Test-only: throw inside the transaction after message moves (proves rollback). */
    __testAbortAfter?: "messages";
  } = {}
): Promise<UnifyResult> {
  const db = opts.db ?? defaultPrisma;
  const dryRun = Boolean(opts.dryRun);

  const rows = await db.whatsAppConversation.findMany({
    where: { traderId },
    select: {
      id: true,
      waChatId: true,
      remoteJid: true,
      participantE164: true,
      displayName: true,
      unreadCount: true,
      traderUnreadCount: true,
      lastMessageAt: true,
      lastMessagePreview: true,
      tags: true,
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (rows.length === 0) {
    return {
      ok: true,
      dryRun: true,
      traderId,
      primaryId: null,
      secondaryIds: [],
      messageMoveCount: 0,
      wouldDelete: [],
      skippedReason: "no_conversations",
    };
  }

  if (rows.length === 1) {
    return {
      ok: true,
      dryRun: true,
      traderId,
      primaryId: rows[0]!.id,
      secondaryIds: [],
      messageMoveCount: 0,
      wouldDelete: [],
      skippedReason: "already_single",
    };
  }

  const ranked = [...rows].sort((a, b) => {
    const ds = scoreWhatsAppPrimary(b.waChatId) - scoreWhatsAppPrimary(a.waChatId);
    if (ds !== 0) return ds;
    const ta = a.lastMessageAt?.getTime() ?? 0;
    const tb = b.lastMessageAt?.getTime() ?? 0;
    return tb - ta;
  });
  const primary = ranked[0]!;
  const secondaries = ranked.slice(1);

  let messageMoveCount = 0;
  for (const s of secondaries) {
    messageMoveCount += s._count.messages;
  }

  if (dryRun) {
    await writeUnifyAudit({
      db,
      primaryId: primary.id,
      primaryWaChatId: primary.waChatId,
      secondaryIds: secondaries.map((s) => s.id),
      secondarySnapshots: secondaries.map((s) => ({
        id: s.id,
        waChatId: s.waChatId,
        remoteJid: s.remoteJid,
        participantE164: s.participantE164,
        displayName: s.displayName,
        tags: s.tags,
        unreadCount: s.unreadCount,
        traderUnreadCount: s.traderUnreadCount,
        messageCount: s._count.messages,
        movedMessageIds: [],
      })),
      traderId,
      messagesMoved: messageMoveCount,
      dryRun: true,
    });
    return {
      ok: true,
      dryRun: true,
      traderId,
      primaryId: primary.id,
      secondaryIds: secondaries.map((s) => s.id),
      messageMoveCount,
      wouldDelete: secondaries.map((s) => s.id),
    };
  }

  const result = await db.$transaction(async (tx) => {
    let moved = 0;
    let unreadSum = primary.unreadCount;
    let traderUnreadSum = primary.traderUnreadCount;
    let lastAt = primary.lastMessageAt;
    let lastPreview = primary.lastMessagePreview;
    const secondarySnapshots: UnifySecondarySnapshot[] = [];

    for (const s of secondaries) {
      const msgRows = await tx.whatsAppMessage.findMany({
        where: { conversationId: s.id },
        select: { id: true },
      });
      const movedMessageIds = msgRows.map((m) => m.id);
      secondarySnapshots.push({
        id: s.id,
        waChatId: s.waChatId,
        remoteJid: s.remoteJid,
        participantE164: s.participantE164,
        displayName: s.displayName,
        tags: s.tags,
        unreadCount: s.unreadCount,
        traderUnreadCount: s.traderUnreadCount,
        messageCount: msgRows.length,
        movedMessageIds,
      });

      const upd = await tx.whatsAppMessage.updateMany({
        where: { conversationId: s.id },
        data: { conversationId: primary.id },
      });
      moved += upd.count;
      unreadSum += s.unreadCount;
      traderUnreadSum += s.traderUnreadCount;
      if (
        s.lastMessageAt &&
        (!lastAt || s.lastMessageAt.getTime() > lastAt.getTime())
      ) {
        lastAt = s.lastMessageAt;
        lastPreview = s.lastMessagePreview;
      }
      if (opts.__testAbortAfter === "messages") {
        throw new Error("TEST_ABORT_MERGE");
      }
      // Re-point children before delete (cascade would drop them).
      await tx.whatsAppConversationNote.updateMany({
        where: { conversationId: s.id },
        data: { conversationId: primary.id },
      });
      await tx.whatsAppLinkAudit.updateMany({
        where: { conversationId: s.id },
        data: { conversationId: primary.id },
      });
      await tx.whatsAppComposerDraft.updateMany({
        where: { conversationId: s.id },
        data: { conversationId: primary.id },
      });
      await tx.whatsAppPhoneRevealAudit.updateMany({
        where: { conversationId: s.id },
        data: { conversationId: primary.id },
      });
      await tx.whatsAppConversation.delete({ where: { id: s.id } });
    }

    const mergedTags = Array.from(
      new Set([...primary.tags, ...secondaries.flatMap((s) => s.tags)])
    );

    await tx.whatsAppConversation.update({
      where: { id: primary.id },
      data: {
        unreadCount: unreadSum,
        traderUnreadCount: traderUnreadSum,
        lastMessageAt: lastAt,
        lastMessagePreview: lastPreview,
        traderId,
        tags: mergedTags,
      },
    });

    return { moved, secondarySnapshots };
  });

  await writeUnifyAudit({
    db,
    primaryId: primary.id,
    primaryWaChatId: primary.waChatId,
    secondaryIds: secondaries.map((s) => s.id),
    secondarySnapshots: result.secondarySnapshots,
    traderId,
    messagesMoved: result.moved,
    dryRun: false,
  });

  void publishInboxEvent("conversation.updated", {
    conversationId: primary.id,
    preview: "unified",
  });

  return {
    ok: true,
    dryRun: false,
    traderId,
    primaryId: primary.id,
    mergedSecondaryIds: secondaries.map((s) => s.id),
    messagesMoved: result.moved,
  };
}

/**
 * Set traderId on a conversation when E.164 maps to exactly one trader,
 * then unify. Idempotent. Never links empty/shared phones.
 */
export async function autoLinkConversationByResolvedPhone(
  input: {
    conversationId: string;
    participantE164: string | null | undefined;
  },
  db: DbClient = defaultPrisma
): Promise<{ linked: boolean; traderId: string | null; unified?: UnifyResult }> {
  const traderId = await findUniqueTraderIdByPhone(input.participantE164, db);
  if (!traderId) return { linked: false, traderId: null };

  const row = await db.whatsAppConversation.findUnique({
    where: { id: input.conversationId },
    select: { id: true, traderId: true, waChatId: true },
  });
  if (!row) return { linked: false, traderId: null };

  // Do not steal a conversation already owned by a different trader.
  if (row.traderId && row.traderId !== traderId) {
    return { linked: false, traderId: null };
  }

  if (!row.traderId) {
    await db.whatsAppConversation.update({
      where: { id: row.id },
      data: {
        traderId,
        participantE164: toE164Digits(input.participantE164 || "") || undefined,
      },
    });
  }

  const unified = await unifyTraderConversations(traderId, { db });
  return { linked: true, traderId, unified };
}

/**
 * After an admin manually links a conversation to a trader — same unify path.
 */
export async function onTraderLinkedToConversation(
  input: { conversationId: string; traderId: string },
  db: DbClient = defaultPrisma
): Promise<UnifyResult> {
  return unifyTraderConversations(input.traderId, { db });
}

/**
 * Read-only preview for the admin confirm dialog before a manual trader CRM link.
 * Assumes the conversation will be owned by traderId after the link.
 */
export async function previewManualTraderLink(
  input: { conversationId: string; traderId: string },
  db: DbClient = defaultPrisma
): Promise<{
  wouldMerge: boolean;
  conversationCount: number;
  secondaryCount: number;
  messageMoveCount: number;
  primaryWaChatId: string | null;
  primaryId: string | null;
}> {
  const conversationId = input.conversationId.trim();
  const traderId = input.traderId.trim();
  if (!conversationId || !traderId) {
    return {
      wouldMerge: false,
      conversationCount: 0,
      secondaryCount: 0,
      messageMoveCount: 0,
      primaryWaChatId: null,
      primaryId: null,
    };
  }

  const [current, owned] = await Promise.all([
    db.whatsAppConversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        waChatId: true,
        traderId: true,
        lastMessageAt: true,
        _count: { select: { messages: true } },
      },
    }),
    db.whatsAppConversation.findMany({
      where: { traderId },
      select: {
        id: true,
        waChatId: true,
        lastMessageAt: true,
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const byId = new Map(owned.map((r) => [r.id, r]));
  if (current && current.traderId !== traderId) {
    byId.set(current.id, {
      id: current.id,
      waChatId: current.waChatId,
      lastMessageAt: current.lastMessageAt,
      _count: current._count,
    });
  } else if (current && !byId.has(current.id)) {
    byId.set(current.id, {
      id: current.id,
      waChatId: current.waChatId,
      lastMessageAt: current.lastMessageAt,
      _count: current._count,
    });
  }

  const rows = [...byId.values()];
  if (rows.length <= 1) {
    return {
      wouldMerge: false,
      conversationCount: rows.length,
      secondaryCount: 0,
      messageMoveCount: 0,
      primaryWaChatId: rows[0]?.waChatId ?? null,
      primaryId: rows[0]?.id ?? null,
    };
  }

  const ranked = [...rows].sort((a, b) => {
    const ds = scoreWhatsAppPrimary(b.waChatId) - scoreWhatsAppPrimary(a.waChatId);
    if (ds !== 0) return ds;
    return (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0);
  });
  const primary = ranked[0]!;
  const secondaries = ranked.slice(1);
  return {
    wouldMerge: true,
    conversationCount: rows.length,
    secondaryCount: secondaries.length,
    messageMoveCount: secondaries.reduce((n, s) => n + s._count.messages, 0),
    primaryWaChatId: primary.waChatId,
    primaryId: primary.id,
  };
}

/**
 * Production / ops dry-run counts — read-only (no audit rows, no merges).
 * Expect 0 mergesNeeded on a clean prod before any LID→phone unify wave.
 */
export async function dryRunUnifyAllTraders(
  db: DbClient = defaultPrisma
): Promise<{
  tradersChecked: number;
  mergesNeeded: number;
  details: Array<{
    traderId: string;
    secondaryCount: number;
    messageMoveCount: number;
    primaryWaChatId: string | null;
  }>;
}> {
  const grouped = await db.whatsAppConversation.groupBy({
    by: ["traderId"],
    where: { traderId: { not: null } },
    _count: { _all: true },
  });
  const multi = grouped.filter((g) => g.traderId && g._count._all > 1);
  const details: Array<{
    traderId: string;
    secondaryCount: number;
    messageMoveCount: number;
    primaryWaChatId: string | null;
  }> = [];

  for (const g of multi) {
    const traderId = g.traderId!;
    const rows = await db.whatsAppConversation.findMany({
      where: { traderId },
      select: {
        id: true,
        waChatId: true,
        lastMessageAt: true,
        _count: { select: { messages: true } },
      },
    });
    if (rows.length < 2) continue;
    const ranked = [...rows].sort((a, b) => {
      const ds = scoreWhatsAppPrimary(b.waChatId) - scoreWhatsAppPrimary(a.waChatId);
      if (ds !== 0) return ds;
      const ta = a.lastMessageAt?.getTime() ?? 0;
      const tb = b.lastMessageAt?.getTime() ?? 0;
      return tb - ta;
    });
    const primary = ranked[0]!;
    const secondaries = ranked.slice(1);
    details.push({
      traderId,
      secondaryCount: secondaries.length,
      messageMoveCount: secondaries.reduce((n, s) => n + s._count.messages, 0),
      primaryWaChatId: primary.waChatId,
    });
  }

  return {
    tradersChecked: grouped.filter((g) => g.traderId).length,
    mergesNeeded: details.length,
    details,
  };
}
