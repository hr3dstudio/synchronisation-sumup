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
          productTitle: "GEL DOUCHE 650ML",
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
          productTitle: "Produit Shopify",
          title: "Produit Shopify",
        },
      ],
    );

    expect(match?.shopifyVariantId).toBe("variant-1");
  });

  it("matches exact SumUp name to Shopify product title", () => {
    const match = findBestMapping(
      { name: "BRACELET DE PROTECTION CITRONELLE 5-7 JOURS" },
      [
        {
          shopifyVariantId: "variant-bracelet",
          inventoryItemId: "inventory-bracelet",
          fingerprint: "default title",
          sku: "MP-BRACELET-DE-PROTEC-76089422",
          barcode: null,
          productTitle: "BRACELET DE PROTECTION CITRONELLE 5-7 JOURS",
          title: "Default Title",
        },
      ],
    );

    expect(match?.shopifyVariantId).toBe("variant-bracelet");
  });
});
