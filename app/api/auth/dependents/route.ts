import { jsonError, parseJson } from '@/lib/auth/api-utils';
import {
  DEPENDENT_MAX,
  DEPENDENT_RELATIONS,
  mapDependent,
} from '@/lib/dependents';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { isUniqueViolation } from '@/lib/prisma/route-error';
import { isValidNationalId, normalizeNationalId } from '@/lib/validation/national-id';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const rows = await prisma.dependent.findMany({
    where: { guardianUserId: auth.session.userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ items: rows.map(mapDependent) });
}

export async function POST(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const body = await parseJson<{
    name?: string;
    nationalId?: string;
    birthDate?: string;
    relation?: string;
  }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const name = String(body.name || '').trim();
  if (name.length < 2) return jsonError('نام الزامی است.');
  const relation = String(body.relation || 'child');
  if (!DEPENDENT_RELATIONS.includes(relation as (typeof DEPENDENT_RELATIONS)[number])) {
    return jsonError('نسبت نامعتبر است.');
  }

  const count = await prisma.dependent.count({
    where: { guardianUserId: auth.session.userId, deletedAt: null },
  });
  if (count >= DEPENDENT_MAX) {
    return jsonError(`حداکثر ${DEPENDENT_MAX} فرد تحت تکفل مجاز است.`);
  }

  let nationalId = body.nationalId ? normalizeNationalId(body.nationalId) : '';
  if (nationalId && !isValidNationalId(nationalId)) {
    return jsonError('کد ملی نامعتبر است.');
  }
  if (nationalId) {
    const taken = await prisma.dependent.findFirst({
      where: { nationalId, deletedAt: null },
    });
    if (taken) return jsonError('این فرد تحت تکفل قبلاً ثبت شده است.');
  }

  const birthDate = body.birthDate ? new Date(body.birthDate) : null;
  try {
    const row = await prisma.dependent.create({
      data: {
        guardianUserId: auth.session.userId,
        name,
        nationalId: nationalId || null,
        birthDate: birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : null,
        relation,
      },
    });
    return NextResponse.json({ item: mapDependent(row) }, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e, 'nationalId')) {
      return jsonError('این فرد تحت تکفل قبلاً ثبت شده است.', 409);
    }
    throw e;
  }
}
