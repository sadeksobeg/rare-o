-- Additive: payment mode + delivery ETA for retail requests (ShippingMethod already has etaMinDays/etaMaxDays).
ALTER TABLE "RetailRequest" ADD COLUMN "paymentMode" TEXT;
ALTER TABLE "RetailRequest" ADD COLUMN "paymentConfirmedAt" TIMESTAMP(3);
ALTER TABLE "RetailRequest" ADD COLUMN "etaMinDays" INTEGER;
ALTER TABLE "RetailRequest" ADD COLUMN "etaMaxDays" INTEGER;
