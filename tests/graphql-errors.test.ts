import { describe, expect, it } from "vitest";
import { adjustInventory } from "../app/services/shopify-inventory.server";

describe("adjustInventory", () => {
  it("remonte les erreurs GraphQL Shopify", async () => {
    await expect(
      adjustInventory(
        {
          graphql: async () =>
            Response.json({
              data: {
                inventoryAdjustQuantities: {
                  userErrors: [{ message: "Inventory item introuvable" }],
                },
              },
            }),
        },
        { inventoryItemId: "gid://shopify/InventoryItem/1", locationId: "gid://shopify/Location/1", delta: -1 },
      ),
    ).rejects.toThrow("Inventory item introuvable");
  });
});
