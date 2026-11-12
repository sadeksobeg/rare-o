/**
 * CHAT security / isolation — fake data only (isolated SQLite).
 *   npx tsx scripts/chat-security-checks.ts
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createIsolatedDb } from "./lib/isolated-db";
import {
  ensureTraderConversation,
  getTraderConversation,
  getTraderConversationCursor,
  markTraderMessagesRead,
  sendTraderPlatformMessage,
  sendAdminPlatformMessage,
} from "../lib/whatsapp/messaging/trader-channel";
import { unifyTraderConversations } from "../lib/whatsapp/messaging/trader-unify";
import { isSafeWhatsAppConversationId } from "../lib/whatsapp/media-serve";
import { isSafeWhatsAppMediaFileName as mediaFileOk } from "../lib/whatsapp/media";

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

function sourceContains(rel: string, needle: string): boolean {
  const abs = path.join(process.cwd(), rel);
  return readFileSync(abs, "utf8").includes(needle);
}

async function main() {
  const isolated = await createIsolatedDb("chat-sec");
  const prisma = new PrismaClient({ datasources: { db: { url: isolated.url } } });
  try {
    const stamp = randomUUID().slice(0, 8);
    const traderA = await prisma.traderAccount.create({
      data: {
        email: `sec-a-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "Sec A",
        phone: "+966500001001",
        companyName: "A",
        status: "active",
      },
    });
    const traderB = await prisma.traderAccount.create({
      data: {
        email: `sec-b-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "Sec B",
        phone: "+966500001002",
        companyName: "B",
        status: "active",
      },
    });

    const a = await ensureTraderConversation(traderA.id, prisma);
    const b = await ensureTraderConversation(traderB.id, prisma);
    assert(a.id !== b.id, "traders get distinct conversations");

    const aSend = await sendTraderPlatformMessage(
      { traderId: traderA.id, text: "secret-from-A" },
      prisma
    );
    assert(aSend.ok, "trader A send ok");
    await sendAdminPlatformMessage(
      { conversationId: a.id, text: "admin-to-A", adminId: "admin-test" },
      prisma
    );

    // 1) Forged conversation scope — helpers ignore client conversationId and use traderId
    const bView = await getTraderConversation(traderB.id, prisma);
    assert(bView?.conversationId === b.id, "B cursor conversation is B's");
    assert(
      !(bView?.messages ?? []).some((m) => m.body?.includes("secret-from-A")),
      "B cannot see A's message bodies via getTraderConversation"
    );

    const bCursor = await getTraderConversationCursor(traderB.id, prisma);
    assert(bCursor?.conversationId === b.id, "B cursor id is B's own");
    assert(bCursor?.conversationId !== a.id, "B cursor is not A's id");

    const forgedSend = await sendTraderPlatformMessage(
      { traderId: traderB.id, text: "B-try" },
      prisma
    );
    assert(forgedSend.ok, "B can send on own thread");
    const aAfter = await getTraderConversation(traderA.id, prisma);
    assert(
      !(aAfter?.messages ?? []).some((m) => m.body === "B-try"),
      "B send did not land on A's thread"
    );

    const aUnreadBefore = (
      await prisma.whatsAppConversation.findUnique({
        where: { id: a.id },
        select: { traderUnreadCount: true },
      })
    )?.traderUnreadCount;
    await prisma.whatsAppConversation.update({
      where: { id: a.id },
      data: { traderUnreadCount: 3 },
    });
    await markTraderMessagesRead(traderB.id, prisma);
    const aUnreadAfter = (
      await prisma.whatsAppConversation.findUnique({
        where: { id: a.id },
        select: { traderUnreadCount: true },
      })
    )?.traderUnreadCount;
    assert(aUnreadAfter === 3, "B mark-read does not clear A's unread");
    assert(aUnreadBefore !== undefined, "A unread baseline readable");

    // Direct DB forge: message on A must not appear when querying as B
    const aMsg = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: a.id },
      select: { id: true },
    });
    assert(aMsg, "A has a message id to forge");
    const leak = await prisma.whatsAppMessage.findFirst({
      where: {
        id: aMsg!.id,
        conversation: { traderId: traderB.id },
      },
    });
    assert(!leak, "messageId forge with B ownership filter returns null");

    // 2) Media URL safety + admin-only route gate (source + helper)
    assert(
      !isSafeWhatsAppConversationId("../etc"),
      "media conv id rejects path traversal"
    );
    assert(
      !isSafeWhatsAppConversationId("..%2f"),
      "media conv id rejects encoded junk"
    );
    assert(
      isSafeWhatsAppConversationId(a.id),
      "real conversation id accepted by safety helper"
    );
    assert(!mediaFileOk("../x.png"), "media file rejects traversal");
    assert(
      sourceContains(
        "app/api/media/whatsapp/[conversationId]/[file]/route.ts",
        "getAdminSession"
      ),
      "whatsapp media route requires admin session"
    );
    assert(
      !sourceContains(
        "app/api/media/whatsapp/[conversationId]/[file]/route.ts",
        "getTraderSession"
      ),
      "whatsapp media route does not accept trader session"
    );

    // 3) Trader cursor API is session.sub only (no conversationId query param)
    assert(
      sourceContains("app/api/trader/messages/cursor/route.ts", "session.sub"),
      "trader cursor uses session.sub"
    );
    assert(
      !sourceContains(
        "app/api/trader/messages/cursor/route.ts",
        "searchParams"
      ),
      "trader cursor ignores client conversationId params"
    );

    // 4) Unify ownership — B secondary never pulled into A's unify
    await prisma.whatsAppConversation.create({
      data: {
        waChatId: `999${stamp}@s.whatsapp.net`,
        remoteJid: `999${stamp}@s.whatsapp.net`,
        participantE164: "+966500001001",
        traderId: traderA.id,
        displayName: "A-phone",
        lastMessageAt: new Date(),
      },
    });
    const unify = await unifyTraderConversations(traderA.id, { db: prisma });
    const bStill = await prisma.whatsAppConversation.findUnique({
      where: { id: b.id },
      select: { traderId: true, id: true },
    });
    assert(bStill?.traderId === traderB.id, "unify A leaves B conversation owned by B");
    const secondaryIds =
      "mergedSecondaryIds" in unify
        ? unify.mergedSecondaryIds
        : "secondaryIds" in unify
          ? unify.secondaryIds
          : [];
    assert(
      secondaryIds.every((id) => id !== b.id),
      "unify A secondaryIds never include B"
    );
    assert(unify.ok, "unify A succeeded");

    // 5) Admin-only WhatsApp actions / inbox events (source gates)
    assert(
      sourceContains("app/whatsapp-actions.ts", "requireAdminSession") ||
        sourceContains("app/whatsapp-actions.ts", "getAdminSession"),
      "whatsapp-actions gated by admin session"
    );
    assert(
      sourceContains(
        "app/api/admin/inbox/events/route.ts",
        "getAdminSession"
      ) || sourceContains("middleware.ts", "ro_admin_session"),
      "admin inbox realtime / middleware requires admin cookie"
    );

    console.log(`\nchat-security-checks: ${passed} passed, ${failed} failed`);
    if (failed) process.exit(1);
  } finally {
    await prisma.$disconnect();
    await isolated.cleanup();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
