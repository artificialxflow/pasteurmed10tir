import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapInsuranceInquiry } from '@/lib/operations/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('insurances');
  if (auth.error) return auth.error;

  const rows = await prisma.insuranceInquiry.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items: rows.map(mapInsuranceInquiry) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('insurances');
  if (auth.error) return auth.error;

  const body = await parseJson<{ id?: string; status?: string }>(request);
  if (!body?.id) return jsonError('شناسه الزامی است.');

  const status =
    body.status === 'approved' || body.status === 'rejected' || body.status === 'pending'
      ? body.status
      : undefined;
  if (!status) return jsonError('وضعیت نامعتبر است.');

  const row = await prisma.insuranceInquiry.update({
    where: { id: body.id },
    data: {
      status,
      resolvedAt: status === 'pending' ? null : new Date(),
    },
  });

  return NextResponse.json({ inquiry: mapInsuranceInquiry(row) });
}
