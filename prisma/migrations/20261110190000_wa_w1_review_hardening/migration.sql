-- WA-W1 review hardening (additive only)
-- Kill-switch audit fields + configurable global enqueue rate

ALTER TABLE "WhatsAppConnectionHealth"
  ADD COLUMN "outboundKillSwitchAt" TIMESTAMP(3),
  ADD COLUMN "outboundKillSwitchBy" TEXT,
  ADD COLUMN "outboundKillSwitchReason" TEXT,
  ADD COLUMN "outboundGlobalRatePerMin" INTEGER NOT NULL DEFAULT 20;
