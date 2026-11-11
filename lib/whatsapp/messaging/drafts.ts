import { prisma as defaultPrisma } from "@/lib/db/prisma";

export async function getComposerDraft(
  conversationId: string,
  adminId: string
): Promise<{ body: string; replyToMessageId: string | null } | null> {
  const row = await defaultPrisma.whatsAppComposerDraft.findUnique({
    where: {
      conversationId_adminId: { conversationId, adminId },
    },
    select: { body: true, replyToMessageId: true },
  });
  return row;
}

export async function saveComposerDraft(input: {
  conversationId: string;
  adminId: string;
  body: string;
  replyToMessageId?: string | null;
}): Promise<void> {
  const body = input.body.slice(0, 8000);
  const replyToMessageId = input.replyToMessageId?.trim() || null;
  if (!body.trim() && !replyToMessageId) {
    // deleteMany: no throw / no prisma:error when the row is already gone
    // (empty draft clear races used to trip Next's "1 Issue" badge).
    await defaultPrisma.whatsAppComposerDraft.deleteMany({
      where: {
        conversationId: input.conversationId,
        adminId: input.adminId,
      },
    });
    return;
  }
  await defaultPrisma.whatsAppComposerDraft.upsert({
    where: {
      conversationId_adminId: {
        conversationId: input.conversationId,
        adminId: input.adminId,
      },
    },
    create: {
      conversationId: input.conversationId,
      adminId: input.adminId,
      body,
      replyToMessageId,
    },
    update: { body, replyToMessageId },
  });
}
