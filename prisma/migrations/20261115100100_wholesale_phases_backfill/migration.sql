-- Non-destructive backfill so requests confirmed before the phased flow do not dead-end.
UPDATE "WholesaleRequest"
SET "traderConfirmedAt" = COALESCE("confirmedAt", "updatedAt"),
    "traderConfirmedVia" = CASE WHEN "handoffOpenedAt" IS NOT NULL THEN 'whatsapp' ELSE 'platform' END
WHERE "status" IN ('confirmed', 'completed') AND "traderConfirmedAt" IS NULL;

UPDATE "WholesaleRequest"
SET "paymentConfirmedAt" = COALESCE("shippedAt", "completedAt")
WHERE "paymentConfirmedAt" IS NULL AND ("shippedAt" IS NOT NULL OR "status" = 'completed');
