import { jsonError } from '@/lib/auth/api-utils';
import { requirePatient } from '@/lib/operations/require-patient';
import { loadWarrantyCardArtOverrides } from '@/lib/warranty/load-card-art';
import { mapPublicWarrantyCard } from '@/lib/warranty/types';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const user = await prisma.user.findFirst({
    where: { phone: auth.session.phone },
    select: { id: true },
  });
  if (!user) return jsonError('کاربر یافت نشد.', 404);

  const rows = await prisma.serviceWarrantyCard.findMany({
    where: { userId: user.id },
    orderBy: { expiresAt: 'desc' },
  });
  const artOverrides = await loadWarrantyCardArtOverrides();

  return NextResponse.json({
    items: rows.map((row) => mapPublicWarrantyCard(row, artOverrides)),
  });
}