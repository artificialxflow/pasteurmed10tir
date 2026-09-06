import { mapCreditActivationRequest } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('wallets');
  if (auth.error) return auth.error;

  const rows = await prisma.creditActivationRequest.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ items: rows.map(mapCreditActivationRequest) });
}
