/**
 * W-F local drill (fake data): kill switch on → admin platform reply visible to trader.
 *   npx tsx scripts/chat-killswitch-drill.ts
 */
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createIsolatedDb } from "./lib/isolated-db";
import {
  ensureTraderConversation,
  sendAdminPlatformMessage,
  getTraderConversation,
} from "../lib/whatsapp/messaging/trader-channel";
import { setOutboundKillSwitch } from "../lib/whatsapp/messaging/outbound-kill-switch";

let passed = 0;
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
  passed += 1;
  console.log(`PASS: ${msg}`);
}

async function main() {
  const isolated = await createIsolatedDb("killswitch");
  const prisma = new PrismaClient({ datasources: { db: { url: isolated.url } } });
  // Point module prisma at isolated DB via DATABASE_URL already set by createIsolatedDb env?
  // setOutboundKillSwitch uses default prisma singleton — drive kill switch via DB row directly
  // then prove platform send path (always platform channel) under engaged flag.
  try {
    process.env.DATABASE_URL = isolated.url;
    await prisma.whatsAppConnectionHealth.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        state: "DISCONNECTED",
        outboundKillSwitch: true,
        outboundKillSwitchAt: new Date(),
        outboundKillSwitchBy: "drill@test.local",
        outboundKillSwitchReason: "W-F drill",
      },
      update: {
        outboundKillSwitch: true,
        outboundKillSwitchAt: new Date(),
        outboundKillSwitchBy: "drill@test.local",
        outboundKillSwitchReason: "W-F drill",
      },
    });
    const stamp = randomUUID().slice(0, 8);
    const trader = await prisma.traderAccount.create({
      data: {
        email: `ks-${stamp}@test.local`,
        passwordHash: "x",
        displayName: "KS",
        phone: "",
        companyName: "KS",
        status: "active",
      },
    });
    const conv = await ensureTraderConversation(trader.id, prisma);
    const health = await prisma.whatsAppConnectionHealth.findUnique({
      where: { id: "default" },
    });
    assert(health?.outboundKillSwitch === true, "kill switch engaged in DB");

    const sent = await sendAdminPlatformMessage(
      {
        conversationId: conv.id,
        adminId: "admin-drill",
        text: "platform-fallback-drill",
      },
      prisma
    );
    assert(sent.ok, "admin platform send ok under kill switch");
    const view = await getTraderConversation(trader.id, prisma);
    const msg = view?.messages.find((m) => m.body === "platform-fallback-drill");
    assert(msg, "trader sees platform message");
    assert(msg!.channel === "platform", "message channel is platform");
    assert(
      msg!.status === "sent" || msg!.status === "delivered" || msg!.status === "read",
      `status off clock (status=${msg!.status})`
    );

    // clear via API helper if singleton DB matches; else direct update
    try {
      await setOutboundKillSwitch(false, "DISCONNECTED", {
        by: "drill@test.local",
        reason: "clear",
      });
    } catch {
      /* singleton may point elsewhere in unit context */
    }
    await prisma.whatsAppConnectionHealth.update({
      where: { id: "default" },
      data: {
        outboundKillSwitch: false,
        outboundKillSwitchAt: null,
        outboundKillSwitchBy: null,
        outboundKillSwitchReason: null,
      },
    });
    const cleared = await prisma.whatsAppConnectionHealth.findUnique({
      where: { id: "default" },
    });
    assert(cleared?.outboundKillSwitch === false, "kill switch cleared");

    console.log(`\nchat-killswitch-drill: ${passed} passed`);
  } finally {
    await prisma.$disconnect();
    await isolated.cleanup();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
