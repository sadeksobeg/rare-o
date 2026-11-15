-- Additive: phased deal follow-up (invoice, payment notice, shipping, completion). No data changes.
ALTER TABLE "DealProposal" ADD COLUMN "invoiceToken" TEXT;
ALTER TABLE "DealProposal" ADD COLUMN "invoiceIssuedAt" TIMESTAMP(3);
ALTER TABLE "DealProposal" ADD COLUMN "paymentClaimedAt" TIMESTAMP(3);
ALTER TABLE "DealProposal" ADD COLUMN "paymentClaimedVia" TEXT;
ALTER TABLE "DealProposal" ADD COLUMN "shippedAt" TIMESTAMP(3);
ALTER TABLE "DealProposal" ADD COLUMN "carrier" TEXT;
ALTER TABLE "DealProposal" ADD COLUMN "trackingReference" TEXT;
ALTER TABLE "DealProposal" ADD COLUMN "completedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "DealProposal_invoiceToken_key" ON "DealProposal"("invoiceToken");
-- Deals already payment_confirmed before this flow: treat as completed so they do not dead-end.
UPDATE "DealProposal" SET "completedAt" = COALESCE("paymentConfirmedAt","updatedAt"), "shippedAt" = COALESCE("paymentConfirmedAt","updatedAt") WHERE "status" = 'payment_confirmed' AND "completedAt" IS NULL;
