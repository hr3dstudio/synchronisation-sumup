import type { AdminGraphqlClient } from "./shopify-inventory.server";

export async function fetchPrimaryLocationId(admin: AdminGraphqlClient) {
  const response = await admin.graphql(`#graphql
    query locations {
      locations(first: 1) {
        nodes { id name }
      }
    }`);
  const json = await response.json();
  return json?.data?.locations?.nodes?.[0]?.id ?? null;
}
