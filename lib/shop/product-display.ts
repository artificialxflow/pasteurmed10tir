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
