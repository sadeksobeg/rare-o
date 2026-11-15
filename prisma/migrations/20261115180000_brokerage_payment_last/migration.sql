-- Additive: payment becomes the LAST brokerage stage (invoice + trader payment notice).
ALTER TABLE "BrokerageRequest" ADD COLUMN "invoiceToken" TEXT;
ALTER TABLE "BrokerageRequest" ADD COLUMN "invoiceIssuedAt" TIMESTAMP(3);
ALTER TABLE "BrokerageRequest" ADD COLUMN "paymentClaimedAt" TIMESTAMP(3);
ALTER TABLE "BrokerageRequest" ADD COLUMN "paymentClaimedVia" TEXT;
ALTER TABLE "BrokerageRequest" ADD COLUMN "purchasedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "BrokerageRequest_invoiceToken_key" ON "BrokerageRequest"("invoiceToken");
-- Requests already past PURCHASED keep working: stamp purchasedAt from their last update.
UPDATE "BrokerageRequest" SET "purchasedAt" = "updatedAt" WHERE "status" IN ('PURCHASED','SHIPPED','DELIVERED','CLOSED') AND "purchasedAt" IS NULL;
