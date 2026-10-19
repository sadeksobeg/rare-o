-- AlterTable
ALTER TABLE "RetailRequest" ADD COLUMN "handoffMessageText" TEXT;
ALTER TABLE "RetailRequest" ADD COLUMN "handoffOpenedAt" DATETIME;
ALTER TABLE "RetailRequest" ADD COLUMN "handoffPreparedAt" DATETIME;
ALTER TABLE "RetailRequest" ADD COLUMN "whatsAppDeepLink" TEXT;

-- CreateTable
CREATE TABLE "RetailHandoffEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actor" TEXT NOT NULL,
    "actorAdminId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RetailHandoffEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RetailRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RetailHandoffEvent_requestId_idx" ON "RetailHandoffEvent"("requestId");
