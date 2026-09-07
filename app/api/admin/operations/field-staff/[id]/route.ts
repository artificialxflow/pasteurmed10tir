import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { deleteFieldStaff, updateFieldStaff } from '@/lib/home-visit/service';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin('fieldStaff');
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');
  try {
    const item = await updateFieldStaff(id, body);
    return NextResponse.json({ item });
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return prismaRouteError(e, 'admin/field-staff PATCH');
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin('fieldStaff');
  if (auth.error) return auth.error;
  const { id } = await context.params;
  try {
    const result = await deleteFieldStaff(id);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return prismaRouteError(e, 'admin/field-staff DELETE');
  }
}
