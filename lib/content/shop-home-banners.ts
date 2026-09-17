export type ShopHomeBanner = {
  image: string;
  href?: string;
  title?: string;
};

export function parseShopHomeBanners(raw: unknown): ShopHomeBanner[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const image = String(row.image || "").trim();
      if (!image) return null;
      return {
        image,
        href: String(row.href || "").trim() || undefined,
        title: String(row.title || "").trim() || undefined,
      };
    })
    .filter((item): item is ShopHomeBanner => Boolean(item));
}
