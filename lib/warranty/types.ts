import { WARRANTY_TYPE_LABELS } from '@/lib/warranty/constants';
import { warrantyCardArtUrl, warrantyCardDisplayImage } from '@/lib/warranty/art';
import type { ServiceWarrantyCard, ServiceWarrantyType } from '@prisma/client';

export type PublicWarrantyCard = {
  id: string;
  serviceType: ServiceWarrantyType;
  serviceLabel: string;
  typeLabel: string;
  /** قالب ثابت — مسیر ذخیره‌شده در DB */
  imageUrl: string;
  /** تصویر کوچک برای UI بیمار */
  displayImageUrl: string;
  startedAt: string;
  expiresAt: string;
  updatedAt: string;
};

export function mapPublicWarrantyCard(row: ServiceWarrantyCard): PublicWarrantyCard {
  return {
    id: row.id,
    serviceType: row.serviceType,
    serviceLabel: row.serviceLabel,
    typeLabel: WARRANTY_TYPE_LABELS[row.serviceType],
    imageUrl: row.imageUrl,
    displayImageUrl: warrantyCardDisplayImage(row.serviceType, row.imageUrl),
    startedAt: row.startedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export { warrantyCardArtUrl };

export const WARRANTY_SERVICE_TYPES = new Set<string>([
  'root_canal',
  'crown',
  'implant',
  'laminate_composite',
  'denture',
  'orthodontics',
]);