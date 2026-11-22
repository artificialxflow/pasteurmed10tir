import type { ServiceWarrantyType } from '@prisma/client';

/** قالب کارخانهٔ کارت گارانتی — فایل‌های `public/warranty-art/` */
export const WARRANTY_CARD_ART: Record<ServiceWarrantyType, string> = {
  root_canal: '/warranty-art/root-canal.jpg',
  crown: '/warranty-art/crown.jpg',
  implant: '/warranty-art/implant.jpg',
  laminate_composite: '/warranty-art/laminate-composite.jpg',
  denture: '/warranty-art/denture.jpg',
  orthodontics: '/warranty-art/orthodontics.jpg',
};

export const WARRANTY_CARD_ART_DEFAULT = '/warranty-art/default.jpg';

export const WARRANTY_SERVICE_TYPE_IDS = new Set<string>([
  'root_canal',
  'crown',
  'implant',
  'laminate_composite',
  'denture',
  'orthodontics',
]);