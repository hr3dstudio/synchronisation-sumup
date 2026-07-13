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
  title: string;
};

export function findBestMapping(
  item: ProductIdentity,
  candidates: MappingCandidate[],
) {
  const fingerprint = productFingerprint(item);
  return (
    candidates.find((candidate) => candidate.fingerprint === fingerprint) ??
    candidates.find((candidate) => normalize(candidate.sku) === normalize(item.sku)) ??
    candidates.find(
      (candidate) => normalize(candidate.barcode) === normalize(item.barcode),
    ) ??
    null
  );
}
