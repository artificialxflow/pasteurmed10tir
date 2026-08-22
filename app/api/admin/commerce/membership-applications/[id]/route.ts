import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapMembershipApplication } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const body = await parseJson<{ status?: string; reviewNote?: string }>(request);
  const { id } = await context.params;

  if (!body?.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
    return jsonError('وضعیت نامعتبر است.');
  }

  const row = await prisma.membershipApplication.findUnique({ where: { id } });
  if (!row) return jsonError('درخواست یافت نشد.', 404);

  const updated = await prisma.membershipApplication.update({
    where: { id },
    data: {
      status: body.status,
      reviewNote: body.reviewNote ? String(body.reviewNote).trim() : row.reviewNote,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ item: mapMembershipApplication(updated) });
}
