-- Additive only: payment-first deals + brokerage (owner 2026-11-03)

-- DealProposal
ALTER TABLE "DealProposal" ADD COLUMN "modelNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DealProposal" ADD COLUMN "handoffMessageText" TEXT;
ALTER TABLE "DealProposal" ADD COLUMN "whatsAppDeepLink" TEXT;
ALTER TABLE "DealProposal" ADD COLUMN "handoffPreparedAt" TIMESTAMP(3);
ALTER TABLE "DealProposal" ADD COLUMN "handoffOpenedAt" TIMESTAMP(3);
ALTER TABLE "DealProposal" ADD COLUMN "paymentConfirmedAt" TIMESTAMP(3);
ALTER TABLE "DealProposal" ADD COLUMN "paymentConfirmedByAdminId" TEXT;

-- BrokerageRequest
ALTER TABLE "BrokerageRequest" ADD COLUMN "modelNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrokerageRequest" ADD COLUMN "statedPriceUsd" INTEGER;
ALTER TABLE "BrokerageRequest" ADD COLUMN "handoffMessageText" TEXT;
ALTER TABLE "BrokerageRequest" ADD COLUMN "whatsAppDeepLink" TEXT;
ALTER TABLE "BrokerageRequest" ADD COLUMN "handoffPreparedAt" TIMESTAMP(3);
ALTER TABLE "BrokerageRequest" ADD COLUMN "handoffOpenedAt" TIMESTAMP(3);
ALTER TABLE "BrokerageRequest" ADD COLUMN "paymentConfirmedAt" TIMESTAMP(3);
ALTER TABLE "BrokerageRequest" ADD COLUMN "paymentConfirmedByAdminId" TEXT;
