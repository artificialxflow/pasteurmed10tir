import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { findActiveVisitorByPhone } from '@/lib/commerce/visitor-service';
import {
  getMarketingReportForVisitor,
  updateMarketingFollowUpSlot,
  type UpdateFollowUpSlotInput,
} from '@/lib/marketing/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const visitor = await findActiveVisitorByPhone(auth.session.phone);
  if (!visitor) return jsonError('حساب ویزیتور فعال برای این موبایل یافت نشد.');

  const { id } = await ctx.params;
  try {
    const item = await getMarketingReportForVisitor(id, visitor.id);
    if (!item) return jsonError('گزارش یافت نشد.', 404);
    return NextResponse.json({ item });
  } catch (e) {
    return prismaRouteError(e, 'marketing/reports/[id] GET');
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const visitor = await findActiveVisitorByPhone(auth.session.phone);
  if (!visitor) return jsonError('حساب ویزیتور فعال برای این موبایل یافت نشد.');

  const body = await parseJson<UpdateFollowUpSlotInput & { action?: string }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const { id } = await ctx.params;
  if (body.action !== 'follow_up_slot') {
    return jsonError('عملیات پشتیبانی نمی‌شود.');
  }

  try {
    const item = await updateMarketingFollowUpSlot(id, visitor.id, body);
    return NextResponse.json({ item });
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return prismaRouteError(e, 'marketing/reports/[id] PATCH');
  }
}
