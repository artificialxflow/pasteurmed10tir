import type { ServiceWarrantyType } from '@prisma/client';
import {
  WARRANTY_CARD_ART,
  WARRANTY_CARD_ART_DEFAULT,
  WARRANTY_SERVICE_TYPE_IDS,
} from '@/lib/warranty/card-art-defaults';

export type WarrantyCardArtOverrides = Partial<Record<ServiceWarrantyType, string>>;

export function parseWarrantyCardArtOverrides(raw: unknown): WarrantyCardArtOverrides {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: WarrantyCardArtOverrides = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!WARRANTY_SERVICE_TYPE_IDS.has(key)) continue;
    const url = String(value ?? '').trim();
    if (!url) continue;
    out[key as ServiceWarrantyType] = url;
  }
  return out;
}

export function resolveWarrantyCardArtMap(
  overrides: WarrantyCardArtOverrides = {},
): Record<ServiceWarrantyType, string> {
  const types = Object.keys(WARRANTY_CARD_ART) as ServiceWarrantyType[];
  const map = {} as Record<ServiceWarrantyType, string>;
  for (const type of types) {
    const custom = overrides[type]?.trim();
    map[type] = custom || WARRANTY_CARD_ART[type] || WARRANTY_CARD_ART_DEFAULT;
  }
  return map;
}

export function warrantyCardArtUrlWithOverrides(
  type: ServiceWarrantyType,
  overrides?: WarrantyCardArtOverrides,
): string {
  const custom = overrides?.[type]?.trim();
  if (custom) return custom;
  return WARRANTY_CARD_ART[type] || WARRANTY_CARD_ART_DEFAULT;
}