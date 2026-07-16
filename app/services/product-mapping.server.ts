export type ProductIdentity = {
  id?: string | null;
  sku?: string | null;
  barcode?: string | null;
  name?: string | null;
};

const normalize = (value?: string | null) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function productFingerprint(product: ProductIdentity) {
  const stableParts = [
    normalize(product.id),
    normalize(product.sku),
    normalize(product.barcode),
    normalize(product.name),
  ].filter(Boolean);

  return stableParts.join("|");
}

export type MappingCandidate = {
  shopifyVariantId: string;
  inventoryItemId?: string | null;
  fingerprint: string;
  sku?: string | null;
  barcode?: string | null;
  productTitle?: string | null;
  title: string;
};

export function findBestMapping(
  item: ProductIdentity,
  candidates: MappingCandidate[],
) {
  const fingerprint = productFingerprint(item);
  const normalizedSku = normalize(item.sku);
  const normalizedBarcode = normalize(item.barcode);
  const normalizedName = normalize(item.name);

  return (
    (normalizedSku
      ? candidates.find((candidate) => normalize(candidate.sku) === normalizedSku)
      : null) ??
    (normalizedBarcode
      ? candidates.find((candidate) => normalize(candidate.barcode) === normalizedBarcode)
      : null) ??
    (normalizedName
      ? candidates.find((candidate) => {
          const productTitle = normalize(candidate.productTitle);
          const variantTitle = normalize(candidate.title);
          const combinedTitle =
            productTitle && variantTitle && variantTitle !== "default title"
              ? `${productTitle} ${variantTitle}`
              : productTitle;

          return normalizedName === productTitle || normalizedName === combinedTitle;
        })
      : null) ??
    candidates.find((candidate) => candidate.fingerprint === fingerprint) ??
    null
  );
}
