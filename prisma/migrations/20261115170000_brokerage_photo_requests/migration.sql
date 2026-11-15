-- Additive: photo requests/batches for brokerage requests.
CREATE TABLE "BrokeragePhotoRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "requestedBy" TEXT NOT NULL DEFAULT 'admin',
    "requestedByAdminId" TEXT,
    "photoPaths" TEXT NOT NULL DEFAULT '[]',
    "traderNote" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),
    CONSTRAINT "BrokeragePhotoRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BrokeragePhotoRequest_requestId_createdAt_idx" ON "BrokeragePhotoRequest"("requestId", "createdAt");
ALTER TABLE "BrokeragePhotoRequest" ADD CONSTRAINT "BrokeragePhotoRequest_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BrokerageRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
