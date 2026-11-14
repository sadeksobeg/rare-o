/**
 * Auto-link a WhatsApp conversation to a retail request via the RO- reference.
 * Run: npm run test:whatsapp-reference-link
 */
import { prisma } from "@/lib/db/prisma";
import { createRetailRequestFromCart } from "@/lib/retail-request/service";
import { persistInboundText } from "@/lib/whatsapp/messaging/service";
import {
  extractRetailReferences,
  phonesContradict,
  RETAIL_REFERENCE_ACTOR,
} from "@/lib/whatsapp/messaging/reference-link";

let passed = 0;
let failed = 0;
function check(c: unknown, m: string) {
  if (c) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${m}`);
  }
}

async function main() {
  check(extractRetailReferences("المرجع: RO-2026-8045 شكراً").join() === "RO-2026-8045", "extract one");
  check(extractRetailReferences("ro-2026-1000 و RO-2026-2000").length === 2, "extract two (case-insens.)");
  check(extractRetailReferences("RO-26-1 nope").length === 0, "reject malformed");
  check(phonesContradict("963900000111", "+963 900 000 222"), "different phones contradict");
  check(!phonesContradict("963900000111", "+963900000111"), "same phone ok");
  check(!phonesContradict(null, "+963900000111"), "unknown phone never contradicts");

  const product = await prisma.product.findFirst({
    where: { status: "published", availability: "available", retailPrice: { not: null }, currency: { not: null } },
    select: { id: true },
  });
  if (!product) throw new Error("need a published product");

  const suffix = String(Date.now()).slice(-6);
  const phone = `+963900${suffix}`;
  const mk = async (p: string) =>
    (
      await createRetailRequestFromCart({
        locale: "ar",
        customerName: "Ref Link Check",
        customerPhone: p,
        customerNotes: "",
        destinationCountry: "سوريا",
        destinationCode: null,
        shippingMethodCode: null,
        lines: [{ productId: product.id, quantity: 1 }],
        status: "ready_for_handoff",
      })
    ).request;

  const req = await mk(phone);
  const reqOther = await mk(`+963911${suffix}`);
  const convIds: string[] = [];
  const chat = (n: string) => `963900${suffix}${n}@s.whatsapp.net`;
  const inbound = async (chatId: string, text: string, e164: string | null) => {
    const r = await persistInboundText({
      waMessageId: `REFLINK-${suffix}-${Math.random().toString(36).slice(2)}`,
      waChatId: chatId,
      waRemoteJid: chatId,
      senderE164: e164,
      displayName: "Ref Check",
      text,
      timestamp: new Date().toISOString(),
    });
    if (r.ok) convIds.push(r.conversationId);
    return r.ok ? r.conversationId : "";
  };
  const state = (id: string) =>
    prisma.whatsAppConversation.findUnique({ where: { id }, select: { linkType: true, linkId: true, customerId: true } });

  try {
    // 1) matching phone + reference → linked
    const c1 = await inbound(chat("1"), `RARE OUD — تحويل طلب تجزئة\nالمرجع: ${req.reference}\nالعميل: x`, `963900${suffix}`);
    const s1 = await state(c1);
    check(s1?.linkType === "retail_request" && s1.linkId === req.id, "reference + matching phone → linked");
    check(s1?.customerId === req.customerId, "customer record attached");
    const audit = await prisma.whatsAppLinkAudit.findFirst({ where: { conversationId: c1 } });
    check(audit?.adminId === RETAIL_REFERENCE_ACTOR && audit.newLinkId === req.id, "audit row by system actor");

    // 2) conflicting phone → not linked
    const c2 = await inbound(chat("2"), `المرجع: ${req.reference}`, "963922000999");
    check((await state(c2))?.linkType === "none", "phone mismatch → not linked");

    // 3) unknown phone (LID-style) + reference → linked
    const c3 = await inbound(`${suffix}3@lid`, `المرجع: ${reqOther.reference}`, null);
    const s3 = await state(c3);
    check(s3?.linkId === reqOther.id, "unknown phone + reference → linked");

    // 4) two references → ambiguous
    const c4 = await inbound(chat("4"), `${req.reference} ${reqOther.reference}`, `963900${suffix}`);
    check((await state(c4))?.linkType === "none", "two references → not linked");

    // 5) no reference
    const c5 = await inbound(chat("5"), "مرحبا أريد عوداً", `963900${suffix}`);
    check((await state(c5))?.linkType === "none", "no reference → not linked");

    // 6) already linked is never overwritten
    await inbound(chat("1"), `المرجع: ${reqOther.reference}`, `963900${suffix}`);
    check((await state(c1))?.linkId === req.id, "existing link is not overwritten");

    // 7) unknown reference
    const c7 = await inbound(chat("7"), "المرجع: RO-2026-0001", `963900${suffix}`);
    check((await state(c7))?.linkType === "none", "unknown reference → not linked");
  } finally {
    await prisma.whatsAppMessage.deleteMany({ where: { conversationId: { in: convIds } } });
    await prisma.whatsAppConversation.deleteMany({ where: { id: { in: convIds } } });
    for (const r of [req, reqOther]) {
      await prisma.retailRequest.delete({ where: { id: r.id } }).catch(() => undefined);
      if (r.customerId) await prisma.customer.delete({ where: { id: r.customerId } }).catch(() => undefined);
    }
    console.log("cleanup: removed reference-link fixtures");
  }

  console.log(`\nReference-link checks: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
