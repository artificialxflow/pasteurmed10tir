export const SHOP_FEATURED_PRODUCTS_MAX = 8;

export function parseShopFeaturedProductIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  const seen = new Set<number>();
  for (const item of raw) {
    const id = Math.round(Number(item));
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= SHOP_FEATURED_PRODUCTS_MAX) break;
  }
  return out;
}
