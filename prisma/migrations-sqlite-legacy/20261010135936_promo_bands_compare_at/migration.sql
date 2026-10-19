-- AlterTable
ALTER TABLE "Product" ADD COLUMN "compareAtPrice" DECIMAL;

-- CreateTable
CREATE TABLE "PromoBand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL DEFAULT '',
    "titleEn" TEXT NOT NULL DEFAULT '',
    "bodyAr" TEXT NOT NULL DEFAULT '',
    "bodyEn" TEXT NOT NULL DEFAULT '',
    "ctaLabelAr" TEXT NOT NULL DEFAULT '',
    "ctaLabelEn" TEXT NOT NULL DEFAULT '',
    "href" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'ink',
    "imagePath" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoBand_slug_key" ON "PromoBand"("slug");

-- CreateIndex
CREATE INDEX "PromoBand_status_sortOrder_idx" ON "PromoBand"("status", "sortOrder");
