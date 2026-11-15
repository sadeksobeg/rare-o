import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();
  try {
    const r = await p.$queryRaw`SELECT 1 as ok`;
    console.log("DB_OK", JSON.stringify(r));
    const n = await p.whatsAppConversation.count({
      where: { id: "cmwcnmsti0005epaohp3oqmfj" },
    });
    console.log("merged_row", n);
  } catch (e) {
    console.error("DB_ERR", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
}

main();
