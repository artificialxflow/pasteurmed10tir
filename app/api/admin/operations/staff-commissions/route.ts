import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdminAny } from '@/lib/content/require-admin';
import {
  listStaffCommissions,
  updateStaffCommissionStatus,
} from '@/lib/home-visit/service';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdminAny(['fieldStaff', 'commissions']);
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  try {
    const result = await listStaffCommissions({
      kind: searchParams.get('kind') || undefined,
      status: searchParams.get('status') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    return prismaRouteError(e, 'admin/staff-commissions GET');
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminAny(['fieldStaff', 'commissions']);
  if (auth.error) return auth.error;

  const body = await parseJson<{ id?: string; status?: string }>(request);
  if (!body?.id) return jsonError('شناسه الزامی است.');
  if (body.status !== 'pending' && body.status !== 'approved' && body.status !== 'paid') {
    return jsonError('وضعیت نامعتبر است.');
  }

  try {
    const item = await updateStaffCommissionStatus(body.id, body.status);
    return NextResponse.json({ item });
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return prismaRouteError(e, 'admin/staff-commissions PATCH');
  }
}
