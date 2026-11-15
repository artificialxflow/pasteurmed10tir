import type { ServiceWarrantyType } from '@prisma/client';

/** قالب ثابت کارت گارانتی — بدون آپلود عکس بالینی */
export const WARRANTY_CARD_ART: Record<ServiceWarrantyType, string> = {
  root_canal: '/warranty-art/root-canal.svg',
  crown: '/warranty-art/crown.svg',
  implant: '/warranty-art/implant.svg',
  laminate_composite: '/warranty-art/laminate-composite.svg',
  denture: '/warranty-art/denture.svg',
  orthodontics: '/warranty-art/orthodontics.svg',
};

export function warrantyCardArtUrl(type: ServiceWarrantyType): string {
  return WARRANTY_CARD_ART[type] || '/warranty-art/default.svg';
}

/** تصویر نمایشی پنل بیمار همیشه از قالب نوع خدمت */
export function warrantyCardDisplayImage(
  type: ServiceWarrantyType,
  _storedUrl?: string | null,
): string {
  return warrantyCardArtUrl(type);
}