import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapFacilityRequest } from '@/lib/commerce/mappers';
import { createFacilityInstallmentPlan } from '@/lib/commerce/installment-service';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import type { FacilityRequestStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('facilities');
  if (auth.error) return auth.error;

  const rows = await prisma.facilityRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items: rows.map(mapFacilityRequest) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('facilities');
  if (auth.error) return auth.error;

  const body = await parseJson<{ id?: string; status?: string }>(request);
  if (!body?.id) return jsonError('شناسه درخواست الزامی است.');
  if (!['pending', 'approved', 'rejected'].includes(String(body.status))) {
    return jsonError('وضعیت نامعتبر است.');
  }

  const prev = await prisma.facilityRequest.findUnique({ where: { id: body.id } });
  if (!prev) return jsonError('درخواست یافت نشد.', 404);

  const row = await prisma.facilityRequest.update({
    where: { id: body.id },
    data: { status: body.status as FacilityRequestStatus },
  });

  if (body.status === 'approved' && prev.status !== 'approved' && row.amountNum > 0) {
    const already = await prisma.installmentPlan.findFirst({
      where: { linkedRequestId: row.id, source: 'facility' },
    });
    if (!already) {
      await createFacilityInstallmentPlan({
        phone: row.phone,
        patientName: row.name,
        amount: row.amountNum,
        linkedRequestId: row.id,
      });
    }
  }

  return NextResponse.json({ item: mapFacilityRequest(row) });
}
