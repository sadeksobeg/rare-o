-- CreateTable
CREATE TABLE "WhatsAppOutboundSafetyState" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "dayKey" TEXT NOT NULL DEFAULT '',
    "dayCount" INTEGER NOT NULL DEFAULT 0,
    "windowStampsJson" TEXT NOT NULL DEFAULT '[]',
    "failureStampsJson" TEXT NOT NULL DEFAULT '[]',
    "lastAttemptAt" TIMESTAMP(3),
    "circuitOpenUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppOutboundSafetyState_pkey" PRIMARY KEY ("id")
);
