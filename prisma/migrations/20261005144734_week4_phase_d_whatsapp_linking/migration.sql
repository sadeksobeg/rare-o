-- CreateTable
CREATE TABLE "WhatsAppLinkAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousLinkType" TEXT,
    "previousLinkId" TEXT,
    "newLinkType" TEXT NOT NULL,
    "newLinkId" TEXT,
    "adminId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhatsAppLinkAudit_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WhatsAppConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waChatId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "participantE164" TEXT,
    "displayName" TEXT,
    "lastMessageAt" DATETIME,
    "lastMessagePreview" TEXT NOT NULL DEFAULT '',
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "linkType" TEXT NOT NULL DEFAULT 'none',
    "linkId" TEXT,
    "linkedAt" DATETIME,
    "linkedByAdminId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_WhatsAppConversation" ("createdAt", "displayName", "id", "lastMessageAt", "lastMessagePreview", "participantE164", "remoteJid", "unreadCount", "updatedAt", "waChatId") SELECT "createdAt", "displayName", "id", "lastMessageAt", "lastMessagePreview", "participantE164", "remoteJid", "unreadCount", "updatedAt", "waChatId" FROM "WhatsAppConversation";
DROP TABLE "WhatsAppConversation";
ALTER TABLE "new_WhatsAppConversation" RENAME TO "WhatsAppConversation";
CREATE UNIQUE INDEX "WhatsAppConversation_waChatId_key" ON "WhatsAppConversation"("waChatId");
CREATE INDEX "WhatsAppConversation_lastMessageAt_idx" ON "WhatsAppConversation"("lastMessageAt");
CREATE INDEX "WhatsAppConversation_participantE164_idx" ON "WhatsAppConversation"("participantE164");
CREATE INDEX "WhatsAppConversation_linkType_linkId_idx" ON "WhatsAppConversation"("linkType", "linkId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WhatsAppLinkAudit_conversationId_createdAt_idx" ON "WhatsAppLinkAudit"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppLinkAudit_adminId_idx" ON "WhatsAppLinkAudit"("adminId");
