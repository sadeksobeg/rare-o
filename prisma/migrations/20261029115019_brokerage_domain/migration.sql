-- CreateTable
CREATE TABLE "BrokerageRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "descriptionAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "categoryAr" TEXT NOT NULL DEFAULT '',
    "categoryEn" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "cityAr" TEXT NOT NULL DEFAULT '',
    "cityEn" TEXT NOT NULL DEFAULT '',
    "placeNameAr" TEXT NOT NULL DEFAULT '',
    "placeNameEn" TEXT NOT NULL DEFAULT '',
    "sellerContact" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT NOT NULL DEFAULT '',
    "budgetMinUsd" INTEGER,
    "budgetMaxUsd" INTEGER,
    "timelineNotes" TEXT NOT NULL DEFAULT '',
    "traderNotes" TEXT NOT NULL DEFAULT '',
    "adminDeclineReason" TEXT NOT NULL DEFAULT '',
    "inspectionAt" TIMESTAMP(3),
    "inspectionAssignee" TEXT NOT NULL DEFAULT '',
    "inspectionLocation" TEXT NOT NULL DEFAULT '',
    "carrier" TEXT NOT NULL DEFAULT '',
    "trackingRef" TEXT NOT NULL DEFAULT '',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerageRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerageInspection" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "grade" TEXT NOT NULL DEFAULT 'B',
    "notesAr" TEXT NOT NULL DEFAULT '',
    "notesEn" TEXT NOT NULL DEFAULT '',
    "verdictAr" TEXT NOT NULL DEFAULT '',
    "verdictEn" TEXT NOT NULL DEFAULT '',
    "photoPaths" TEXT NOT NULL DEFAULT '[]',
    "checklist" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerageInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerageQuote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "goodsValueUsd" INTEGER NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "shippingUsd" INTEGER NOT NULL DEFAULT 0,
    "notesAr" TEXT NOT NULL DEFAULT '',
    "notesEn" TEXT NOT NULL DEFAULT '',
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerageQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerageEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'status_change',
    "actor" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "messageAr" TEXT NOT NULL DEFAULT '',
    "messageEn" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokerageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerageRequest_reference_key" ON "BrokerageRequest"("reference");

-- CreateIndex
CREATE INDEX "BrokerageRequest_traderId_createdAt_idx" ON "BrokerageRequest"("traderId", "createdAt");

-- CreateIndex
CREATE INDEX "BrokerageRequest_status_createdAt_idx" ON "BrokerageRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerageInspection_requestId_key" ON "BrokerageInspection"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerageQuote_requestId_key" ON "BrokerageQuote"("requestId");

-- CreateIndex
CREATE INDEX "BrokerageEvent_requestId_createdAt_idx" ON "BrokerageEvent"("requestId", "createdAt");

-- AddForeignKey
ALTER TABLE "BrokerageRequest" ADD CONSTRAINT "BrokerageRequest_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "TraderAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerageInspection" ADD CONSTRAINT "BrokerageInspection_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BrokerageRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerageQuote" ADD CONSTRAINT "BrokerageQuote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BrokerageRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerageEvent" ADD CONSTRAINT "BrokerageEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BrokerageRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
