import { requireAdminAny } from '@/lib/content/require-admin';
import { listStaffCommissions } from '@/lib/home-visit/service';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdminAny(['fieldStaff', 'commissions']);
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  try {
    const result = await listStaffCommissions({
      kind: searchParams.get('kind') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    return prismaRouteError(e, 'admin/staff-commissions GET');
  }
}
