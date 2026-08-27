import type { Product } from '@/lib/data';

const PLACEHOLDER = '/uploads/placeholder.svg';

export function normalizeProductImage(path?: string | null): string {
  const value = String(path || '').trim();
  if (!value) return PLACEHOLDER;
  if (value.startsWith('http://') || value.startsWith('https://')) return PLACEHOLDER;
  if (value.startsWith('/uploads/')) return value;
  if (value.startsWith('uploads/')) return `/${value}`;
  return PLACEHOLDER;
}

export function productThumbnail(product: Pick<Product, 'image' | 'images'>): string {
  const first = product.images?.[0] || product.image;
  return normalizeProductImage(first);
}

export function productGallery(product: Pick<Product, 'image' | 'images'>): string[] {
  const raw = product.images?.length ? product.images : product.image ? [product.image] : [PLACEHOLDER];
  return raw.map(normalizeProductImage);
}

export function productFamilyKey(product: Pick<Product, 'name'>): string {
  return String(product.name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function formatProductPercent(percent?: number | null): string {
  const value = Number(percent || 0);
  if (!value) return '';
  return `${value.toLocaleString('fa-IR')}٪`;
}

export function productVariantLabel(product: Pick<Product, 'size' | 'discountPercent'>): string {
  const parts: string[] = [];
  if (product.size?.trim()) parts.push(`سایز ${product.size.trim()}`);
  const percent = formatProductPercent(product.discountPercent);
  if (percent) parts.push(percent);
  return parts.join(' · ');
}

export type ProductFamily = {
  key: string;
  name: string;
  variants: Product[];
  representative: Product;
  sizes: string[];
  percents: number[];
  minPrice: number;
  maxPrice: number;
};

export function groupProductsByFamily(products: Product[]): ProductFamily[] {
  const map = new Map<string, Product[]>();
  for (const product of products) {
    const key = productFamilyKey(product);
    const list = map.get(key) || [];
    list.push(product);
    map.set(key, list);
  }

  return Array.from(map.entries()).map(([key, variants]) => {
    const sorted = [...variants].sort((a, b) => a.priceNum - b.priceNum);
    const sizes = Array.from(
      new Set(sorted.map((v) => String(v.size || '').trim()).filter(Boolean)),
    );
    const percents = Array.from(
      new Set(sorted.map((v) => Number(v.discountPercent || 0)).filter((n) => n > 0)),
    ).sort((a, b) => a - b);
    return {
      key,
      name: sorted[0]?.name || key,
      variants: sorted,
      representative: sorted[0],
      sizes,
      percents,
      minPrice: sorted[0]?.priceNum || 0,
      maxPrice: sorted[sorted.length - 1]?.priceNum || 0,
    };
  });
}

export function findProductVariants(
  all: Product[],
  product: Pick<Product, 'name' | 'id'>,
): Product[] {
  const key = productFamilyKey(product);
  return all
    .filter((item) => productFamilyKey(item) === key)
    .sort((a, b) => a.priceNum - b.priceNum);
}

export function resolveVariant(
  variants: Product[],
  size: string,
  percent: number,
): Product | null {
  const sizeNorm = size.trim();
  const exact = variants.find(
    (v) =>
      String(v.size || '').trim() === sizeNorm && Number(v.discountPercent || 0) === percent,
  );
  if (exact) return exact;
  const bySize = variants.find((v) => String(v.size || '').trim() === sizeNorm);
  if (bySize) return bySize;
  return variants[0] || null;
}
