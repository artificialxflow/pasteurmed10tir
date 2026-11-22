import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import {
  parseWarrantyCardArtOverrides,
  resolveWarrantyCardArtMap,
} from '@/lib/warranty/card-art-settings';
import { WARRANTY_TYPE_LABELS } from '@/lib/warranty/constants';
import { WARRANTY_SERVICE_TYPES } from '@/lib/warranty/types';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { ServiceWarrantyType } from '@prisma/client';
import { NextResponse } from 'next/server';

const DEFAULT_ID = 'default';

type PutBody = {
  warrantyCardArt?: Record<string, unknown>;
};

export async function GET() {
  const auth = await requireAdmin('patients');
  if (auth.error) return auth.error;

  const row =
    (await prisma.siteSettings.findUnique({ where: { id: DEFAULT_ID } })) ||
    (await prisma.siteSettings.create({ data: { id: DEFAULT_ID } }));

  const overrides = parseWarrantyCardArtOverrides(row.warrantyCardArt);
  const resolved = resolveWarrantyCardArtMap(overrides);

  const items = (Object.keys(WARRANTY_TYPE_LABELS) as ServiceWarrantyType[]).map((id) => ({
    id,
    label: WARRANTY_TYPE_LABELS[id],
    imageUrl: resolved[id],
    overrideUrl: overrides[id] ?? '',
  }));

  return NextResponse.json({ overrides, resolved, items });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('patients');
  if (auth.error) return auth.error;

  const body = await parseJson<PutBody>(request);
  if (!body?.warrantyCardArt || typeof body.warrantyCardArt !== 'object') {
    return jsonError('دادهٔ قالب‌ها نامعتبر است.');
  }

  const current =
    (await prisma.siteSettings.findUnique({ where: { id: DEFAULT_ID } })) ||
    (await prisma.siteSettings.create({ data: { id: DEFAULT_ID } }));

  const prev = parseWarrantyCardArtOverrides(current.warrantyCardArt);
  const next: Record<string, string> = { ...prev };

  for (const [key, value] of Object.entries(body.warrantyCardArt)) {
    if (!WARRANTY_SERVICE_TYPES.has(key)) continue;
    const url = String(value ?? '').trim();
    if (!url) {
      delete next[key];
    } else {
      next[key] = url;
    }
  }

  const overrides = parseWarrantyCardArtOverrides(next);
  await prisma.siteSettings.update({
    where: { id: DEFAULT_ID },
    data: {
      warrantyCardArt: overrides as Prisma.InputJsonValue,
    },
  });

  const resolved = resolveWarrantyCardArtMap(overrides);
  const items = (Object.keys(WARRANTY_TYPE_LABELS) as ServiceWarrantyType[]).map((id) => ({
    id,
    label: WARRANTY_TYPE_LABELS[id],
    imageUrl: resolved[id],
    overrideUrl: overrides[id] ?? '',
  }));

  return NextResponse.json({
    ok: true,
    message: 'قالب‌های تصویر گارانتی ذخیره شد.',
    overrides,
    resolved,
    items,
  });
}