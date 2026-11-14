/**
 * Retail identity rules: unique unguessable references, one Customer per phone,
 * mandatory full name + phone, returning-customer relink.
 * Run: npm run test:retail-identity
 */
import { prisma } from "@/lib/db/prisma";
import { createRetailRequestFromCart } from "@/lib/retail-request/service";
import { retailRequestCreateSchema } from "@/lib/validation/schemas";
import { isFullName, isValidPhone } from "@/lib/validation/customer-identity";
import { persistInboundText } from "@/lib/whatsapp/messaging/service";
import {
  extractRetailReferences,
  isLegacyReference,
} from "@/lib/whatsapp/messaging/reference-link";

let passed = 0;
let failed = 0;
const check = (c: unknown, m: string) => (c ? passed++ : (failed++, console.error(`FAIL: ${m}`)));

async function main() {
  // --- validation ---
  check(isFullName("أحمد محمد العلي"), "3-part arabic name ok");
  check(isFullName("Sadek Al Etr"), "3-part latin name ok");
  check(!isFullName("صادق"), "single name rejected");
  check(!isFullName("صادق العطر"), "two-part name rejected");
  check(!isFullName("a b c"), "one-letter parts rejected");
  check(!isFullName("12 34 56"), "digits are not a name");
  check(isValidPhone("+963 944 123 456"), "spaced intl phone ok");
  check(!isValidPhone("123"), "short phone rejected");
  check(!isValidPhone("abc12345678"), "letters rejected");

  const product = await prisma.product.findFirst({
    where: { status: "published", availability: "available", retailPrice: { not: null }, currency: { not: null } },
    select: { id: true },
  });
  if (!product) throw new Error("need a published product");
  const base = {
    locale: "ar" as const,
    customerName: "أحمد محمد العلي",
    customerPhone: "+963944123456",
    destinationCountry: "ألمانيا",
    lines: [{ productId: product.id, quantity: 1 }],
    status: "ready_for_handoff" as const,
  };
  check(retailRequestCreateSchema.safeParse(base).success, "valid input passes schema");
  const badName = retailRequestCreateSchema.safeParse({ ...base, customerName: "أحمد" });
  check(!badName.success && /الثلاثي/.test(badName.error.issues[0]!.message), "short name gives Arabic message");
  const badNameEn = retailRequestCreateSchema.safeParse({ ...base, locale: "en", customerName: "Ahmad" });
  check(!badNameEn.success && /Full name/.test(badNameEn.error.issues[0]!.message), "short name gives English message");
  const badPhone = retailRequestCreateSchema.safeParse({ ...base, customerPhone: "12ab" });
  check(!badPhone.success && badPhone.error.issues.some((i) => i.path[0] === "customerPhone"), "bad phone rejected");

  // --- reference format + uniqueness ---
  const suffix = String(Date.now()).slice(-7);
  const phone = `+96395${suffix}`;
  const mk = async (p: string) =>
    (await createRetailRequestFromCart({ ...base, customerNotes: "", customerPhone: p, customerName: "Identity Check Customer" })).request;
  const made: { id: string; customerId: string | null; reference: string }[] = [];
  try {
    for (let i = 0; i < 25; i += 1) {
      made.push(await mk(i === 0 ? phone : `+96396${suffix}${i}`));
    }
    check(
      made.every((r) => /^RO-\d{4}-[A-HJ-NP-Z2-9]{6}$/.test(r.reference)),
      "reference format RO-YYYY-XXXXXX without 0/O/1/I/L"
    );
    check(new Set(made.map((r) => r.reference)).size === made.length, "25 references all distinct");
    check(extractRetailReferences(`المرجع: ${made[0]!.reference}`).length === 1, "new-format reference is extracted");
    check(isLegacyReference("RO-2026-8045") && !isLegacyReference(made[0]!.reference), "legacy vs new detection");

    // --- one customer per phone ---
    const again = await mk(phone);
    made.push(again);
    check(again.customerId === made[0]!.customerId, "same phone reuses the Customer record");
    const spaced = await mk(`+96 3 95 ${suffix.slice(0, 3)} ${suffix.slice(3)}`);
    made.push(spaced);
    check(spaced.customerId === made[0]!.customerId, "same phone written with spaces reuses the Customer");
    check(made[1]!.customerId !== made[0]!.customerId, "a different phone gets a different Customer");

    // --- returning customer relink ---
    const chatId = `96395${suffix}@s.whatsapp.net`;
    const inbound = async (text: string) => {
      const r = await persistInboundText({
        waMessageId: `IDCHK-${suffix}-${Math.random().toString(36).slice(2)}`,
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: `96395${suffix}`,
        displayName: "Id Check",
        text,
        timestamp: new Date().toISOString(),
      });
      return r.ok ? r.conversationId : "";
    };
    const conv = await inbound(`المرجع: ${made[0]!.reference}`);
    let st = await prisma.whatsAppConversation.findUnique({ where: { id: conv }, select: { linkId: true } });
    check(st?.linkId === made[0]!.id, "first reference links");
    await inbound(`طلب جديد المرجع: ${again.reference}`);
    st = await prisma.whatsAppConversation.findUnique({ where: { id: conv }, select: { linkId: true } });
    check(st?.linkId === again.id, "returning customer newer request moves the link");
    await inbound(`رجعت للقديم: ${made[0]!.reference}`);
    st = await prisma.whatsAppConversation.findUnique({ where: { id: conv }, select: { linkId: true } });
    check(st?.linkId === again.id, "an older request never steals the link back");

    // legacy numeric ref + unknown phone → no link
    const legacy = await prisma.retailRequest.update({
      where: { id: made[1]!.id },
      data: { reference: `RO-2026-${suffix.slice(0, 4)}` },
    });
    const lid = `${suffix}9@lid`;
    const r2 = await persistInboundText({
      waMessageId: `IDCHK-L-${suffix}`,
      waChatId: lid,
      waRemoteJid: lid,
      senderE164: null,
      displayName: null,
      text: `المرجع: ${legacy.reference}`,
      timestamp: new Date().toISOString(),
    });
    const lidState = r2.ok
      ? await prisma.whatsAppConversation.findUnique({ where: { id: r2.conversationId }, select: { linkType: true } })
      : null;
    check(lidState?.linkType === "none", "legacy 4-digit ref with unknown phone is not auto-linked");
    // new-format ref + unknown phone → linked (unguessable)
    const r3 = await persistInboundText({
      waMessageId: `IDCHK-N-${suffix}`,
      waChatId: lid,
      waRemoteJid: lid,
      senderE164: null,
      displayName: null,
      text: `المرجع: ${made[2]!.reference}`,
      timestamp: new Date().toISOString(),
    });
    const lid2 = r3.ok
      ? await prisma.whatsAppConversation.findUnique({ where: { id: r3.conversationId }, select: { linkId: true } })
      : null;
    check(lid2?.linkId === made[2]!.id, "new unguessable ref links even without a known phone");
  } finally {
    const convs = await prisma.whatsAppConversation.findMany({
      where: { waChatId: { contains: suffix } },
      select: { id: true },
    });
    const ids = convs.map((c) => c.id);
    await prisma.whatsAppMessage.deleteMany({ where: { conversationId: { in: ids } } });
    await prisma.whatsAppConversation.deleteMany({ where: { id: { in: ids } } });
    const custIds = [...new Set(made.map((r) => r.customerId).filter(Boolean))] as string[];
    for (const r of made) await prisma.retailRequest.delete({ where: { id: r.id } }).catch(() => undefined);
    await prisma.customer.deleteMany({ where: { id: { in: custIds } } });
    console.log("cleanup: removed identity-check fixtures");
  }
  console.log(`\nRetail identity checks: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
