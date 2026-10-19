-- AlterTable
ALTER TABLE "TraderAccount" ADD COLUMN "interestCategorySlugs" TEXT NOT NULL DEFAULT '';
ALTER TABLE "TraderAccount" ADD COLUMN "interestNotes" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "TraderNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "traderId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL DEFAULT '',
    "bodyEn" TEXT NOT NULL DEFAULT '',
    "href" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TraderNotification_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "TraderAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TraderNotification_traderId_createdAt_idx" ON "TraderNotification"("traderId", "createdAt");

-- CreateIndex
CREATE INDEX "TraderNotification_traderId_readAt_idx" ON "TraderNotification"("traderId", "readAt");
