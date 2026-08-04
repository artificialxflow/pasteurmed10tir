import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapPartnerRequest } from '@/lib/operations/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('partners');
  if (auth.error) return auth.error;

  const rows = await prisma.partnerRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items: rows.map(mapPartnerRequest) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('partners');
  if (auth.error) return auth.error;

  const body = await parseJson<{ id?: string; status?: string }>(request);
  if (!body?.id) return jsonError('شناسه الزامی است.');

  const status =
    body.status === 'new' ||
    body.status === 'reviewing' ||
    body.status === 'approved' ||
    body.status === 'rejected'
      ? body.status
      : undefined;
  if (!status) return jsonError('وضعیت نامعتبر است.');

  const row = await prisma.partnerRequest.update({
    where: { id: body.id },
    data: { status },
  });

  return NextResponse.json({ item: mapPartnerRequest(row) });
}
