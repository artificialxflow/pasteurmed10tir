import type { ServiceWarrantyType } from '@prisma/client';

/**
 * قالب ثابت کارت گارانتی (mock کارفرما — updates/35/10/گارانتی)
 * root_canal←07, crown←02, implant←01, laminate←10, denture←04, orthodontics←05
 */
export const WARRANTY_CARD_ART: Record<ServiceWarrantyType, string> = {
  root_canal: '/warranty-art/root-canal.jpg',
  crown: '/warranty-art/crown.jpg',
  implant: '/warranty-art/implant.jpg',
  laminate_composite: '/warranty-art/laminate-composite.jpg',
  denture: '/warranty-art/denture.jpg',
  orthodontics: '/warranty-art/orthodontics.jpg',
};

export const WARRANTY_CARD_ART_DEFAULT = '/warranty-art/default.jpg';

export function warrantyCardArtUrl(type: ServiceWarrantyType): string {
  return WARRANTY_CARD_ART[type] || WARRANTY_CARD_ART_DEFAULT;
}

/** تصویر نمایشی پنل بیمار همیشه از قالب نوع خدمت */
export function warrantyCardDisplayImage(
  type: ServiceWarrantyType,
  _storedUrl?: string | null,
): string {
  return warrantyCardArtUrl(type);
}