import { describe, expect, it } from "vitest";
import { findBestMapping } from "../app/services/product-mapping.server";

describe("findBestMapping", () => {
  it("does not match empty SumUp sku or barcode to empty Shopify fields", () => {
    const match = findBestMapping(
      { name: "BRACELET DE PROTECTION CITRONELLE 5-7 JOURS" },
      [
        {
          shopifyVariantId: "variant-1",
          inventoryItemId: "inventory-1",
          fingerprint: "luxe noir au ginseng",
          sku: "MP-GEL-DOUCHE-650ML-P-52194638",
          barcode: null,
          title: "LUXE NOIR AU GINSENG",
        },
      ],
    );

    expect(match).toBeNull();
  });

  it("matches by exact sku when SumUp provides a sku", () => {
    const match = findBestMapping(
      { name: "Produit", sku: "ABC-123" },
      [
        {
          shopifyVariantId: "variant-1",
          inventoryItemId: "inventory-1",
          fingerprint: "autre",
          sku: "ABC-123",
          barcode: null,
          title: "Produit Shopify",
        },
      ],
    );

    expect(match?.shopifyVariantId).toBe("variant-1");
  });
});
