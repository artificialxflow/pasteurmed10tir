import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireVisitorRoleVisitor } from '@/lib/commerce/require-visitor';
import {
  createMarketingReport,
  listMarketingReportsForVisitor,
  type CreateMarketingReportInput,
} from '@/lib/marketing/service';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function GET() {
  const { error, visitor } = await requireVisitorRoleVisitor();
  if (error) return error;
  try {
    const items = await listMarketingReportsForVisitor(visitor!.id);
    return NextResponse.json({ visitor, items });
  } catch (e) {
    return prismaRouteError(e, 'marketing/reports GET');
  }
}

export async function POST(request: Request) {
  const { error, visitor } = await requireVisitorRoleVisitor();
  if (error) return error;
  const body = await parseJson<CreateMarketingReportInput>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');
  try {
    const item = await createMarketingReport(visitor!, body);
    return NextResponse.json({ item });
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return prismaRouteError(e, 'marketing/reports POST');
  }
}
