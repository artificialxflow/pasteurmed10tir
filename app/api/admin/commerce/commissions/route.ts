import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapCommission } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import type { CommissionStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('commissions');
  if (auth.error) return auth.error;

  const rows = await prisma.commission.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items: rows.map(mapCommission) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('commissions');
  if (auth.error) return auth.error;

  const body = await parseJson<{ id?: string; status?: string }>(request);
  if (!body?.id) return jsonError('شناسه پورسانت الزامی است.');
  if (body.status !== 'paid' && body.status !== 'pending') {
    return jsonError('وضعیت نامعتبر است.');
  }

  const row = await prisma.commission.update({
    where: { id: body.id },
    data: { status: body.status as CommissionStatus },
  });
  return NextResponse.json({ item: mapCommission(row) });
}
