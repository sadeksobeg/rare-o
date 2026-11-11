/**
 * Idempotent seed of 8 default WA quick-reply templates (no migration).
 *   npx tsx scripts/wa-v-seed-quick-replies.ts
 */
import { prisma } from "@/lib/db/prisma";
import { ensureDefaultQuickReplies } from "@/lib/whatsapp/messaging/quick-replies";

async function main() {
  const admin = await prisma.adminUser.findFirst({ select: { id: true } });
  if (!admin) {
    console.error(JSON.stringify({ ok: false, error: "NO_ADMIN" }));
    process.exit(1);
  }
  const r = await ensureDefaultQuickReplies(admin.id);
  console.log(JSON.stringify({ ok: true, adminId: admin.id, ...r }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
