import { prisma } from '@/lib/prisma';
import {
  parseWarrantyCardArtOverrides,
  resolveWarrantyCardArtMap,
  type WarrantyCardArtOverrides,
} from '@/lib/warranty/card-art-settings';
import type { ServiceWarrantyType } from '@prisma/client';

const DEFAULT_ID = 'default';

export async function loadWarrantyCardArtOverrides(): Promise<WarrantyCardArtOverrides> {
  const row = await prisma.siteSettings.findUnique({ where: { id: DEFAULT_ID } });
  return parseWarrantyCardArtOverrides(row?.warrantyCardArt);
}

export async function loadWarrantyCardArtMap(): Promise<Record<ServiceWarrantyType, string>> {
  const overrides = await loadWarrantyCardArtOverrides();
  return resolveWarrantyCardArtMap(overrides);
}