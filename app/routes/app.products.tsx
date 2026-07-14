import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { generateMissingShopifySkus } from "../services/shopify-sku-generator.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [variants, missingSkuCount] = await Promise.all([
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
  ]);
  return { variants, missingSkuCount };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const summary = await generateMissingShopifySkus({
    shop: session.shop,
    accessToken: session.accessToken!,
    admin,
  });

  return { summary };
};

export default function Products() {
  const { variants, missingSkuCount } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <s-page heading="Produits Shopify">
      <s-section heading="SKU automatiques">
        <s-stack gap="base">
          <s-text>Variantes sans SKU en base : {missingSkuCount}</s-text>
          <Form method="post">
            <s-button variant="primary" type="submit" accessibilityLabel="Generer les SKU manquants">
              Generer les SKU manquants
            </s-button>
          </Form>
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
