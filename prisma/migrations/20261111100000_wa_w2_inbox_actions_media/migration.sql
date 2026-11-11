-- WA-W2 additive: desk actions + reply-to + templates + drafts + phone reveal audit

ALTER TABLE "WhatsAppConversation"
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "mutedUntil" TIMESTAMP(3),
  ADD COLUMN "blockedAt" TIMESTAMP(3),
  ADD COLUMN "blockedByAdminId" TEXT;

CREATE INDEX "WhatsAppConversation_archivedAt_idx" ON "WhatsAppConversation"("archivedAt");

ALTER TABLE "WhatsAppMessage"
  ADD COLUMN "replyToMessageId" TEXT,
  ADD COLUMN "hiddenAt" TIMESTAMP(3),
  ADD COLUMN "isPtt" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "WhatsAppMessage"
  ADD CONSTRAINT "WhatsAppMessage_replyToMessageId_fkey"
  FOREIGN KEY ("replyToMessageId") REFERENCES "WhatsAppMessage"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "WhatsAppMessage_replyToMessageId_idx" ON "WhatsAppMessage"("replyToMessageId");

CREATE TABLE "WhatsAppQuickReplyTemplate" (
  "id" TEXT NOT NULL,
  "titleAr" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "bodyAr" TEXT NOT NULL,
  "bodyEn" TEXT NOT NULL,
  "category" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WhatsAppQuickReplyTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WhatsAppQuickReplyTemplate_sortOrder_idx" ON "WhatsAppQuickReplyTemplate"("sortOrder");

CREATE TABLE "WhatsAppComposerDraft" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "body" TEXT NOT NULL DEFAULT '',
  "replyToMessageId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WhatsAppComposerDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppComposerDraft_conversationId_adminId_key"
  ON "WhatsAppComposerDraft"("conversationId", "adminId");
CREATE INDEX "WhatsAppComposerDraft_adminId_idx" ON "WhatsAppComposerDraft"("adminId");

ALTER TABLE "WhatsAppComposerDraft"
  ADD CONSTRAINT "WhatsAppComposerDraft_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WhatsAppPhoneRevealAudit" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WhatsAppPhoneRevealAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WhatsAppPhoneRevealAudit_conversationId_createdAt_idx"
  ON "WhatsAppPhoneRevealAudit"("conversationId", "createdAt");
CREATE INDEX "WhatsAppPhoneRevealAudit_adminId_idx" ON "WhatsAppPhoneRevealAudit"("adminId");

ALTER TABLE "WhatsAppPhoneRevealAudit"
  ADD CONSTRAINT "WhatsAppPhoneRevealAudit_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
