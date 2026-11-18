import type { ServiceWarrantyType } from '@prisma/client';
import { warrantyCardArtUrl } from '@/lib/warranty/art';
import { warrantyExpiresAt } from '@/lib/warranty/constants';

export function parseWarrantyDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function resolveWarrantyExpiresAt(input: {
  startedAt: Date;
  serviceType: ServiceWarrantyType;
  bodyExpiresAt?: unknown;
  useDefaultDuration?: boolean;
  existingExpiresAt?: Date;
}): Date {
  const fromBody = parseWarrantyDate(input.bodyExpiresAt);
  if (fromBody) return fromBody;
  if (input.useDefaultDuration) return warrantyExpiresAt(input.startedAt, input.serviceType);
  if (input.existingExpiresAt) return input.existingExpiresAt;
  return warrantyExpiresAt(input.startedAt, input.serviceType);
}

export function resolveWarrantyImageUrl(input: {
  serviceType: ServiceWarrantyType;
  bodyImageUrl?: unknown;
  useTemplateImage?: boolean;
  existingImageUrl?: string;
}): string {
  if (input.useTemplateImage) return warrantyCardArtUrl(input.serviceType);
  if (input.bodyImageUrl !== undefined) {
    const url = String(input.bodyImageUrl || '').trim();
    return url || warrantyCardArtUrl(input.serviceType);
  }
  if (input.existingImageUrl?.trim()) return input.existingImageUrl.trim();
  return warrantyCardArtUrl(input.serviceType);
}