import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { WARRANTY_TYPE_LABELS } from '@/lib/warranty/constants';
import {
  resolveWarrantyExpiresAt,
  resolveWarrantyImageUrl,
} from '@/lib/warranty/resolve';
import { loadWarrantyCardArtOverrides } from '@/lib/warranty/load-card-art';
import { mapPublicWarrantyCard, WARRANTY_SERVICE_TYPES } from '@/lib/warranty/types';
import { prisma } from '@/lib/prisma';
import type { ServiceWarrantyType } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin('patients');
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const existing = await prisma.serviceWarrantyCard.findUnique({ where: { id } });
  if (!existing) return jsonError('کارت گارانتی یافت نشد.', 404);

  let serviceType = existing.serviceType;
  if (body.serviceType !== undefined) {
    const next = String(body.serviceType || '');
    if (!WARRANTY_SERVICE_TYPES.has(next)) return jsonError('نوع خدمت نامعتبر است.');
    serviceType = next as ServiceWarrantyType;
  }

  const serviceLabel =
    body.serviceLabel !== undefined
      ? String(body.serviceLabel || '').trim() || WARRANTY_TYPE_LABELS[serviceType]
      : existing.serviceLabel;

  let startedAt = existing.startedAt;
  if (body.startedAt !== undefined) {
    const next = new Date(String(body.startedAt));
    if (Number.isNaN(next.getTime())) return jsonError('تاریخ شروع نامعتبر است.');
    startedAt = next;
  }

  const useDefaultDuration =
    body.useDefaultDuration === true || body.useDefaultDuration === 'true';
  const expiresAt = resolveWarrantyExpiresAt({
    startedAt,
    serviceType,
    bodyExpiresAt: body.expiresAt,
    useDefaultDuration,
    existingExpiresAt: existing.expiresAt,
  });
  if (expiresAt.getTime() < startedAt.getTime()) {
    return jsonError('تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.');
  }
  const artOverrides = await loadWarrantyCardArtOverrides();
  const useTemplateImage =
    body.useTemplateImage === true || body.useTemplateImage === 'true';
  const imageUrl = resolveWarrantyImageUrl({
    serviceType,
    bodyImageUrl: body.imageUrl,
    useTemplateImage,
    existingImageUrl: existing.imageUrl,
    artOverrides,
  });

  const row = await prisma.serviceWarrantyCard.update({
    where: { id },
    data: {
      serviceType,
      serviceLabel,
      imageUrl,
      startedAt,
      expiresAt,
    },
  });

  return NextResponse.json({ item: mapPublicWarrantyCard(row, artOverrides) });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin('patients');
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const existing = await prisma.serviceWarrantyCard.findUnique({ where: { id } });
  if (!existing) return jsonError('کارت گارانتی یافت نشد.', 404);

  await prisma.serviceWarrantyCard.delete({ where: { id } });

  return NextResponse.json({ ok: true, message: 'کارت گارانتی حذف شد.' });
}