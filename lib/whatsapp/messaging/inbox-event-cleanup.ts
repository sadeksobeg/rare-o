/**
 * Prune durable WhatsAppInboxEvent rows older than the retention window.
 */

import { prisma as defaultPrisma } from "@/lib/db/prisma";

export const INBOX_EVENT_RETENTION_MS = 48 * 60 * 60 * 1000;

export async function cleanupInboxEventsOlderThan(
  retentionMs: number = INBOX_EVENT_RETENTION_MS,
  db: typeof defaultPrisma = defaultPrisma,
  now: Date = new Date()
): Promise<{ deleted: number }> {
  const cutoff = new Date(now.getTime() - Math.max(retentionMs, 60_000));
  const result = await db.whatsAppInboxEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return { deleted: result.count };
}
