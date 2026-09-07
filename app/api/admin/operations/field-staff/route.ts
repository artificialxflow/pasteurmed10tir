import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { createFieldStaff, listFieldStaff } from '@/lib/home-visit/service';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('fieldStaff');
  if (auth.error) return auth.error;
  try {
    const items = await listFieldStaff();
    return NextResponse.json({ items });
  } catch (e) {
    return prismaRouteError(e, 'admin/field-staff GET');
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin('fieldStaff');
  if (auth.error) return auth.error;
  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');
  try {
    const item = await createFieldStaff(body);
    return NextResponse.json({ item });
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return prismaRouteError(e, 'admin/field-staff POST');
  }
}
