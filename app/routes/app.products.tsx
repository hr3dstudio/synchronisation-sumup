import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { useState } from "react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import {
  fetchSkuGenerationCatalog,
  generateMissingShopifySkus,
  type SkuGenerationSelection,
} from "../services/shopify-sku-generator.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const [variants, missingSkuCount, catalog] = await Promise.all([
    prisma.shopifyVariant.findMany({
      where: { shop: session.shop },
      take: 50,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.shopifyVariant.count({
      where: {
        shop: session.shop,
        OR: [{ sku: null }, { sku: "" }],
      },
    }),
    fetchSkuGenerationCatalog(admin),
  ]);
  return { variants, missingSkuCount, catalog };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const mode = String(formData.get("mode") ?? "all");
  const collectionId = String(formData.get("collectionId") ?? "");
  const productIds = formData.getAll("productIds").map(String);
  const selection: SkuGenerationSelection =
    mode === "collection" && collectionId
      ? {
          mode: "collection",
          collectionId,
        }
      : mode === "products" && productIds.length > 0
        ? {
            mode: "products",
            productIds,
          }
        : { mode: "all" };

  const summary = await generateMissingShopifySkus({
    shop: session.shop,
    accessToken: session.accessToken!,
    admin,
    selection,
  });

  return { summary };
};

export default function Products() {
  const { variants, missingSkuCount, catalog } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isSkuMenuOpen, setIsSkuMenuOpen] = useState(false);

  return (
    <s-page heading="Produits Shopify">
      <s-section heading="SKU automatiques">
        <s-stack gap="base">
          <s-text>Variantes sans SKU en base : {missingSkuCount}</s-text>
          {!isSkuMenuOpen && (
            <s-button
              variant="primary"
              type="button"
              accessibilityLabel="Ouvrir le menu de generation des SKU"
              onClick={() => setIsSkuMenuOpen(true)}
            >
              Choisir les articles a traiter
            </s-button>
          )}

          {isSkuMenuOpen && (
            <Form method="post">
              <s-stack gap="base">
                <fieldset>
                  <legend>Generer les SKU pour</legend>

                  <div>
                    <label>
                      <input type="radio" name="mode" value="all" defaultChecked /> Tous les
                      articles
                    </label>
                  </div>

                  <div>
                    <label>
                      <input type="radio" name="mode" value="collection" /> Une collection
                    </label>
                  </div>
                  <div>
                    <select name="collectionId">
                      <option value="">Choisir une collection</option>
                      {catalog.collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>
                      <input type="radio" name="mode" value="products" /> Articles choisis
                    </label>
                  </div>
                  <div>
                    {catalog.products.map((product) => {
                      const missingCount = product.variants.filter(
                        (variant) => !variant.sku?.trim(),
                      ).length;
                      return (
                        <div key={product.id}>
                          <label>
                            <input type="checkbox" name="productIds" value={product.id} />{" "}
                            {product.title} ({missingCount} sans SKU)
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>

                <s-stack direction="inline" gap="base">
                  <s-button
                    variant="primary"
                    type="submit"
                    accessibilityLabel="Generer les SKU manquants"
                  >
                    Generer les SKU manquants
                  </s-button>
                  <s-button
                    type="button"
                    accessibilityLabel="Fermer le menu de generation des SKU"
                    onClick={() => setIsSkuMenuOpen(false)}
                  >
                    Fermer
                  </s-button>
                </s-stack>
              </s-stack>
            </Form>
          )}
          {actionData?.summary && (
            <s-text>
              SKU generes : {actionData.summary.generatedCount} / Variantes analysees :{" "}
              {actionData.summary.variantsScanned} / Erreurs : {actionData.summary.errors.length}
            </s-text>
          )}
        </s-stack>
      </s-section>

      <s-section>
        <s-table>
          <s-table-header-row>
            <s-table-header>Titre</s-table-header>
            <s-table-header>SKU</s-table-header>
            <s-table-header>Inventory item</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {variants.map((variant) => (
              <s-table-row key={variant.id}>
                <s-table-cell>{variant.title}</s-table-cell>
                <s-table-cell>{variant.sku ?? "-"}</s-table-cell>
                <s-table-cell>{variant.inventoryItemId ?? "-"}</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}
