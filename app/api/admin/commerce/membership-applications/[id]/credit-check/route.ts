import { jsonError } from '@/lib/auth/api-utils';
import { mapMembershipApplication } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { runZohalCreditCheck } from '@/lib/zohal/run-credit-check';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const row = await prisma.membershipApplication.findUnique({ where: { id } });
  if (!row) return jsonError('درخواست یافت نشد.', 404);

  const result = await runZohalCreditCheck({
    nationalId: String(row.nationalId || ''),
    phone: String(row.phone || ''),
  });

  if ('error' in result) {
    return jsonError(result.error, result.status);
  }

  const updated = await prisma.membershipApplication.update({
    where: { id },
    data: {
      zohalStatus: result.zohalStatus,
      zohalPayload: result.zohalPayload,
      shahkarMatched: result.shahkarMatched,
      zohalCheckedAt: result.zohalCheckedAt,
    },
  });

  return NextResponse.json({ item: mapMembershipApplication(updated) });
}
