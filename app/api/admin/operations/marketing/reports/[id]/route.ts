import { getMarketingReportAdmin } from '@/lib/marketing/service';
import { requireAdmin } from '@/lib/content/require-admin';
import { jsonError } from '@/lib/auth/api-utils';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requireAdmin('visitors');
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  try {
    const item = await getMarketingReportAdmin(id);
    if (!item) return jsonError('گزارش یافت نشد.', 404);
    return NextResponse.json({ item });
  } catch (e) {
    return prismaRouteError(e, 'admin/marketing/reports/[id] GET');
  }
}
