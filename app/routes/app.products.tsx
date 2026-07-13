import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return prisma.shopifyVariant.findMany({
    where: { shop: session.shop },
    take: 50,
    orderBy: { updatedAt: "desc" },
  });
};

export default function Products() {
  const variants = useLoaderData<typeof loader>();

  return (
    <s-page heading="Produits Shopify">
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
