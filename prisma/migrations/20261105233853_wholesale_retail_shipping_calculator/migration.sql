-- AlterTable
ALTER TABLE "RetailRequest" ADD COLUMN     "destinationCode" TEXT,
ADD COLUMN     "shippingCostAmount" DECIMAL(65,30),
ADD COLUMN     "shippingCostCurrency" TEXT,
ADD COLUMN     "shippingWeightKg" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "WholesaleRequest" ADD COLUMN     "destinationCode" TEXT,
ADD COLUMN     "destinationCountry" TEXT,
ADD COLUMN     "shippingCostAmount" DECIMAL(65,30),
ADD COLUMN     "shippingCostCurrency" TEXT,
ADD COLUMN     "shippingMethodCode" TEXT,
ADD COLUMN     "shippingMethodLabel" TEXT,
ADD COLUMN     "shippingWeightKg" DECIMAL(65,30);
