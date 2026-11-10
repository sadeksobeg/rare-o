-- Additive: WhatsApp desk media fields + CRM FKs.

ALTER TABLE "WhatsAppConversation" ADD COLUMN "customerId" TEXT;
ALTER TABLE "WhatsAppConversation" ADD COLUMN "traderId" TEXT;

ALTER TABLE "WhatsAppMessage" ADD COLUMN "caption" TEXT;
ALTER TABLE "WhatsAppMessage" ADD COLUMN "mediaMime" TEXT;
ALTER TABLE "WhatsAppMessage" ADD COLUMN "mediaSize" INTEGER;
ALTER TABLE "WhatsAppMessage" ADD COLUMN "mediaDurationSec" INTEGER;
ALTER TABLE "WhatsAppMessage" ADD COLUMN "mediaFileName" TEXT;
ALTER TABLE "WhatsAppMessage" ADD COLUMN "mediaSha256" TEXT;
ALTER TABLE "WhatsAppMessage" ADD COLUMN "storageKey" TEXT;
ALTER TABLE "WhatsAppMessage" ADD COLUMN "thumbnailKey" TEXT;

CREATE INDEX "WhatsAppConversation_customerId_idx" ON "WhatsAppConversation"("customerId");
CREATE INDEX "WhatsAppConversation_traderId_idx" ON "WhatsAppConversation"("traderId");

ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "TraderAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
