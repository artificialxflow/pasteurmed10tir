import type { Product as PrismaProduct, ProductCategory } from '@prisma/client';
import { ensureUniqueSlug, slugifyFa } from '@/lib/content/product-slug';

export type ProductDto = {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  categoryId: number | null;
  categorySlug: string | null;
  price: string;
  priceNum: number;
  stock: number;
  image: string;
  images: string[];
  active: boolean;
  sortOrder: number;
};

export type ProductCategoryDto = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
};

type ProductRow = PrismaProduct & { categoryRel?: ProductCategory | null };

const PLACEHOLDER = '/uploads/placeholder.svg';

export function normalizeUploadPath(path: string): string {
  const value = String(path || '').trim();
  if (!value) return PLACEHOLDER;
  if (value.startsWith('http://') || value.startsWith('https://')) return PLACEHOLDER;
  if (value.startsWith('/uploads/')) return value;
  if (value.startsWith('uploads/')) return `/${value}`;
  return PLACEHOLDER;
}

export function isAllowedProductImage(path: string): boolean {
  const value = String(path || '').trim();
  if (!value) return true;
  return value.startsWith('/uploads/') || value.startsWith('uploads/');
}

export { slugifyFa, ensureUniqueSlug } from '@/lib/content/product-slug';

export function productImages(row: ProductRow): string[] {
  const raw = row.images?.length ? row.images : row.image ? [row.image] : [PLACEHOLDER];
  return raw.map(normalizeUploadPath);
}

export function toProductDto(row: ProductRow): ProductDto {
  const images = productImages(row);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    category: row.categoryRel?.name || row.category,
    categoryId: row.categoryId,
    categorySlug: row.categoryRel?.slug ?? null,
    price: row.price,
    priceNum: row.priceNum,
    stock: row.stock,
    image: images[0] || PLACEHOLDER,
    images,
    active: row.active,
    sortOrder: row.sortOrder,
  };
}

export function toCategoryDto(row: ProductCategory): ProductCategoryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    active: row.active,
  };
}

export type ProductInput = {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  categoryId?: number | null;
  price: string;
  priceNum: number;
  stock: number;
  image?: string;
  images?: string[];
  active?: boolean;
  sortOrder?: number;
};

export function sanitizeProductInput(
  item: ProductInput,
  categories: ProductCategory[],
  takenSlugs: Set<string>,
): {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  categoryId: number | null;
  price: string;
  priceNum: number;
  stock: number;
  image: string;
  images: string[];
  active: boolean;
  sortOrder: number;
} | null {
  const name = String(item.name || '').trim();
  if (!name) return null;

  const categoryById = categories.find((c) => c.id === Number(item.categoryId));
  const categoryName =
    categoryById?.name || String(item.category || categories[0]?.name || 'دندانپزشکی').trim();
  const categoryId = categoryById?.id ?? categories.find((c) => c.name === categoryName)?.id ?? null;

  const rawImages = (item.images?.length ? item.images : item.image ? [item.image] : [])
    .map((img) => String(img || '').trim())
    .filter(Boolean)
    .filter(isAllowedProductImage);

  const images = rawImages.length ? rawImages.map(normalizeUploadPath) : [PLACEHOLDER];
  const image = images[0];

  const slugBase = String(item.slug || '').trim() || slugifyFa(name);
  const slug =
    slugBase && !takenSlugs.has(slugBase)
      ? (takenSlugs.add(slugBase), slugBase)
      : ensureUniqueSlug(slugBase || name, takenSlugs);

  return {
    id: Number(item.id),
    name,
    slug,
    description: String(item.description || '').trim(),
    category: categoryName,
    categoryId,
    price: String(item.price || '').trim(),
    priceNum: Number(item.priceNum || 0),
    stock: Number(item.stock || 0),
    image,
    images,
    active: item.active !== false,
    sortOrder: Number(item.sortOrder || 0),
  };
}
