import type { Product } from "@/lib/data";

export type ShopCategoryGroup = {
  id: number;
  name: string;
  slug: string;
  products: Product[];
};

type CategoryRef = {
  id: number;
  name: string;
  slug: string;
};

function productMatchesCategory(product: Product, category: CategoryRef): boolean {
  return (
    product.categoryId === category.id ||
    product.category === category.name ||
    product.categorySlug === category.slug ||
    product.categorySlug === category.name
  );
}

export function groupProductsByCategory(
  products: Product[],
  categories: CategoryRef[],
  maxPerCategory = 4,
): ShopCategoryGroup[] {
  const used = new Set<number>();

  const groups = categories
    .map((category) => {
      const items = products.filter((product) => {
        if (used.has(product.id)) return false;
        return productMatchesCategory(product, category);
      });
      items.forEach((product) => used.add(product.id));
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        products: items.slice(0, maxPerCategory),
      };
    })
    .filter((group) => group.products.length > 0);

  const remaining = products.filter((product) => !used.has(product.id));
  if (remaining.length) {
    groups.push({
      id: 0,
      name: "سایر محصولات",
      slug: "other",
      products: remaining.slice(0, maxPerCategory),
    });
  }

  return groups;
}

export function catalogCategoryHref(catalogPath: string, categoryName: string): string {
  const q = new URLSearchParams({ cat: categoryName });
  return `${catalogPath}?${q.toString()}`;
}
