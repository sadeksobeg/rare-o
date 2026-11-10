-- AlterTable
ALTER TABLE "WhatsAppMessage" ADD COLUMN "nextRetryAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WhatsAppConnectionHealth" ADD COLUMN "outboundKillSwitch" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "WhatsAppInboxEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppInboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppInboxEvent_createdAt_idx" ON "WhatsAppInboxEvent"("createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_nextRetryAt_idx" ON "WhatsAppMessage"("nextRetryAt");
