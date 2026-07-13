-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyProduct" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyVariant" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "title" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMapping" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "sumupProductId" TEXT,
    "sumupSku" TEXT,
    "sumupName" TEXT NOT NULL,
    "sumupFingerprint" TEXT NOT NULL,
    "shopifyVariantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SumupTransaction" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "sumupTransactionId" TEXT NOT NULL,
    "transactionCode" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SumupTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SumupTransactionItem" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "sumupLineId" TEXT NOT NULL,
    "sumupProductId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SumupTransactionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "transactionItemId" TEXT NOT NULL,
    "shopifyInventoryItemId" TEXT,
    "shopifyLocationId" TEXT,
    "quantityDelta" INTEGER NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "graphqlRequest" JSONB,
    "graphqlResponse" JSONB,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "scannedCount" INTEGER NOT NULL DEFAULT 0,
    "adjustedCount" INTEGER NOT NULL DEFAULT 0,
    "interventionCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "runId" TEXT,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SynchronizationLock" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SynchronizationLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualIntervention" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_shop_key_key" ON "AppSetting"("shop", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyProduct_shop_productId_key" ON "ShopifyProduct"("shop", "productId");

-- CreateIndex
CREATE INDEX "ShopifyVariant_shop_fingerprint_idx" ON "ShopifyVariant"("shop", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyVariant_shop_variantId_key" ON "ShopifyVariant"("shop", "variantId");

-- CreateIndex
CREATE INDEX "ProductMapping_shop_enabled_idx" ON "ProductMapping"("shop", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMapping_shop_sumupFingerprint_key" ON "ProductMapping"("shop", "sumupFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "SumupTransaction_shop_sumupTransactionId_key" ON "SumupTransaction"("shop", "sumupTransactionId");

-- CreateIndex
CREATE INDEX "SumupTransactionItem_shop_fingerprint_idx" ON "SumupTransactionItem"("shop", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "SumupTransactionItem_shop_sumupLineId_key" ON "SumupTransactionItem"("shop", "sumupLineId");

-- CreateIndex
CREATE UNIQUE INDEX "StockAdjustment_shop_idempotencyKey_key" ON "StockAdjustment"("shop", "idempotencyKey");

-- CreateIndex
CREATE INDEX "SyncLog_shop_createdAt_idx" ON "SyncLog"("shop", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SynchronizationLock_shop_name_key" ON "SynchronizationLock"("shop", "name");

-- CreateIndex
CREATE INDEX "ManualIntervention_shop_status_idx" ON "ManualIntervention"("shop", "status");

-- AddForeignKey
ALTER TABLE "ShopifyVariant" ADD CONSTRAINT "ShopifyVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopifyProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMapping" ADD CONSTRAINT "ProductMapping_shopifyVariantId_fkey" FOREIGN KEY ("shopifyVariantId") REFERENCES "ShopifyVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SumupTransactionItem" ADD CONSTRAINT "SumupTransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "SumupTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "SumupTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_transactionItemId_fkey" FOREIGN KEY ("transactionItemId") REFERENCES "SumupTransactionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SyncRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

