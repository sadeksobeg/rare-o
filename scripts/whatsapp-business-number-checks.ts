/**
 * The wa.me handoff target follows the WhatsApp account linked in the admin
 * inbox (health.connectedPhone), falling back to WHATSAPP_BUSINESS_E164.
 * Run: npm run test:whatsapp-business-number
 */
import { prisma } from "@/lib/db/prisma";
import { WHATSAPP_CONNECTION_HEALTH_ID } from "@/lib/whatsapp/messaging/constants";
import { upsertConnectionHealth } from "@/lib/whatsapp/messaging/service";
import {
  clearBusinessNumberCacheForTests,
  resolveBusinessE164,
} from "@/lib/whatsapp/business-number";
import { prepareWhatsAppHandoff } from "@/lib/whatsapp/handoff-adapter";

let passed = 0;
let failed = 0;
const check = (c: unknown, m: string) => (c ? passed++ : (failed++, console.error(`FAIL: ${m}`)));

async function main() {
  process.env.WHATSAPP_BUSINESS_E164 = "+963900111222";
  const before = await prisma.whatsAppConnectionHealth.findUnique({
    where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
    select: { connectedPhone: true },
  });
  try {
    await prisma.whatsAppConnectionHealth.upsert({
      where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
      create: { id: WHATSAPP_CONNECTION_HEALTH_ID, state: "DISCONNECTED" },
      update: { connectedPhone: null },
    });
    clearBusinessNumberCacheForTests();
    check((await resolveBusinessE164()) === "963900111222", "no linked number → env fallback");

    // worker reports the linked account on connect
    await upsertConnectionHealth({
      state: "CONNECTED",
      detail: "Baileys connection open",
      lastConnectedAt: new Date().toISOString(),
      connectedPhone: "963955000777",
      updatedAt: new Date().toISOString(),
    });
    clearBusinessNumberCacheForTests();
    check((await resolveBusinessE164()) === "963955000777", "linked account number wins over env");

    const handoff = await prepareWhatsAppHandoff({
      reference: "RO-2026-0000",
      locale: "ar",
      status: "ready_for_handoff",
      lines: [],
      subtotal: 0,
      currency: "USD",
      customer: { name: "x", phone: "+963900000000", notes: "" },
      destinationCountry: "x",
      destinationCode: null,
      shippingMethodCode: null,
      shippingMethodLabel: null,
      shippingCharge: null,
      packagingCharge: null,
      createdAt: new Date().toISOString(),
    });
    check(handoff.deepLink.startsWith("https://wa.me/963955000777?text="), "deep link targets the linked account");

    // disconnect keeps the last known number
    await upsertConnectionHealth({
      state: "DISCONNECTED",
      detail: "down",
      updatedAt: new Date().toISOString(),
    });
    const row = await prisma.whatsAppConnectionHealth.findUnique({
      where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
      select: { connectedPhone: true },
    });
    check(row?.connectedPhone === "963955000777", "number survives a disconnect");
  } finally {
    await prisma.whatsAppConnectionHealth.update({
      where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
      data: { connectedPhone: before?.connectedPhone ?? null },
    });
    clearBusinessNumberCacheForTests();
  }
  console.log(`\nBusiness-number checks: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
