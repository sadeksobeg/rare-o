-- AlterTable
ALTER TABLE "BrokerageRequest" ADD COLUMN     "shippingQuoteSnapshot" JSONB;

-- AlterTable
ALTER TABLE "DealProposal" ADD COLUMN     "shippingQuoteSnapshot" JSONB;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "heightCm" DECIMAL(65,30),
ADD COLUMN     "lengthCm" DECIMAL(65,30),
ADD COLUMN     "shippingClass" TEXT NOT NULL DEFAULT 'other',
ADD COLUMN     "weightKg" DECIMAL(65,30),
ADD COLUMN     "widthCm" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "RetailRequest" ADD COLUMN     "shippingQuoteSnapshot" JSONB,
ADD COLUMN     "whatsappShippingOptIn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WholesaleRequest" ADD COLUMN     "shippingQuoteSnapshot" JSONB;

-- CreateTable
CREATE TABLE "ShippingCountry" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT 'other',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT NOT NULL DEFAULT '',
    "inquiryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingCountry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingMethod" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL DEFAULT '',
    "mode" TEXT NOT NULL DEFAULT 'LAND',
    "speed" TEXT,
    "security" TEXT,
    "consolidation" BOOLEAN NOT NULL DEFAULT false,
    "consolidationNote" TEXT NOT NULL DEFAULT '',
    "carrierLabel" TEXT NOT NULL DEFAULT '',
    "trackingUrlTemplate" TEXT,
    "etaMinDays" INTEGER,
    "etaMaxDays" INTEGER,
    "icon" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "allowedClasses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingRate" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "methodId" TEXT NOT NULL,
    "basis" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "altAmounts" JSONB,
    "tiers" JSONB,
    "firstKgAmount" DECIMAL(12,2),
    "additionalKgAmount" DECIMAL(12,2),
    "minCharge" DECIMAL(12,2),
    "maxWeightKg" DECIMAL(12,2),
    "minChargeableWeightKg" DECIMAL(12,2),
    "handlingFee" DECIMAL(12,2),
    "freeShippingOver" DECIMAL(12,2),
    "audience" TEXT NOT NULL DEFAULT 'BOTH',
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ADMIN',
    "packageLabel" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "needsConfirmNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingRateHistory" (
    "id" TEXT NOT NULL,
    "rateId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "actor" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingRateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "roundingRule" TEXT NOT NULL DEFAULT 'legacy_2dp',
    "volumetricDivisor" DECIMAL(12,2),
    "packagingKg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "globalFreeShippingOver" DECIMAL(12,2),
    "insuranceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "insurancePercent" DECIMAL(8,4),
    "whatsappOptInTextAr" TEXT NOT NULL DEFAULT 'أرغب بتلقّي تحديثات الشحن عبر واتساب (اختياري).',
    "whatsappOptInTextEn" TEXT NOT NULL DEFAULT 'I want shipping updates on WhatsApp (optional).',
    "inquiryNoteAr" TEXT NOT NULL DEFAULT 'سنجهّز لك عرض سعر خاصاً بوجهتك.',
    "inquiryNoteEn" TEXT NOT NULL DEFAULT 'We will prepare a custom quote for you.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingInquiry" (
    "id" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "countryCode" TEXT,
    "itemsJson" JSONB NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignee" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "audience" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "retailRequestId" TEXT,
    "wholesaleRequestId" TEXT,
    "brokerageRequestId" TEXT,
    "dealId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "methodCode" TEXT NOT NULL DEFAULT '',
    "methodLabel" TEXT NOT NULL DEFAULT '',
    "quoteSnapshot" JSONB,
    "destCountry" TEXT NOT NULL DEFAULT '',
    "destCity" TEXT NOT NULL DEFAULT '',
    "destAddress" TEXT NOT NULL DEFAULT '',
    "recipientName" TEXT NOT NULL DEFAULT '',
    "recipientPhone" TEXT NOT NULL DEFAULT '',
    "trackingNumber" TEXT,
    "carrierLabel" TEXT NOT NULL DEFAULT '',
    "parcels" JSONB,
    "declaredValue" DECIMAL(12,2),
    "priceCharged" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "actualCost" DECIMAL(12,2),
    "publicToken" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT,
    "actor" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraderSavedAddress" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "countryCode" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TraderSavedAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingCountry_code_key" ON "ShippingCountry"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingMethod_code_key" ON "ShippingMethod"("code");

-- CreateIndex
CREATE INDEX "ShippingRate_countryCode_active_verified_idx" ON "ShippingRate"("countryCode", "active", "verified");

-- CreateIndex
CREATE INDEX "ShippingRate_methodId_idx" ON "ShippingRate"("methodId");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingRate_countryCode_methodId_basis_source_key" ON "ShippingRate"("countryCode", "methodId", "basis", "source");

-- CreateIndex
CREATE INDEX "ShippingRateHistory_rateId_at_idx" ON "ShippingRateHistory"("rateId", "at");

-- CreateIndex
CREATE INDEX "ShippingInquiry_status_createdAt_idx" ON "ShippingInquiry"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_publicToken_key" ON "Shipment"("publicToken");

-- CreateIndex
CREATE INDEX "Shipment_status_createdAt_idx" ON "Shipment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Shipment_retailRequestId_idx" ON "Shipment"("retailRequestId");

-- CreateIndex
CREATE INDEX "Shipment_wholesaleRequestId_idx" ON "Shipment"("wholesaleRequestId");

-- CreateIndex
CREATE INDEX "Shipment_brokerageRequestId_idx" ON "Shipment"("brokerageRequestId");

-- CreateIndex
CREATE INDEX "ShipmentEvent_shipmentId_at_idx" ON "ShipmentEvent"("shipmentId", "at");

-- CreateIndex
CREATE INDEX "TraderSavedAddress_traderId_idx" ON "TraderSavedAddress"("traderId");

-- AddForeignKey
ALTER TABLE "ShippingRate" ADD CONSTRAINT "ShippingRate_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "ShippingCountry"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingRate" ADD CONSTRAINT "ShippingRate_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "ShippingMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingRateHistory" ADD CONSTRAINT "ShippingRateHistory_rateId_fkey" FOREIGN KEY ("rateId") REFERENCES "ShippingRate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_retailRequestId_fkey" FOREIGN KEY ("retailRequestId") REFERENCES "RetailRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_wholesaleRequestId_fkey" FOREIGN KEY ("wholesaleRequestId") REFERENCES "WholesaleRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_brokerageRequestId_fkey" FOREIGN KEY ("brokerageRequestId") REFERENCES "BrokerageRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraderSavedAddress" ADD CONSTRAINT "TraderSavedAddress_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "TraderAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
