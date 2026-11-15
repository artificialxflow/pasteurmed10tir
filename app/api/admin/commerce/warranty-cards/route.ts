import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { WARRANTY_TYPE_LABELS, warrantyExpiresAt } from '@/lib/warranty/constants';
import { warrantyCardArtUrl } from '@/lib/warranty/art';
import { mapPublicWarrantyCard, WARRANTY_SERVICE_TYPES } from '@/lib/warranty/types';
import { prisma } from '@/lib/prisma';
import type { ServiceWarrantyType } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('patients');
  if (auth.error) return auth.error;

  const phone = normalizePhoneDigits(
    new URL(request.url).searchParams.get('phone') || '',
  );
  if (!phone) return jsonError('موبایل بیمار الزامی است.');

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return jsonError('بیمار یافت نشد.', 404);

  const rows = await prisma.serviceWarrantyCard.findMany({
    where: { userId: user.id },
    orderBy: { expiresAt: 'desc' },
  });

  return NextResponse.json({
    items: rows.map(mapPublicWarrantyCard),
    patient: { userId: user.id, phone: user.phone },
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin('patients');
  if (auth.error) return auth.error;

  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const phone = normalizePhoneDigits(String(body.patientPhone || ''));
  const serviceType = String(body.serviceType || '');
  const serviceLabel = String(body.serviceLabel || '').trim();

  if (!phone || !WARRANTY_SERVICE_TYPES.has(serviceType)) {
    return jsonError('موبایل بیمار و نوع خدمت الزامی است.');
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return jsonError('بیمار یافت نشد.');

  const startedAt = body.startedAt ? new Date(String(body.startedAt)) : new Date();
  const type = serviceType as ServiceWarrantyType;
  const expiresAt = warrantyExpiresAt(startedAt, type);
  const imageUrl = warrantyCardArtUrl(type);

  const row = await prisma.serviceWarrantyCard.create({
    data: {
      userId: user.id,
      serviceType: type,
      serviceLabel: serviceLabel || WARRANTY_TYPE_LABELS[type],
      imageUrl,
      startedAt,
      expiresAt,
      createdByAdminId: auth.session.userId,
    },
  });

  return NextResponse.json({ item: mapPublicWarrantyCard(row) }, { status: 201 });
}