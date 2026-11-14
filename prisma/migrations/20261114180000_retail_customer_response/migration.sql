-- Additive: public order page token + the customer response to the confirmation message.
ALTER TABLE "RetailRequest" ADD COLUMN "publicToken" TEXT;
ALTER TABLE "RetailRequest" ADD COLUMN "customerResponse" TEXT;
ALTER TABLE "RetailRequest" ADD COLUMN "customerResponseNote" TEXT;
ALTER TABLE "RetailRequest" ADD COLUMN "customerRespondedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "RetailRequest_publicToken_key" ON "RetailRequest"("publicToken");
