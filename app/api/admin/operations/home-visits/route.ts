import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import {
  assignStaffToHomeVisit,
  listHomeVisitRequests,
  transitionHomeVisitStatus,
} from '@/lib/home-visit/service';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('fieldStaff');
  if (auth.error) return auth.error;
  try {
    const items = await listHomeVisitRequests();
    return NextResponse.json({ items });
  } catch (e) {
    return prismaRouteError(e, 'admin/home-visits GET');
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('fieldStaff');
  if (auth.error) return auth.error;
  const body = await parseJson<{ id?: string; assignedStaffId?: string; status?: string }>(request);
  if (!body?.id) return jsonError('شناسه درخواست الزامی است.');
  try {
    if (body.assignedStaffId) {
      const item = await assignStaffToHomeVisit(body.id, body.assignedStaffId, auth.session.userId);
      return NextResponse.json({ item });
    }
    if (body.status) {
      const item = await transitionHomeVisitStatus(body.id, body.status, auth.session.userId);
      return NextResponse.json({ item });
    }
    return jsonError('نیرو یا وضعیت را مشخص کنید.');
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return prismaRouteError(e, 'admin/home-visits PATCH');
  }
}
