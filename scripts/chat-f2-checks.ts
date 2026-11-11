/**
 * CHAT-F2 unify — isolated DB only (no real customers).
 *   npx tsx scripts/chat-f2-checks.ts
 *
 * Covers: WA primary scoring, merge platform+LID→phone, empty phone no-link,
 * shared phone no-link, ensureTraderConversation collapse, dry-run counts.
 */
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createIsolatedDb } from "./lib/isolated-db";
import { ensureTraderConversation } from "../lib/whatsapp/messaging/trader-channel";
import {
  autoLinkConversationByResolvedPhone,
  dryRunUnifyAllTraders,
  findUniqueTraderIdByPhone,
  scoreWhatsAppPrimary,
  unifyTraderConversations,
} from "../lib/whatsapp/messaging/trader-unify";

let passed = 0;
let failed = 0;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    failed += 1;
    console.error(`FAIL: ${msg}`);
    throw new Error(msg);
  }
  passed += 1;
  console.log(`PASS: ${msg}`);
}

async function main() {
  assert(scoreWhatsAppPrimary("966500000111@s.whatsapp.net") > scoreWhatsAppPrimary("123@lid"), "phone JID beats LID");
  assert(scoreWhatsAppPrimary("123@lid") > scoreWhatsAppPrimary("trader-x@platform.local"), "LID beats platform.local");

  const isolated = await createIsolatedDb("chat-f2");
  const prisma = new PrismaClient({ datasources: { db: { url: isolated.url } } });
  try {
    const stamp = randomUUID().slice(0, 8);
    const phone = "+966500000222";

    const trader = await prisma.traderAccount.create({
      data: {
        email: `f2-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "تاجر دمج",
        phone,
        companyName: "F2 Co",
        status: "active",
      },
    });

    // Three threads owned by the same trader: platform shell, LID inbound, phone JID.
    const platform = await prisma.whatsAppConversation.create({
      data: {
        waChatId: `trader-${trader.id}@platform.local`,
        remoteJid: `trader-${trader.id}@platform.local`,
        displayName: trader.displayName,
        traderId: trader.id,
        tags: ["shell"],
      },
    });
    const lid = await prisma.whatsAppConversation.create({
      data: {
        waChatId: "191302842994872@lid",
        remoteJid: "191302842994872@lid",
        participantE164: "966500000222",
        displayName: "LID inbound",
        traderId: trader.id,
        unreadCount: 2,
        tags: ["lid"],
      },
    });
    const phoneJid = await prisma.whatsAppConversation.create({
      data: {
        waChatId: "966500000222@s.whatsapp.net",
        remoteJid: "966500000222@s.whatsapp.net",
        participantE164: "966500000222",
        displayName: "Phone JID",
        traderId: trader.id,
        unreadCount: 1,
        tags: ["phone"],
      },
    });

    await prisma.whatsAppMessage.createMany({
      data: [
        {
          conversationId: platform.id,
          direction: "outbound",
          channel: "platform",
          body: "منصة",
          status: "sent",
        },
        {
          conversationId: lid.id,
          direction: "inbound",
          channel: "whatsapp",
          body: "وارد LID",
          status: "received",
        },
        {
          conversationId: phoneJid.id,
          direction: "inbound",
          channel: "whatsapp",
          body: "وارد هاتف",
          status: "received",
        },
      ],
    });
    await prisma.whatsAppConversationNote.create({
      data: {
        conversationId: lid.id,
        authorAdminId: "admin-test",
        authorName: "Admin",
        body: "ملاحظة على LID",
      },
    });

    const dry = await unifyTraderConversations(trader.id, { dryRun: true, db: prisma });
    assert(dry.ok && dry.dryRun, "dry-run ok");
    assert(dry.primaryId === phoneJid.id, "dry-run picks phone JID as primary");
    assert(dry.secondaryIds.length === 2, "dry-run lists two secondaries");
    assert(dry.messageMoveCount === 2, "dry-run counts messages on secondaries");

    const beforeCount = await prisma.whatsAppConversation.count({
      where: { traderId: trader.id },
    });
    assert(beforeCount === 3, "three conversations before merge");

    const merged = await unifyTraderConversations(trader.id, { db: prisma });
    assert(merged.ok && !merged.dryRun, "merge ok");
    assert(merged.primaryId === phoneJid.id, "merge keeps phone JID primary");
    assert(merged.messagesMoved === 2, "two messages moved onto primary");

    const mergeAudit = await prisma.adminAuditLog.findFirst({
      where: { action: "whatsapp.unify_merge" },
      orderBy: { createdAt: "desc" },
    });
    assert(mergeAudit, "unify_merge audit row written");
    const meta = JSON.parse(mergeAudit!.metaJson) as {
      primaryWaChatId?: string;
      secondarySnapshots?: Array<{
        waChatId: string;
        remoteJid: string;
        movedMessageIds: string[];
        messageCount: number;
        tags: string[];
      }>;
    };
    assert(
      meta.primaryWaChatId === "966500000222@s.whatsapp.net",
      "audit stores primaryWaChatId"
    );
    assert(
      Array.isArray(meta.secondarySnapshots) && meta.secondarySnapshots.length === 2,
      "audit stores secondarySnapshots"
    );
    assert(
      meta.secondarySnapshots!.every(
        (s) =>
          typeof s.waChatId === "string" &&
          typeof s.remoteJid === "string" &&
          Array.isArray(s.movedMessageIds) &&
          s.movedMessageIds.length === s.messageCount
      ),
      "each secondary snapshot has waChatId/remoteJid/movedMessageIds"
    );

    const afterRows = await prisma.whatsAppConversation.findMany({
      where: { traderId: trader.id },
      select: { id: true, waChatId: true, unreadCount: true, tags: true },
    });
    assert(afterRows.length === 1, "only primary remains");
    assert(afterRows[0]!.id === phoneJid.id, "surviving id is phone JID");
    assert(afterRows[0]!.unreadCount === 3, "unread counts summed");
    assert(
      afterRows[0]!.tags.includes("shell") &&
        afterRows[0]!.tags.includes("lid") &&
        afterRows[0]!.tags.includes("phone"),
      "tags merged"
    );

    const msgs = await prisma.whatsAppMessage.findMany({
      where: { conversationId: phoneJid.id },
      select: { body: true },
    });
    assert(msgs.length === 3, "all three messages on primary");
    assert(
      msgs.some((m) => m.body === "منصة") && msgs.some((m) => m.body === "وارد LID"),
      "platform + LID bodies preserved"
    );
    const note = await prisma.whatsAppConversationNote.findFirst({
      where: { conversationId: phoneJid.id },
    });
    assert(note?.body === "ملاحظة على LID", "note re-pointed to primary");

    // ensureTraderConversation returns the unified primary (idempotent).
    const ens = await ensureTraderConversation(trader.id, prisma);
    assert(ens.id === phoneJid.id && !ens.phoneConflict, "ensure returns unified primary");

    // Empty phone never unique-matches / auto-links.
    const empty = await prisma.traderAccount.create({
      data: {
        email: `empty-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "فارغ",
        phone: "",
        companyName: "E",
        status: "active",
      },
    });
    assert(
      (await findUniqueTraderIdByPhone("", prisma)) === null,
      "empty e164 → no trader"
    );
    assert(
      (await findUniqueTraderIdByPhone("   ", prisma)) === null,
      "whitespace e164 → no trader"
    );
    const orphanLid = await prisma.whatsAppConversation.create({
      data: {
        waChatId: "999888777666@lid",
        remoteJid: "999888777666@lid",
        participantE164: null,
        displayName: "orphan",
      },
    });
    const noLink = await autoLinkConversationByResolvedPhone(
      { conversationId: orphanLid.id, participantE164: null },
      prisma
    );
    assert(!noLink.linked, "null phone does not auto-link");

    // Shared phone (two traders) → no unique match → no steal.
    const sharedPhone = "+966500000333";
    const t1 = await prisma.traderAccount.create({
      data: {
        email: `s1-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "مشترك١",
        phone: sharedPhone,
        companyName: "S1",
        status: "active",
      },
    });
    await prisma.traderAccount.create({
      data: {
        email: `s2-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "مشترك٢",
        phone: sharedPhone,
        companyName: "S2",
        status: "active",
      },
    });
    assert(
      (await findUniqueTraderIdByPhone("966500000333", prisma)) === null,
      "shared phone → no unique trader"
    );
    const waShared = await prisma.whatsAppConversation.create({
      data: {
        waChatId: "966500000333@s.whatsapp.net",
        remoteJid: "966500000333@s.whatsapp.net",
        participantE164: "966500000333",
        displayName: "shared",
      },
    });
    const sharedLink = await autoLinkConversationByResolvedPhone(
      { conversationId: waShared.id, participantE164: "966500000333" },
      prisma
    );
    assert(!sharedLink.linked, "shared phone does not auto-link");
    const stillUnowned = await prisma.whatsAppConversation.findUnique({
      where: { id: waShared.id },
      select: { traderId: true },
    });
    assert(stillUnowned?.traderId == null, "shared-phone WA thread stays unowned");

    // Unique phone does auto-link + unify with existing platform shell.
    const uniquePhone = "+966500000444";
    const tu = await prisma.traderAccount.create({
      data: {
        email: `u-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "فريد",
        phone: uniquePhone,
        companyName: "U",
        status: "active",
      },
    });
    // ensure with a real phone claims digits@s.whatsapp.net (score 300).
    const phoneThread = await ensureTraderConversation(tu.id, prisma);
    const phoneRow = await prisma.whatsAppConversation.findUnique({
      where: { id: phoneThread.id },
      select: { waChatId: true },
    });
    assert(
      phoneRow?.waChatId === "966500000444@s.whatsapp.net",
      "ensure claims phone JID when trader phone is set"
    );
    const lidU = await prisma.whatsAppConversation.create({
      data: {
        waChatId: "555444333222@lid",
        remoteJid: "555444333222@lid",
        participantE164: "966500000444",
        displayName: "LID unique",
      },
    });
    const linked = await autoLinkConversationByResolvedPhone(
      { conversationId: lidU.id, participantE164: "966500000444" },
      prisma
    );
    assert(linked.linked && linked.traderId === tu.id, "unique phone auto-links");
    const afterLink = await prisma.whatsAppConversation.findMany({
      where: { traderId: tu.id },
      select: { id: true, waChatId: true },
    });
    assert(afterLink.length === 1, "auto-link unify collapses to one thread");
    // Phone JID (300) beats LID (200).
    assert(
      afterLink[0]!.waChatId === "966500000444@s.whatsapp.net",
      "phone JID preferred over LID after auto-link unify"
    );
    assert(afterLink[0]!.id === phoneThread.id, "surviving id is the phone thread");

    // Dry-run counts: after merges, only traders with multi left should be counted.
    // Create a deliberate multi without merging for the counter.
    const multiT = await prisma.traderAccount.create({
      data: {
        email: `m-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "عداد",
        phone: "+966500000555",
        companyName: "M",
        status: "active",
      },
    });
    await prisma.whatsAppConversation.create({
      data: {
        waChatId: `trader-${multiT.id}@platform.local`,
        remoteJid: `trader-${multiT.id}@platform.local`,
        traderId: multiT.id,
      },
    });
    await prisma.whatsAppConversation.create({
      data: {
        waChatId: "966500000555@s.whatsapp.net",
        remoteJid: "966500000555@s.whatsapp.net",
        traderId: multiT.id,
        participantE164: "966500000555",
      },
    });
    const counts = await dryRunUnifyAllTraders(prisma);
    assert(counts.mergesNeeded >= 1, "dry-run counts at least one merge needed");
    assert(
      counts.details.some((d) => d.traderId === multiT.id && d.secondaryCount === 1),
      "dry-run details include the multi trader"
    );
    // Ensure count path did not write unify audit for dry-run-all.
    const auditBeforeCounts = await prisma.adminAuditLog.count({
      where: { action: { in: ["whatsapp.unify_dry_run", "whatsapp.unify_merge"] } },
    });
    await dryRunUnifyAllTraders(prisma);
    const auditAfterCounts = await prisma.adminAuditLog.count({
      where: { action: { in: ["whatsapp.unify_dry_run", "whatsapp.unify_merge"] } },
    });
    assert(
      auditAfterCounts === auditBeforeCounts,
      "dryRunUnifyAllTraders is read-only (no audit writes)"
    );

    // --- Mid-merge abort: transaction rolls back; nothing stays moved ---
    const abortT = await prisma.traderAccount.create({
      data: {
        email: `abort-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "إلغاء منتصف",
        phone: "+966500000666",
        companyName: "Abort",
        status: "active",
      },
    });
    const abortPrimary = await prisma.whatsAppConversation.create({
      data: {
        waChatId: "966500000666@s.whatsapp.net",
        remoteJid: "966500000666@s.whatsapp.net",
        traderId: abortT.id,
        unreadCount: 1,
        tags: ["keep-primary"],
      },
    });
    const abortSecondary = await prisma.whatsAppConversation.create({
      data: {
        waChatId: `trader-${abortT.id}@platform.local`,
        remoteJid: `trader-${abortT.id}@platform.local`,
        traderId: abortT.id,
        unreadCount: 4,
        tags: ["keep-secondary"],
      },
    });
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: abortSecondary.id,
        direction: "outbound",
        channel: "platform",
        body: "يجب أن تبقى هنا بعد الفشل",
        status: "sent",
      },
    });
    await prisma.whatsAppConversationNote.create({
      data: {
        conversationId: abortSecondary.id,
        authorAdminId: "admin-test",
        authorName: "Admin",
        body: "ملاحظة ثانوية",
      },
    });
    const snapBefore = {
      convCount: await prisma.whatsAppConversation.count({
        where: { traderId: abortT.id },
      }),
      primaryMsgs: await prisma.whatsAppMessage.count({
        where: { conversationId: abortPrimary.id },
      }),
      secondaryMsgs: await prisma.whatsAppMessage.count({
        where: { conversationId: abortSecondary.id },
      }),
      secondaryNotes: await prisma.whatsAppConversationNote.count({
        where: { conversationId: abortSecondary.id },
      }),
      primaryUnread: (
        await prisma.whatsAppConversation.findUnique({
          where: { id: abortPrimary.id },
          select: { unreadCount: true, tags: true },
        })
      )!,
      secondaryUnread: (
        await prisma.whatsAppConversation.findUnique({
          where: { id: abortSecondary.id },
          select: { unreadCount: true, tags: true },
        })
      )!,
    };
    let aborted = false;
    try {
      await unifyTraderConversations(abortT.id, {
        db: prisma,
        __testAbortAfter: "messages",
      });
    } catch (e) {
      aborted = e instanceof Error && e.message === "TEST_ABORT_MERGE";
    }
    assert(aborted, "mid-merge throws TEST_ABORT_MERGE");
    assert(
      (await prisma.whatsAppConversation.count({
        where: { traderId: abortT.id },
      })) === snapBefore.convCount,
      "abort: conversation count unchanged"
    );
    assert(
      (await prisma.whatsAppMessage.count({
        where: { conversationId: abortSecondary.id },
      })) === snapBefore.secondaryMsgs,
      "abort: secondary messages still on secondary"
    );
    assert(
      (await prisma.whatsAppMessage.count({
        where: { conversationId: abortPrimary.id },
      })) === snapBefore.primaryMsgs,
      "abort: primary message count unchanged"
    );
    assert(
      (await prisma.whatsAppConversationNote.count({
        where: { conversationId: abortSecondary.id },
      })) === snapBefore.secondaryNotes,
      "abort: notes still on secondary"
    );
    const afterAbortPrimary = await prisma.whatsAppConversation.findUnique({
      where: { id: abortPrimary.id },
      select: { unreadCount: true, tags: true },
    });
    const afterAbortSecondary = await prisma.whatsAppConversation.findUnique({
      where: { id: abortSecondary.id },
      select: { unreadCount: true, tags: true },
    });
    assert(
      afterAbortPrimary?.unreadCount === snapBefore.primaryUnread.unreadCount &&
        afterAbortSecondary?.unreadCount ===
          snapBefore.secondaryUnread.unreadCount,
      "abort: unread counts unchanged"
    );
    assert(
      JSON.stringify(afterAbortPrimary?.tags) ===
        JSON.stringify(snapBefore.primaryUnread.tags) &&
        JSON.stringify(afterAbortSecondary?.tags) ===
          JSON.stringify(snapBefore.secondaryUnread.tags),
      "abort: tags unchanged"
    );

    // --- Guards: no traderId orphans; never steal another trader ---
    const orphan = await prisma.whatsAppConversation.create({
      data: {
        waChatId: "111222333444@lid",
        remoteJid: "111222333444@lid",
        participantE164: "966500000777",
        displayName: "orphan LID",
      },
    });
    const unifyOrphanOwner = await unifyTraderConversations(abortT.id, {
      dryRun: true,
      db: prisma,
    });
    assert(
      unifyOrphanOwner.ok &&
        unifyOrphanOwner.dryRun &&
        !unifyOrphanOwner.secondaryIds.includes(orphan.id) &&
        unifyOrphanOwner.primaryId !== orphan.id,
      "unify for a trader never includes traderId=null conversations"
    );

    const otherTrader = await prisma.traderAccount.create({
      data: {
        email: `other-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "تاجر آخر",
        phone: "+966500000777",
        companyName: "Other",
        status: "active",
      },
    });
    await prisma.whatsAppConversation.update({
      where: { id: orphan.id },
      data: { traderId: otherTrader.id },
    });
    const steal = await autoLinkConversationByResolvedPhone(
      { conversationId: orphan.id, participantE164: "966500000777" },
      prisma
    );
    // Unique phone matches otherTrader who already owns it — linked true is OK,
    // but a different trader must never be assigned. Create a third party attempt:
    const strangerLid = await prisma.whatsAppConversation.create({
      data: {
        waChatId: "999000111222@lid",
        remoteJid: "999000111222@lid",
        participantE164: "966500000666",
        traderId: otherTrader.id,
        displayName: "owned by other",
      },
    });
    const noSteal = await autoLinkConversationByResolvedPhone(
      {
        conversationId: strangerLid.id,
        participantE164: "966500000666", // unique → abortT
      },
      prisma
    );
    assert(!noSteal.linked, "auto-link refuses conversation owned by another trader");
    const stillOther = await prisma.whatsAppConversation.findUnique({
      where: { id: strangerLid.id },
      select: { traderId: true },
    });
    assert(
      stillOther?.traderId === otherTrader.id,
      "other trader keeps ownership after refused auto-link"
    );

    // unify(abortT) must not delete/move otherTrader's conversation
    const otherBefore = await prisma.whatsAppConversation.findUnique({
      where: { id: strangerLid.id },
      select: { id: true, traderId: true, _count: { select: { messages: true } } },
    });
    await unifyTraderConversations(abortT.id, { db: prisma });
    const otherAfter = await prisma.whatsAppConversation.findUnique({
      where: { id: strangerLid.id },
      select: { id: true, traderId: true, _count: { select: { messages: true } } },
    });
    assert(
      otherAfter?.traderId === otherBefore?.traderId &&
        otherAfter?._count.messages === otherBefore?._count.messages,
      "unify never merges or mutates another trader's conversation"
    );

    void empty;
    void t1;
    void steal;
  } finally {
    await prisma.$disconnect();
    await isolated.cleanup();
  }

  console.log(`\nchat-f2-checks: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
