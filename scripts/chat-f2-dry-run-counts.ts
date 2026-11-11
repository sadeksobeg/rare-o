/**
 * CHAT-F2 — read-only unify dry-run counts (no merges, no audit writes).
 *   npx tsx scripts/chat-f2-dry-run-counts.ts
 *
 * On prod (via docker exec web), expect mergesNeeded=0 before enabling unify.
 */
import { PrismaClient } from "@prisma/client";
import { dryRunUnifyAllTraders } from "../lib/whatsapp/messaging/trader-unify";

async function main() {
  const prisma = new PrismaClient();
  try {
    const r = await dryRunUnifyAllTraders(prisma);
    console.log(
      JSON.stringify(
        {
          tradersChecked: r.tradersChecked,
          mergesNeeded: r.mergesNeeded,
          details: r.details.map((d) => ({
            traderId: d.traderId,
            secondaryCount: d.secondaryCount,
            messageMoveCount: d.messageMoveCount,
            primaryKind: d.primaryWaChatId?.includes("@lid")
              ? "lid"
              : d.primaryWaChatId?.includes("@s.whatsapp.net")
                ? "phone"
                : d.primaryWaChatId?.includes("@platform.local")
                  ? "platform"
                  : "other",
          })),
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
