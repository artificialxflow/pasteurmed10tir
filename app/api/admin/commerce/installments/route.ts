import { mapInstallmentPlan } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('installments');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('raw') === '1';

  const rows = await prisma.installmentPlan.findMany({
    where: raw
      ? undefined
      : {
          status: { not: 'hidden' },
          source: { not: 'membership' },
        },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items: rows.map(mapInstallmentPlan) });
}
