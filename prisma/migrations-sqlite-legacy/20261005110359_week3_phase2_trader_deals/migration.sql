-- CreateTable
CREATE TABLE "TraderAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DealProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "dealKind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productId" TEXT,
    "proposedPrice" DECIMAL,
    "currency" TEXT,
    "quantity" INTEGER,
    "conditionsNotes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DealProposal_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "TraderAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DealProposal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NegotiationEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorTraderId" TEXT,
    "actorAdminId" TEXT,
    "message" TEXT NOT NULL DEFAULT '',
    "proposedPrice" DECIMAL,
    "currency" TEXT,
    "quantity" INTEGER,
    "conditionsNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NegotiationEntry_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublicCuratedOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL DEFAULT '',
    "titleEn" TEXT NOT NULL DEFAULT '',
    "summaryAr" TEXT NOT NULL DEFAULT '',
    "summaryEn" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dealProposalId" TEXT,
    "productId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PublicCuratedOffer_dealProposalId_fkey" FOREIGN KEY ("dealProposalId") REFERENCES "DealProposal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublicCuratedOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TraderAccount_email_key" ON "TraderAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DealProposal_reference_key" ON "DealProposal"("reference");

-- CreateIndex
CREATE INDEX "DealProposal_traderId_idx" ON "DealProposal"("traderId");

-- CreateIndex
CREATE INDEX "DealProposal_status_idx" ON "DealProposal"("status");

-- CreateIndex
CREATE INDEX "DealProposal_dealKind_idx" ON "DealProposal"("dealKind");

-- CreateIndex
CREATE INDEX "NegotiationEntry_dealId_idx" ON "NegotiationEntry"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicCuratedOffer_slug_key" ON "PublicCuratedOffer"("slug");

-- CreateIndex
CREATE INDEX "PublicCuratedOffer_status_idx" ON "PublicCuratedOffer"("status");

-- CreateIndex
CREATE INDEX "PublicCuratedOffer_dealProposalId_idx" ON "PublicCuratedOffer"("dealProposalId");
