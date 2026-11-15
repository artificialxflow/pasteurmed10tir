import { jsonError } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin('visitors');
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const visitorId = Number(id);
  if (!Number.isFinite(visitorId)) return jsonError('شناسه نامعتبر است.');

  const openCommission = await prisma.commission.count({
    where: { visitorId, status: 'pending' },
  });
  if (openCommission > 0) {
    return jsonError('پورسانت معوق دارد؛ ابتدا تسویه کنید.', 409);
  }

  const row = await prisma.visitor.update({
    where: { id: visitorId },
    data: { status: 'inactive' },
  });

  return NextResponse.json({ item: row });
}