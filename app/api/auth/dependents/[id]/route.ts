import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { DEPENDENT_RELATIONS, mapDependent } from '@/lib/dependents';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { isValidNationalId, normalizeNationalId } from '@/lib/validation/national-id';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const row = await prisma.dependent.findUnique({ where: { id } });
  if (!row || row.deletedAt || row.guardianUserId !== auth.session.userId) {
    return jsonError('فرد تحت تکفل یافت نشد.', 404);
  }

  const body = await parseJson<{
    name?: string;
    nationalId?: string;
    birthDate?: string | null;
    relation?: string;
  }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const data: {
    name?: string;
    nationalId?: string | null;
    birthDate?: Date | null;
    relation?: string;
  } = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return jsonError('نام الزامی است.');
    data.name = name;
  }
  if (body.relation !== undefined) {
    if (!DEPENDENT_RELATIONS.includes(body.relation as (typeof DEPENDENT_RELATIONS)[number])) {
      return jsonError('نسبت نامعتبر است.');
    }
    data.relation = body.relation;
  }
  if (body.nationalId !== undefined) {
    const nationalId = body.nationalId ? normalizeNationalId(body.nationalId) : '';
    if (nationalId && !isValidNationalId(nationalId)) return jsonError('کد ملی نامعتبر است.');
    if (nationalId) {
      const taken = await prisma.dependent.findFirst({
        where: { nationalId, deletedAt: null, id: { not: id } },
      });
      if (taken) return jsonError('این فرد تحت تکفل قبلاً ثبت شده است.');
    }
    data.nationalId = nationalId || null;
  }
  if (body.birthDate !== undefined) {
    if (!body.birthDate) data.birthDate = null;
    else {
      const d = new Date(body.birthDate);
      data.birthDate = Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const updated = await prisma.dependent.update({ where: { id }, data });
  return NextResponse.json({ item: mapDependent(updated) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const row = await prisma.dependent.findUnique({ where: { id } });
  if (!row || row.deletedAt || row.guardianUserId !== auth.session.userId) {
    return jsonError('فرد تحت تکفل یافت نشد.', 404);
  }
  await prisma.dependent.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
