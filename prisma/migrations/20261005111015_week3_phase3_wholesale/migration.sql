-- CreateTable
CREATE TABLE "WholesaleRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "requestMode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "traderNotes" TEXT NOT NULL DEFAULT '',
    "quoteMessage" TEXT,
    "quoteCurrency" TEXT,
    "quotedAt" DATETIME,
    "quotedByAdminId" TEXT,
    "traderResponseNote" TEXT,
    "confirmedAt" DATETIME,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WholesaleRequest_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "TraderAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WholesaleRequestLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "productId" TEXT,
    "productNameAr" TEXT NOT NULL,
    "productNameEn" TEXT NOT NULL,
    "productSlugSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "proposedUnitPrice" DECIMAL,
    "quotedUnitPrice" DECIMAL,
    "currency" TEXT,
    "catalogRetailPriceSnapshot" DECIMAL,
    "catalogCurrencySnapshot" TEXT,
    CONSTRAINT "WholesaleRequestLine_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WholesaleRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WholesaleRequestLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WholesaleRequestEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actorRole" TEXT NOT NULL,
    "actorTraderId" TEXT,
    "actorAdminId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WholesaleRequestEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WholesaleRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WholesaleRequest_reference_key" ON "WholesaleRequest"("reference");

-- CreateIndex
CREATE INDEX "WholesaleRequest_traderId_idx" ON "WholesaleRequest"("traderId");

-- CreateIndex
CREATE INDEX "WholesaleRequest_status_idx" ON "WholesaleRequest"("status");

-- CreateIndex
CREATE INDEX "WholesaleRequest_requestMode_idx" ON "WholesaleRequest"("requestMode");

-- CreateIndex
CREATE INDEX "WholesaleRequestEvent_requestId_idx" ON "WholesaleRequestEvent"("requestId");
