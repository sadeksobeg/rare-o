-- AlterTable
ALTER TABLE "WholesaleRequest" ADD COLUMN     "handoffMessageText" TEXT,
ADD COLUMN     "handoffPreparedAt" TIMESTAMP(3),
ADD COLUMN     "whatsAppDeepLink" TEXT;
