import { jsonError } from '@/lib/auth/api-utils';
import { requirePatient } from '@/lib/operations/require-patient';
import { applyPatientWarrantyActivation } from '@/lib/warranty/activate';
import { mapPublicWarrantyCard } from '@/lib/warranty/types';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { id } = await ctx.params;

  const user = await prisma.user.findFirst({
    where: { phone: auth.session.phone },
    select: { id: true },
  });
  if (!user) return jsonError('کاربر یافت نشد.', 404);

  const existing = await prisma.serviceWarrantyCard.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return jsonError('کارت گارانتی یافت نشد.', 404);

  if (existing.status === 'active') {
    return NextResponse.json({
      item: mapPublicWarrantyCard(existing),
      message: 'کارت گارانتی قبلاً فعال شده است.',
    });
  }

  const { startedAt, expiresAt, activatedAt } = applyPatientWarrantyActivation(
    existing.startedAt,
    existing.expiresAt,
  );

  const row = await prisma.serviceWarrantyCard.update({
    where: { id },
    data: {
      status: 'active',
      startedAt,
      expiresAt,
      activatedAt,
    },
  });

  return NextResponse.json({
    item: mapPublicWarrantyCard(row),
    message: 'کارت گارانتی فعال شد.',
  });
}