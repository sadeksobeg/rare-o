-- Additive: optional per-product stock tracking (null = untracked / unlimited).
ALTER TABLE "Product" ADD COLUMN "stockQuantity" INTEGER;
ALTER TABLE "Product" ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 3;
