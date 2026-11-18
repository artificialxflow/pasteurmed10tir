import { WARRANTY_TYPE_LABELS } from '@/lib/warranty/constants';
import { warrantyCardArtUrl, warrantyCardDisplayImage } from '@/lib/warranty/art';
import type {
  ServiceWarrantyCard,
  ServiceWarrantyStatus,
  ServiceWarrantyType,
} from '@prisma/client';

export type PublicWarrantyCard = {
  id: string;
  serviceType: ServiceWarrantyType;
  serviceLabel: string;
  typeLabel: string;
  /** مسیر تصویر ذخیره‌شده در DB (قالب یا آپلود ادمین) */
  imageUrl: string;
  /** تصویر نمایشی پنل بیمار */
  displayImageUrl: string;
  startedAt: string;
  expiresAt: string;
  status: ServiceWarrantyStatus;
  needsActivation: boolean;
  activatedAt: string | null;
  updatedAt: string;
};

export function mapPublicWarrantyCard(row: ServiceWarrantyCard): PublicWarrantyCard {
  const status = row.status;
  return {
    id: row.id,
    serviceType: row.serviceType,
    serviceLabel: row.serviceLabel,
    typeLabel: WARRANTY_TYPE_LABELS[row.serviceType],
    imageUrl: row.imageUrl,
    displayImageUrl: warrantyCardDisplayImage(row.serviceType, row.imageUrl),
    startedAt: row.startedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    status,
    needsActivation: status === 'pending',
    activatedAt: row.activatedAt?.toISOString() ?? null,
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