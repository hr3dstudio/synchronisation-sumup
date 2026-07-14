import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { useMemo, useState } from "react";
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
  const [selectedMode, setSelectedMode] = useState<"all" | "collection" | "products">("all");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const productsWithMissingSku = useMemo(
    () =>
      catalog.products.map((product) => ({
        ...product,
        missingSkuCount: product.variants.filter((variant) => !variant.sku?.trim()).length,
      })),
    [catalog.products],
  );

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    if (!search) return productsWithMissingSku;
    return productsWithMissingSku.filter((product) =>
      product.title.toLowerCase().includes(search),
    );
  }, [productSearch, productsWithMissingSku]);

  const selectedProductsMissingSkuCount = productsWithMissingSku
    .filter((product) => selectedProductIds.includes(product.id))
    .reduce((total, product) => total + product.missingSkuCount, 0);

  const selectedCollection = catalog.collections.find(
    (collection) => collection.id === selectedCollectionId,
  );

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((currentIds) =>
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId],
    );
  };

  return (
    <s-page heading="Produits Shopify">
      <style>{`
        .sku-panel {
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          padding: 16px;
          background: #ffffff;
        }

        .sku-choice-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        }

        .sku-choice {
          display: block;
          min-height: 78px;
          padding: 12px;
          border: 1px solid #c9c9c9;
          border-radius: 8px;
          cursor: pointer;
        }

        .sku-choice:has(input:checked) {
          border-color: #008060;
          background: #f1f8f5;
        }

        .sku-choice-title {
          display: block;
          margin-bottom: 4px;
          font-weight: 650;
        }

        .sku-choice-note {
          display: block;
          color: #616161;
          font-size: 13px;
        }

        .sku-menu-field {
          display: grid;
          gap: 8px;
          margin-top: 14px;
        }

        .sku-menu-field label {
          font-weight: 650;
        }

        .sku-select,
        .sku-search {
          width: 100%;
          min-height: 38px;
          border: 1px solid #c9c9c9;
          border-radius: 6px;
          padding: 8px 10px;
          font: inherit;
        }

        .sku-product-list {
          display: grid;
          max-height: 310px;
          overflow: auto;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
        }

        .sku-product-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 10px 12px;
          border-bottom: 1px solid #eeeeee;
        }

        .sku-product-row:last-child {
          border-bottom: 0;
        }

        .sku-product-title {
          display: block;
          font-weight: 600;
        }

        .sku-summary {
          border-radius: 8px;
          background: #f7f7f7;
          padding: 10px 12px;
        }
      `}</style>
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
                <div className="sku-panel">
                  <s-stack gap="base">
                    <s-text>Choisis ce que tu veux traiter</s-text>

                    <div className="sku-choice-grid">
                      <label className="sku-choice">
                        <input
                          type="radio"
                          name="mode"
                          value="all"
                          checked={selectedMode === "all"}
                          onChange={() => setSelectedMode("all")}
                        />{" "}
                        <span className="sku-choice-title">Tous les articles</span>
                        <span className="sku-choice-note">
                          Genere les SKU manquants sur toute la boutique.
                        </span>
                      </label>

                      <label className="sku-choice">
                        <input
                          type="radio"
                          name="mode"
                          value="collection"
                          checked={selectedMode === "collection"}
                          onChange={() => setSelectedMode("collection")}
                        />{" "}
                        <span className="sku-choice-title">Une collection</span>
                        <span className="sku-choice-note">
                          Choisis une collection precise avant de lancer.
                        </span>
                      </label>

                      <label className="sku-choice">
                        <input
                          type="radio"
                          name="mode"
                          value="products"
                          checked={selectedMode === "products"}
                          onChange={() => setSelectedMode("products")}
                        />{" "}
                        <span className="sku-choice-title">Articles precis</span>
                        <span className="sku-choice-note">
                          Coche seulement les articles que tu veux modifier.
                        </span>
                      </label>
                    </div>

                    {selectedMode === "collection" && (
                      <div className="sku-menu-field">
                        <label htmlFor="sku-collection">Collection</label>
                        <select
                          className="sku-select"
                          id="sku-collection"
                          name="collectionId"
                          value={selectedCollectionId}
                          onChange={(event) => setSelectedCollectionId(event.currentTarget.value)}
                        >
                          <option value="">Choisir une collection</option>
                          {catalog.collections.map((collection) => (
                            <option key={collection.id} value={collection.id}>
                              {collection.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedMode === "products" && (
                      <div className="sku-menu-field">
                        <label htmlFor="sku-product-search">Articles</label>
                        <input
                          className="sku-search"
                          id="sku-product-search"
                          type="search"
                          placeholder="Rechercher un article"
                          value={productSearch}
                          onChange={(event) => setProductSearch(event.currentTarget.value)}
                        />
                        <div className="sku-product-list">
                          {filteredProducts.map((product) => (
                            <label className="sku-product-row" key={product.id}>
                              <input
                                type="checkbox"
                                name="productIds"
                                value={product.id}
                                checked={selectedProductIds.includes(product.id)}
                                onChange={() => toggleProduct(product.id)}
                              />
                              <span>
                                <span className="sku-product-title">{product.title}</span>
                                <span className="sku-choice-note">
                                  {product.missingSkuCount} variante(s) sans SKU
                                </span>
                              </span>
                            </label>
                          ))}
                          {filteredProducts.length === 0 && (
                            <div className="sku-product-row">Aucun article trouve.</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="sku-summary">
                      {selectedMode === "all" && (
                        <s-text>
                          Pret a traiter tous les articles avec SKU manquant : {missingSkuCount}.
                        </s-text>
                      )}
                      {selectedMode === "collection" && (
                        <s-text>
                          Collection choisie : {selectedCollection?.title ?? "aucune"}.
                        </s-text>
                      )}
                      {selectedMode === "products" && (
                        <s-text>
                          Articles choisis : {selectedProductIds.length} / Variantes sans SKU dans
                          ces articles : {selectedProductsMissingSkuCount}.
                        </s-text>
                      )}
                    </div>
                  </s-stack>
                </div>

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
