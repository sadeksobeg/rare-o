-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WhatsAppMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "body" TEXT NOT NULL DEFAULT '',
    "waMessageId" TEXT,
    "clientRequestId" TEXT,
    "status" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" DATETIME,
    "errorSafe" TEXT,
    "waTimestamp" DATETIME,
    "adminId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WhatsAppMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WhatsAppMessage" ("adminId", "body", "clientRequestId", "conversationId", "createdAt", "direction", "errorSafe", "id", "messageType", "status", "updatedAt", "waMessageId", "waTimestamp") SELECT "adminId", "body", "clientRequestId", "conversationId", "createdAt", "direction", "errorSafe", "id", "messageType", "status", "updatedAt", "waMessageId", "waTimestamp" FROM "WhatsAppMessage";
DROP TABLE "WhatsAppMessage";
ALTER TABLE "new_WhatsAppMessage" RENAME TO "WhatsAppMessage";
CREATE UNIQUE INDEX "WhatsAppMessage_waMessageId_key" ON "WhatsAppMessage"("waMessageId");
CREATE UNIQUE INDEX "WhatsAppMessage_clientRequestId_key" ON "WhatsAppMessage"("clientRequestId");
CREATE INDEX "WhatsAppMessage_conversationId_createdAt_idx" ON "WhatsAppMessage"("conversationId", "createdAt");
CREATE INDEX "WhatsAppMessage_status_idx" ON "WhatsAppMessage"("status");
CREATE INDEX "WhatsAppMessage_direction_idx" ON "WhatsAppMessage"("direction");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
