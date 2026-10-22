import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireVisitorRoleVisitor } from '@/lib/commerce/require-visitor';
import {
  getMarketingReportForVisitor,
  updateMarketingFollowUpSlot,
  type UpdateFollowUpSlotInput,
} from '@/lib/marketing/service';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { error, visitor } = await requireVisitorRoleVisitor();
  if (error) return error;

  const { id } = await ctx.params;
  try {
    const item = await getMarketingReportForVisitor(id, visitor!.id);
    if (!item) return jsonError('گزارش یافت نشد.', 404);
    return NextResponse.json({ item });
  } catch (e) {
    return prismaRouteError(e, 'marketing/reports/[id] GET');
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { error, visitor } = await requireVisitorRoleVisitor();
  if (error) return error;

  const body = await parseJson<UpdateFollowUpSlotInput & { action?: string }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const { id } = await ctx.params;
  if (body.action !== 'follow_up_slot') {
    return jsonError('عملیات پشتیبانی نمی‌شود.');
  }

  try {
    const item = await updateMarketingFollowUpSlot(id, visitor!.id, body);
    return NextResponse.json({ item });
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return prismaRouteError(e, 'marketing/reports/[id] PATCH');
  }
}
