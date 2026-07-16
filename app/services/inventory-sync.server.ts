import prisma from "../db.server";
import { findBestMapping, productFingerprint } from "./product-mapping.server";
import { adjustInventory, type AdminGraphqlClient } from "./shopify-inventory.server";
import { fetchPrimaryLocationId } from "./shopify-products.server";
import { createIdempotencyKey, isRefund, stockDelta } from "./sync-rules.server";
import { SumupClient, type SumupTransactionDto } from "./sumup-client.server";
import { withSynchronizationLock } from "./synchronization-lock.server";
import { isDryRunEnabled } from "../utils/env.server";

export type SyncOptions = {
  shop: string;
  admin: AdminGraphqlClient;
  source: "cron" | "manual";
  dryRun?: boolean;
  lookbackMinutes?: number;
  transactions?: SumupTransactionDto[];
};

export async function synchronizeInventory(options: SyncOptions) {
  const dryRun = options.dryRun ?? isDryRunEnabled();
  const lookbackMinutes = options.lookbackMinutes ?? Number(process.env.SYNC_LOOKBACK_MINUTES ?? 15);
  const autoRestockFullRefunds = process.env.AUTO_RESTOCK_FULL_REFUNDS === "true";

  return withSynchronizationLock(options.shop, "sumup-sync", async () => {
    const run = await prisma.syncRun.create({
      data: { shop: options.shop, source: options.source, status: "RUNNING", dryRun },
    });

    try {
      const since = new Date(Date.now() - lookbackMinutes * 60 * 1000);
      const transactions = options.transactions ?? (await new SumupClient().transactions(since));
      const locationId = await fetchPrimaryLocationId(options.admin);
      let adjustedCount = 0;
      let interventionCount = 0;

      const candidates = await prisma.shopifyVariant.findMany({
        where: { shop: options.shop },
        select: {
          id: true,
          inventoryItemId: true,
          fingerprint: true,
          sku: true,
          barcode: true,
          title: true,
          product: { select: { title: true } },
        },
      }).then((variants) =>
        variants.map((variant) => ({
          ...variant,
          productTitle: variant.product.title,
          shopifyVariantId: variant.id,
        })),
      );

      for (const transaction of transactions) {
        const savedTransaction = await prisma.sumupTransaction.upsert({
          where: {
            shop_sumupTransactionId: {
              shop: options.shop,
              sumupTransactionId: transaction.id,
            },
          },
          update: { raw: (transaction.raw ?? transaction) as object },
          create: {
            shop: options.shop,
            sumupTransactionId: transaction.id,
            transactionCode: transaction.transaction_code,
            type: transaction.type,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
            raw: (transaction.raw ?? transaction) as object,
            occurredAt: new Date(transaction.timestamp),
          },
        });

        if (!transaction.items?.length) {
          interventionCount++;
          await prisma.manualIntervention.create({
            data: {
              shop: options.shop,
              type: "SUMUP_TRANSACTION_WITHOUT_ITEMS",
              title: `Transaction SumUp sans detail produit ${transaction.id}`,
              description: "La transaction ne contient pas de lignes produit exploitables.",
              payload: transaction as object,
            },
          });
          continue;
        }

        for (const item of transaction.items) {
          const fingerprint = productFingerprint({
            id: item.product_id,
            sku: item.sku,
            name: item.name,
          });
          const savedItem = await prisma.sumupTransactionItem.upsert({
            where: { shop_sumupLineId: { shop: options.shop, sumupLineId: item.id } },
            update: { raw: (item.raw ?? item) as object },
            create: {
              shop: options.shop,
              transactionId: savedTransaction.id,
              sumupLineId: item.id,
              sumupProductId: item.product_id,
              name: item.name,
              sku: item.sku,
              quantity: item.quantity,
              fingerprint,
              raw: (item.raw ?? item) as object,
            },
          });

          const mapped = await prisma.productMapping.findFirst({
            where: { shop: options.shop, sumupFingerprint: fingerprint, enabled: true },
            include: { variant: true },
          });
          const fallback = mapped?.variant
            ? null
            : findBestMapping({ id: item.product_id, sku: item.sku, name: item.name }, candidates);
          const inventoryItemId = mapped?.variant.inventoryItemId ?? fallback?.inventoryItemId;

          if (!inventoryItemId || !locationId) {
            interventionCount++;
            await prisma.manualIntervention.create({
              data: {
                shop: options.shop,
                type: "MISSING_PRODUCT_MAPPING",
                title: `Correspondance manquante pour ${item.name}`,
                description: "Associez cette ligne SumUp a une variante Shopify avant synchronisation.",
                payload: { transaction, item } as object,
              },
            });
            continue;
          }

          const delta = stockDelta(item.quantity, isRefund(transaction), autoRestockFullRefunds);
          if (delta === 0) continue;

          const idempotencyKey = createIdempotencyKey(transaction.id, item.id, delta);
          const adjustment = await prisma.stockAdjustment
            .create({
              data: {
                shop: options.shop,
                idempotencyKey,
                transactionId: savedTransaction.id,
                transactionItemId: savedItem.id,
                shopifyInventoryItemId: inventoryItemId,
                shopifyLocationId: locationId,
                quantityDelta: delta,
                dryRun,
                status: dryRun ? "DRY_RUN" : "PENDING",
              },
            })
            .catch(() =>
              prisma.stockAdjustment.findUnique({
                where: {
                  shop_idempotencyKey: {
                    shop: options.shop,
                    idempotencyKey,
                  },
                },
              }),
            );

          if (!adjustment) continue;
          if (adjustment.status === "APPLIED") continue;

          if (!dryRun) {
            const graphqlResponse = await adjustInventory(options.admin, {
              inventoryItemId,
              locationId,
              delta,
            });
            await prisma.stockAdjustment.update({
              where: { id: adjustment.id },
              data: { dryRun: false, status: "APPLIED", graphqlResponse },
            });
          }

          adjustedCount++;
        }
      }

      return prisma.syncRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCESS",
          finishedAt: new Date(),
          scannedCount: transactions.length,
          adjustedCount,
          interventionCount,
        },
      });
    } catch (error) {
      await prisma.syncRun.update({
        where: { id: run.id },
        data: {
          status: "ERROR",
          finishedAt: new Date(),
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  });
}
