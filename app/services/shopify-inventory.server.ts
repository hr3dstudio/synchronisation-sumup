export type AdminGraphqlClient = {
  graphql: (query: string, options?: any) => Promise<Response>;
};

export async function adjustInventory(
  admin: AdminGraphqlClient,
  input: {
    inventoryItemId: string;
    locationId: string;
    delta: number;
  },
) {
  const response = await admin.graphql(
    `#graphql
    mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        userErrors { field message }
      }
    }`,
    {
      variables: {
        input: {
          name: "available",
          reason: "correction",
          changes: [
            {
              inventoryItemId: input.inventoryItemId,
              locationId: input.locationId,
              delta: input.delta,
            },
          ],
        },
      },
    },
  );

  const json = await response.json();
  const errors = json?.data?.inventoryAdjustQuantities?.userErrors ?? [];
  if (errors.length > 0) {
    throw new Error(errors.map((error: { message: string }) => error.message).join(", "));
  }

  return json;
}
