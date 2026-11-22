import type { ServiceWarrantyType } from '@prisma/client';
import {
  WARRANTY_CARD_ART,
  WARRANTY_CARD_ART_DEFAULT,
} from '@/lib/warranty/card-art-defaults';
import {
  warrantyCardArtUrlWithOverrides,
  type WarrantyCardArtOverrides,
} from '@/lib/warranty/card-art-settings';

export { WARRANTY_CARD_ART, WARRANTY_CARD_ART_DEFAULT };

export function warrantyCardArtUrl(
  type: ServiceWarrantyType,
  overrides?: WarrantyCardArtOverrides,
): string {
  return warrantyCardArtUrlWithOverrides(type, overrides);
}

/** تصویر نمایشی: مسیر ذخیره‌شده در DB، در غیر این صورت قالب نوع خدمت */
export function warrantyCardDisplayImage(
  type: ServiceWarrantyType,
  storedUrl?: string | null,
  overrides?: WarrantyCardArtOverrides,
): string {
  const trimmed = storedUrl?.trim();
  if (trimmed) return trimmed;
  return warrantyCardArtUrl(type, overrides);
}