-- AlterTable
ALTER TABLE "Product" ADD COLUMN "oudSpecs" JSONB;

-- Launch oud browse tiers (idempotent)
INSERT INTO "Category" (id, slug, "nameAr", "nameEn", "sortOrder", "createdAt", "updatedAt")
SELECT 'oudcat_economy', 'oud-economy', 'عود اقتصادي', 'Economy oud', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE slug = 'oud-economy');

INSERT INTO "Category" (id, slug, "nameAr", "nameEn", "sortOrder", "createdAt", "updatedAt")
SELECT 'oudcat_mid', 'oud-mid', 'عود متوسط', 'Mid-range oud', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE slug = 'oud-mid');

INSERT INTO "Category" (id, slug, "nameAr", "nameEn", "sortOrder", "createdAt", "updatedAt")
SELECT 'oudcat_professional', 'oud-professional', 'عود احترافي', 'Professional oud', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE slug = 'oud-professional');

INSERT INTO "Category" (id, slug, "nameAr", "nameEn", "sortOrder", "createdAt", "updatedAt")
SELECT 'oudcat_vip', 'oud-vip', 'عود VIP', 'VIP oud', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE slug = 'oud-vip');

UPDATE "Category"
SET "sortOrder" = 5, "updatedAt" = CURRENT_TIMESTAMP
WHERE slug = 'accessories';

UPDATE "Category"
SET "sortOrder" = 90, "updatedAt" = CURRENT_TIMESTAMP
WHERE slug = 'string-instruments';

-- Move known oud SKUs off the legacy string-instruments bucket
UPDATE "Product"
SET "categoryId" = (SELECT id FROM "Category" WHERE slug = 'oud-economy')
WHERE slug = 'demo-string-instrument'
  AND EXISTS (SELECT 1 FROM "Category" WHERE slug = 'oud-economy');

UPDATE "Product"
SET "categoryId" = (SELECT id FROM "Category" WHERE slug = 'oud-mid')
WHERE slug = 'oud-classic-21'
  AND EXISTS (SELECT 1 FROM "Category" WHERE slug = 'oud-mid');

UPDATE "Product"
SET "categoryId" = (SELECT id FROM "Category" WHERE slug = 'oud-professional')
WHERE slug = 'oud-concert-premium'
  AND EXISTS (SELECT 1 FROM "Category" WHERE slug = 'oud-professional');

UPDATE "Product" p
SET "categoryId" = (SELECT id FROM "Category" WHERE slug = 'oud-mid')
FROM "Category" c
WHERE p."categoryId" = c.id
  AND c.slug = 'string-instruments'
  AND p.slug LIKE 'oud-%'
  AND EXISTS (SELECT 1 FROM "Category" WHERE slug = 'oud-mid');
