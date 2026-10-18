-- AlterTable
ALTER TABLE "WhatsAppConnectionHealth" ADD COLUMN "pairingPhone" TEXT;
ALTER TABLE "WhatsAppConnectionHealth" ADD COLUMN "pairingCode" TEXT;
ALTER TABLE "WhatsAppConnectionHealth" ADD COLUMN "qrDataUrl" TEXT;
ALTER TABLE "WhatsAppConnectionHealth" ADD COLUMN "linkCommand" TEXT DEFAULT 'none';
ALTER TABLE "WhatsAppConnectionHealth" ADD COLUMN "pairingExpiresAt" DATETIME;

-- AlterTable
ALTER TABLE "RetailRequest" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RetailRequest_idempotencyKey_key" ON "RetailRequest"("idempotencyKey");
