import { describe, expect, it } from "vitest";
import { findBestMapping, productFingerprint } from "../app/services/product-mapping.server";

describe("productFingerprint", () => {
  it("normalise les accents, espaces et casse", () => {
    expect(productFingerprint({ sku: " Café-001 ", name: "Café Moulu" })).toBe("cafe 001|cafe moulu");
  });

  it("reste stable avec les champs vides", () => {
    expect(productFingerprint({ id: "ABC", sku: "", name: null })).toBe("abc");
  });
});

describe("findBestMapping", () => {
  it("priorise l'empreinte exacte", () => {
    const mapping = findBestMapping(
      { id: "sumup-1", sku: "SKU-1", name: "Produit" },
      [{ shopifyVariantId: "variant-1", fingerprint: "sumup 1|sku 1|produit", title: "Produit" }],
    );
    expect(mapping?.shopifyVariantId).toBe("variant-1");
  });

  it("utilise le SKU comme secours", () => {
    const mapping = findBestMapping(
      { sku: "ABC" },
      [{ shopifyVariantId: "variant-2", fingerprint: "autre", sku: "abc", title: "Produit" }],
    );
    expect(mapping?.shopifyVariantId).toBe("variant-2");
  });
});
