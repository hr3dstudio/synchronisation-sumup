import prisma from "../db.server";
import { productFingerprint } from "./product-mapping.server";
import type { AdminGraphqlClient } from "./shopify-inventory.server";

type ShopifyProductNode = {
  id: string;
  title: string;
  handle?: string | null;
  status?: string | null;
  variants: {
    nodes: Array<{
      id: string;
      title: string;
      sku?: string | null;
      inventoryItem?: { id: string } | null;
    }>;
  };
};

type ProductPage = {
  nodes: ShopifyProductNode[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor?: string | null;
  };
};

export type GeneratedSkuSummary = {
  productsScanned: number;
  variantsScanned: number;
  generatedCount: number;
  skippedWithSku: number;
  errors: string[];
};

const normalizeForSku = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);

const numericIdFromGid = (gid: string) => gid.split("/").pop() ?? gid;

function generatedSku(product: ShopifyProductNode, variantId: string) {
  const titlePart = normalizeForSku(product.title) || "ARTICLE";
  const variantPart = numericIdFromGid(variantId).slice(-8);
  return `MP-${titlePart}-${variantPart}`;
}

async function fetchProductPage(
  admin: AdminGraphqlClient,
  after?: string | null,
): Promise<ProductPage> {
  const response = await admin.graphql(
    `#graphql
    query productsForSkuGeneration($after: String) {
      products(first: 100, after: $after) {
        nodes {
          id
          title
          handle
          status
          variants(first: 100) {
            nodes {
              id
              title
              sku
              inventoryItem { id }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }`,
    { variables: { after } },
  );
  const json = await response.json();
  const errors = json?.errors;
  if (errors?.length) {
    throw new Error(errors.map((error: { message: string }) => error.message).join(", "));
  }
  return json.data.products;
}

async function updateVariantSku(
  shop: string,
  accessToken: string,
  variantId: string,
  sku: string,
) {
  const numericVariantId = numericIdFromGid(variantId);
  const response = await fetch(
    `https://${shop}/admin/api/2025-10/variants/${numericVariantId}.json`,
    {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        variant: {
          id: Number(numericVariantId),
          sku,
        },
      }),
    },
  );

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Variant ${numericVariantId}: ${JSON.stringify(json.errors ?? json)}`);
  }
}

async function upsertLocalProduct(
  shop: string,
  product: ShopifyProductNode,
) {
  return prisma.shopifyProduct.upsert({
    where: { shop_productId: { shop, productId: product.id } },
    update: {
      title: product.title,
      handle: product.handle,
      status: product.status,
    },
    create: {
      shop,
      productId: product.id,
      title: product.title,
      handle: product.handle,
      status: product.status,
    },
  });
}

export async function generateMissingShopifySkus(input: {
  shop: string;
  accessToken: string;
  admin: AdminGraphqlClient;
}): Promise<GeneratedSkuSummary> {
  const summary: GeneratedSkuSummary = {
    productsScanned: 0,
    variantsScanned: 0,
    generatedCount: 0,
    skippedWithSku: 0,
    errors: [],
  };

  let after: string | null | undefined;
  do {
    const page = await fetchProductPage(input.admin, after);
    for (const product of page.nodes) {
      summary.productsScanned++;
      const dbProduct = await upsertLocalProduct(input.shop, product);

      for (const variant of product.variants.nodes) {
        summary.variantsScanned++;
        const existingSku = variant.sku?.trim();
        const sku = existingSku || generatedSku(product, variant.id);

        if (existingSku) {
          summary.skippedWithSku++;
        } else {
          try {
            await updateVariantSku(input.shop, input.accessToken, variant.id, sku);
            summary.generatedCount++;
          } catch (error) {
            summary.errors.push(error instanceof Error ? error.message : String(error));
            continue;
          }
        }

        await prisma.shopifyVariant.upsert({
          where: { shop_variantId: { shop: input.shop, variantId: variant.id } },
          update: {
            productId: dbProduct.id,
            inventoryItemId: variant.inventoryItem?.id,
            sku,
            title: variant.title,
            fingerprint: productFingerprint({ sku, name: variant.title }),
          },
          create: {
            shop: input.shop,
            productId: dbProduct.id,
            variantId: variant.id,
            inventoryItemId: variant.inventoryItem?.id,
            sku,
            title: variant.title,
            fingerprint: productFingerprint({ sku, name: variant.title }),
          },
        });
      }
    }
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);

  return summary;
}
