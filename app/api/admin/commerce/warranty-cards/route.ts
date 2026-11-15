import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import {
  WARRANTY_TYPE_LABELS,
  warrantyExpiresAt,
} from '@/lib/warranty/constants';
import { prisma } from '@/lib/prisma';
import type { ServiceWarrantyType } from '@prisma/client';
import { NextResponse } from 'next/server';

const TYPES = new Set<string>([
  'root_canal',
  'crown',
  'implant',
  'laminate_composite',
  'denture',
  'orthodontics',
]);

export async function POST(request: Request) {
  const auth = await requireAdmin('patients');
  if (auth.error) return auth.error;

  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const phone = normalizePhoneDigits(String(body.patientPhone || ''));
  const serviceType = String(body.serviceType || '');
  const imageUrl = String(body.imageUrl || '').trim();
  const serviceLabel = String(body.serviceLabel || '').trim();

  if (!phone || !TYPES.has(serviceType) || !imageUrl) {
    return jsonError('موبایل بیمار، نوع خدمت و آدرس تصویر الزامی است.');
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return jsonError('بیمار یافت نشد.');

  const startedAt = body.startedAt ? new Date(String(body.startedAt)) : new Date();
  const type = serviceType as ServiceWarrantyType;
  const expiresAt = warrantyExpiresAt(startedAt, type);

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

  return NextResponse.json({ item: row }, { status: 201 });
}