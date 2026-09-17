export type ShopHomeBanner = {
  image: string;
  href?: string;
  title?: string;
};

export function parseShopHomeBanners(raw: unknown): ShopHomeBanner[] {
  if (!Array.isArray(raw)) return [];
  const out: ShopHomeBanner[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const image = String(row.image || "").trim();
    if (!image) continue;
    out.push({
      image,
      href: String(row.href || "").trim() || undefined,
      title: String(row.title || "").trim() || undefined,
    });
  }
  return out;
}
