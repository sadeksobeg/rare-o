-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL DEFAULT '',
    "nameEn" TEXT NOT NULL DEFAULT '',
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "specsTextAr" TEXT NOT NULL DEFAULT '',
    "specsTextEn" TEXT NOT NULL DEFAULT '',
    "categoryId" TEXT NOT NULL,
    "retailPrice" DECIMAL(65,30),
    "compareAtPrice" DECIMAL(65,30),
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "availability" TEXT NOT NULL DEFAULT 'available',
    "wholesaleEligible" BOOLEAN NOT NULL DEFAULT false,
    "badgeNew" BOOLEAN NOT NULL DEFAULT false,
    "badgeFeatured" BOOLEAN NOT NULL DEFAULT false,
    "badgeSale" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoBand" (
    "id" TEXT NOT NULL,
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
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "altAr" TEXT NOT NULL DEFAULT '',
    "altEn" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "kind" TEXT NOT NULL DEFAULT 'image',

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerNotes" TEXT NOT NULL DEFAULT '',
    "destinationCountry" TEXT NOT NULL,
    "shippingMethodCode" TEXT,
    "shippingMethodLabel" TEXT,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "handoffPayloadJson" TEXT NOT NULL,
    "handoffMessageText" TEXT,
    "whatsAppDeepLink" TEXT,
    "idempotencyKey" TEXT,
    "handoffPreparedAt" TIMESTAMP(3),
    "handoffOpenedAt" TIMESTAMP(3),
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailHandoffEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actor" TEXT NOT NULL,
    "actorAdminId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetailHandoffEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailRequestLine" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "productId" TEXT,
    "productNameAr" TEXT NOT NULL,
    "productNameEn" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceSnapshot" DECIMAL(65,30) NOT NULL,
    "lineTotal" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,

    CONSTRAINT "RetailRequestLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraderAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "interestCategorySlugs" TEXT NOT NULL DEFAULT '',
    "interestNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TraderAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraderNotification" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL DEFAULT '',
    "bodyEn" TEXT NOT NULL DEFAULT '',
    "href" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TraderNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealProposal" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "dealKind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productId" TEXT,
    "proposedPrice" DECIMAL(65,30),
    "currency" TEXT,
    "quantity" INTEGER,
    "conditionsNotes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationEntry" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorTraderId" TEXT,
    "actorAdminId" TEXT,
    "message" TEXT NOT NULL DEFAULT '',
    "proposedPrice" DECIMAL(65,30),
    "currency" TEXT,
    "quantity" INTEGER,
    "conditionsNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegotiationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicCuratedOffer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL DEFAULT '',
    "titleEn" TEXT NOT NULL DEFAULT '',
    "summaryAr" TEXT NOT NULL DEFAULT '',
    "summaryEn" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dealProposalId" TEXT,
    "productId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicCuratedOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "requestMode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "traderNotes" TEXT NOT NULL DEFAULT '',
    "quoteMessage" TEXT,
    "quoteCurrency" TEXT,
    "quotedAt" TIMESTAMP(3),
    "quotedByAdminId" TEXT,
    "traderResponseNote" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "carrier" TEXT,
    "trackingReference" TEXT,
    "shippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WholesaleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleRequestLine" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "productId" TEXT,
    "productNameAr" TEXT NOT NULL,
    "productNameEn" TEXT NOT NULL,
    "productSlugSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "proposedUnitPrice" DECIMAL(65,30),
    "quotedUnitPrice" DECIMAL(65,30),
    "currency" TEXT,
    "catalogRetailPriceSnapshot" DECIMAL(65,30),
    "catalogCurrencySnapshot" TEXT,

    CONSTRAINT "WholesaleRequestLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleRequestEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actorRole" TEXT NOT NULL,
    "actorTraderId" TEXT,
    "actorAdminId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WholesaleRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConversation" (
    "id" TEXT NOT NULL,
    "waChatId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "participantE164" TEXT,
    "displayName" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessagePreview" TEXT NOT NULL DEFAULT '',
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "linkType" TEXT NOT NULL DEFAULT 'none',
    "linkId" TEXT,
    "linkedAt" TIMESTAMP(3),
    "linkedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "body" TEXT NOT NULL DEFAULT '',
    "waMessageId" TEXT,
    "clientRequestId" TEXT,
    "status" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "errorSafe" TEXT,
    "waTimestamp" TIMESTAMP(3),
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConnectionHealth" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "state" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "detailSafe" TEXT,
    "lastConnectedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pairingPhone" TEXT,
    "pairingCode" TEXT,
    "qrDataUrl" TEXT,
    "linkCommand" TEXT DEFAULT 'none',
    "pairingExpiresAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppConnectionHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppLinkAudit" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousLinkType" TEXT,
    "previousLinkId" TEXT,
    "newLinkType" TEXT NOT NULL,
    "newLinkId" TEXT,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppLinkAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PromoBand_slug_key" ON "PromoBand"("slug");

-- CreateIndex
CREATE INDEX "PromoBand_status_sortOrder_idx" ON "PromoBand"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "RetailRequest_reference_key" ON "RetailRequest"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "RetailRequest_idempotencyKey_key" ON "RetailRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RetailRequest_status_idx" ON "RetailRequest"("status");

-- CreateIndex
CREATE INDEX "RetailRequest_customerPhone_idx" ON "RetailRequest"("customerPhone");

-- CreateIndex
CREATE INDEX "RetailHandoffEvent_requestId_idx" ON "RetailHandoffEvent"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TraderAccount_email_key" ON "TraderAccount"("email");

-- CreateIndex
CREATE INDEX "TraderNotification_traderId_createdAt_idx" ON "TraderNotification"("traderId", "createdAt");

-- CreateIndex
CREATE INDEX "TraderNotification_traderId_readAt_idx" ON "TraderNotification"("traderId", "readAt");

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

-- CreateIndex
CREATE UNIQUE INDEX "WholesaleRequest_reference_key" ON "WholesaleRequest"("reference");

-- CreateIndex
CREATE INDEX "WholesaleRequest_traderId_idx" ON "WholesaleRequest"("traderId");

-- CreateIndex
CREATE INDEX "WholesaleRequest_status_idx" ON "WholesaleRequest"("status");

-- CreateIndex
CREATE INDEX "WholesaleRequest_requestMode_idx" ON "WholesaleRequest"("requestMode");

-- CreateIndex
CREATE INDEX "WholesaleRequestEvent_requestId_idx" ON "WholesaleRequestEvent"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConversation_waChatId_key" ON "WhatsAppConversation"("waChatId");

-- CreateIndex
CREATE INDEX "WhatsAppConversation_lastMessageAt_idx" ON "WhatsAppConversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "WhatsAppConversation_participantE164_idx" ON "WhatsAppConversation"("participantE164");

-- CreateIndex
CREATE INDEX "WhatsAppConversation_linkType_linkId_idx" ON "WhatsAppConversation"("linkType", "linkId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_waMessageId_key" ON "WhatsAppMessage"("waMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_clientRequestId_key" ON "WhatsAppMessage"("clientRequestId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_conversationId_createdAt_idx" ON "WhatsAppMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_status_idx" ON "WhatsAppMessage"("status");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_direction_idx" ON "WhatsAppMessage"("direction");

-- CreateIndex
CREATE INDEX "WhatsAppLinkAudit_conversationId_createdAt_idx" ON "WhatsAppLinkAudit"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppLinkAudit_adminId_idx" ON "WhatsAppLinkAudit"("adminId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailRequest" ADD CONSTRAINT "RetailRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailHandoffEvent" ADD CONSTRAINT "RetailHandoffEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RetailRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailRequestLine" ADD CONSTRAINT "RetailRequestLine_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RetailRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailRequestLine" ADD CONSTRAINT "RetailRequestLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraderNotification" ADD CONSTRAINT "TraderNotification_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "TraderAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealProposal" ADD CONSTRAINT "DealProposal_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "TraderAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealProposal" ADD CONSTRAINT "DealProposal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationEntry" ADD CONSTRAINT "NegotiationEntry_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicCuratedOffer" ADD CONSTRAINT "PublicCuratedOffer_dealProposalId_fkey" FOREIGN KEY ("dealProposalId") REFERENCES "DealProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicCuratedOffer" ADD CONSTRAINT "PublicCuratedOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleRequest" ADD CONSTRAINT "WholesaleRequest_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "TraderAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleRequestLine" ADD CONSTRAINT "WholesaleRequestLine_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WholesaleRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleRequestLine" ADD CONSTRAINT "WholesaleRequestLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleRequestEvent" ADD CONSTRAINT "WholesaleRequestEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WholesaleRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppLinkAudit" ADD CONSTRAINT "WhatsAppLinkAudit_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
