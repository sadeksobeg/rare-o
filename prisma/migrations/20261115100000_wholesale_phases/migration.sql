-- Additive: phased wholesale fulfilment (trader confirmation, invoice, payment). No data changes.
ALTER TABLE "WholesaleRequest" ADD COLUMN "traderConfirmedAt" TIMESTAMP(3);
ALTER TABLE "WholesaleRequest" ADD COLUMN "traderConfirmedVia" TEXT;
ALTER TABLE "WholesaleRequest" ADD COLUMN "invoiceToken" TEXT;
ALTER TABLE "WholesaleRequest" ADD COLUMN "invoiceIssuedAt" TIMESTAMP(3);
ALTER TABLE "WholesaleRequest" ADD COLUMN "paymentConfirmedAt" TIMESTAMP(3);
ALTER TABLE "WholesaleRequest" ADD COLUMN "paymentConfirmedByAdminId" TEXT;
CREATE UNIQUE INDEX "WholesaleRequest_invoiceToken_key" ON "WholesaleRequest"("invoiceToken");
