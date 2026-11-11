/**
 * CHAT-F1 regression — isolated SQLite only (no real customers).
 *   npx tsx scripts/chat-f1-checks.ts
 *
 * Covers: same-phone isolation, IDOR cursor/send ownership, rate limit,
 * mark-read, platform fallback channel flag on action return shape (unit).
 */
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createIsolatedDb } from "./lib/isolated-db";
import {
  ensureTraderConversation,
  getTraderConversation,
  getTraderConversationCursor,
  markTraderMessagesRead,
  sendAdminPlatformMessage,
  sendTraderPlatformMessage,
  PHONE_CONFLICT_TAG,
} from "../lib/whatsapp/messaging/trader-channel";
import {
  checkTraderSendRateLimit,
  resetTraderSendRateLimitForTests,
} from "../lib/whatsapp/messaging/trader-send-rate-limit";
import {
  e164FromRemoteJid,
  normalizeUserJid,
} from "../lib/whatsapp/jid";

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
  const isolated = await createIsolatedDb("chat-f1");
  const prisma = new PrismaClient({ datasources: { db: { url: isolated.url } } });
  try {
    const phone = "+966500000111";
    const stamp = randomUUID().slice(0, 8);
    const traderA = await prisma.traderAccount.create({
      data: {
        email: `a-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "تاجر أ",
        phone,
        companyName: "A Co",
        status: "active",
      },
    });
    const traderB = await prisma.traderAccount.create({
      data: {
        email: `b-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "تاجر ب",
        phone, // same phone — pollution scenario
        companyName: "B Co",
        status: "active",
      },
    });

    const a = await ensureTraderConversation(traderA.id, prisma);
    assert(!a.phoneConflict, "first trader claims phone JID without conflict");

    const aSend = await sendTraderPlatformMessage(
      { traderId: traderA.id, text: "من أ" },
      prisma
    );
    assert(aSend.ok, "trader A can send");

    const b = await ensureTraderConversation(traderB.id, prisma);
    assert(b.phoneConflict, "second trader with same phone gets conflict + isolate");
    assert(b.id !== a.id, "second trader must NOT share conversation id");

    const claimed = await prisma.whatsAppConversation.findUnique({
      where: { id: a.id },
      select: { tags: true, traderId: true },
    });
    assert(
      claimed?.tags.includes(PHONE_CONFLICT_TAG),
      "claimed thread tagged phone-conflict"
    );
    assert(claimed?.traderId === traderA.id, "claimed thread still owned by A");

    const isolated = await prisma.whatsAppConversation.findUnique({
      where: { id: b.id },
      select: { tags: true, traderId: true, waChatId: true },
    });
    assert(isolated?.traderId === traderB.id, "isolated thread owned by B");
    assert(
      isolated?.waChatId === `trader-${traderB.id}@platform.local`,
      "isolated uses platform.local JID"
    );
    assert(
      isolated?.tags.includes(PHONE_CONFLICT_TAG),
      "isolated thread tagged phone-conflict"
    );

    const bSend = await sendTraderPlatformMessage(
      { traderId: traderB.id, text: "من ب — معزول" },
      prisma
    );
    assert(bSend.ok && bSend.conversationId === b.id, "B writes only to isolated");

    const aMsgs = await getTraderConversation(traderA.id, prisma);
    const bMsgs = await getTraderConversation(traderB.id, prisma);
    assert(
      aMsgs?.messages.every((m) => m.body !== "من ب — معزول"),
      "IDOR: A must not see B body"
    );
    assert(
      bMsgs?.messages.every((m) => m.body !== "من أ"),
      "IDOR: B must not see A body"
    );

    const aCursor = await getTraderConversationCursor(traderA.id, prisma);
    const bCursor = await getTraderConversationCursor(traderB.id, prisma);
    assert(
      aCursor?.conversationId === a.id && bCursor?.conversationId === b.id,
      "cursor routes are trader-scoped"
    );

    // Cross-tenant: B cannot mark/read A's conversation via own id path
    await sendAdminPlatformMessage(
      { conversationId: a.id, adminId: "admin-test", text: "رد للإدارة إلى أ" },
      prisma
    );
    await markTraderMessagesRead(traderB.id, prisma);
    const aAfter = await prisma.whatsAppConversation.findUnique({
      where: { id: a.id },
      select: { traderUnreadCount: true },
    });
    assert(
      (aAfter?.traderUnreadCount ?? 0) > 0,
      "IDOR: B mark-read must not clear A's unread"
    );
    await markTraderMessagesRead(traderA.id, prisma);
    const aCleared = await prisma.whatsAppConversation.findUnique({
      where: { id: a.id },
      select: { traderUnreadCount: true },
    });
    assert(aCleared?.traderUnreadCount === 0, "A opening thread clears unread");

    const platformOut = await prisma.whatsAppMessage.findFirst({
      where: {
        conversationId: a.id,
        direction: "outbound",
        channel: "platform",
      },
      select: { status: true },
    });
    assert(platformOut?.status === "read", "platform outbound → read on open");

    resetTraderSendRateLimitForTests();
    let limited = false;
    for (let i = 0; i < 25; i++) {
      const r = checkTraderSendRateLimit(traderA.id);
      if (!r.ok) {
        limited = true;
        break;
      }
    }
    assert(limited, "rate limit trips around 20/min");

    // One conversation per traderId (app-level)
    const again = await ensureTraderConversation(traderA.id, prisma);
    assert(again.id === a.id, "ensure returns same conversation for traderId");

    // --- Empty / null phone safety (prod-shaped: never shared, never conflict, never WA JID) ---
    assert(normalizeUserJid("") === null, "empty string is not a WA JID");
    assert(normalizeUserJid("   ") === null, "whitespace is not a WA JID");
    assert(e164FromRemoteJid("trader-x@platform.local") === null, "platform.local is not a phone");
    assert(e164FromRemoteJid("191302842994872@lid") === null, "LID digits are not a phone");

    const emptyStamp = randomUUID().slice(0, 8);
    // Schema: TraderAccount.phone is String @default("") — never null in DB.
    const emptyPhoneCases: Array<{ email: string; phone: string; name: string }> = [
      { email: `blank-${emptyStamp}@test.local`, phone: "", name: "هاتف فارغ" },
      { email: `ws-${emptyStamp}@test.local`, phone: "   ", name: "مسافات فقط" },
      { email: `blank2-${emptyStamp}@test.local`, phone: "", name: "هاتف فارغ ٢" },
    ];
    const emptyConvIds: string[] = [];
    for (const c of emptyPhoneCases) {
      const t = await prisma.traderAccount.create({
        data: {
          email: c.email,
          passwordHash: "x",
          displayName: c.name,
          phone: c.phone,
          companyName: "Empty Co",
          status: "active",
        },
      });
      const ens = await ensureTraderConversation(t.id, prisma);
      assert(!ens.phoneConflict, `empty-phone trader "${c.name}" must not conflict`);
      const row = await prisma.whatsAppConversation.findUnique({
        where: { id: ens.id },
        select: { waChatId: true, tags: true, traderId: true, participantE164: true },
      });
      assert(
        row?.waChatId === `trader-${t.id}@platform.local`,
        `empty-phone "${c.name}" uses platform.local isolation`
      );
      assert(
        !row?.tags.includes(PHONE_CONFLICT_TAG),
        `empty-phone "${c.name}" must not get phone-conflict tag`
      );
      assert(row?.traderId === t.id, `empty-phone "${c.name}" owns own thread`);
      assert(
        !row?.participantE164,
        `empty-phone "${c.name}" must not invent participantE164`
      );
      emptyConvIds.push(ens.id);
    }
    assert(
      new Set(emptyConvIds).size === emptyConvIds.length,
      "null/empty/whitespace phones must never share one conversation"
    );
  } finally {
    await prisma.$disconnect();
    await isolated.cleanup();
  }

  console.log(`\nchat-f1-checks: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
