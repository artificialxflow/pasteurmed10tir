import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { findActiveVisitorByPhone } from '@/lib/commerce/visitor-service';
import {
  createMarketingReport,
  listMarketingReportsForVisitor,
  type CreateMarketingReportInput,
} from '@/lib/marketing/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

async function requireVisitor() {
  const auth = await requirePatient();
  if (auth.error) return { error: auth.error, visitor: null };
  const visitor = await findActiveVisitorByPhone(auth.session.phone);
  if (!visitor) {
    return {
      error: jsonError('حساب ویزیتور فعال برای این موبایل یافت نشد.'),
      visitor: null,
    };
  }
  return { error: null, visitor };
}

export async function GET() {
  const { error, visitor } = await requireVisitor();
  if (error) return error;
  try {
    const items = await listMarketingReportsForVisitor(visitor!.id);
    return NextResponse.json({ visitor, items });
  } catch (e) {
    return prismaRouteError(e, 'marketing/reports GET');
  }
}

export async function POST(request: Request) {
  const { error, visitor } = await requireVisitor();
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
