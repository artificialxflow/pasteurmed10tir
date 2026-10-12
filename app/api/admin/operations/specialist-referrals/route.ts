import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { mapSpecialistReferral } from '@/lib/follow-up/mappers';
import { normalizePhoneDigits } from '@/lib/follow-up/types';
import { generateOperationId } from '@/lib/operations/mappers';
import { listSpecialistPickOptions } from '@/lib/admin/specialist-referral-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('specialistReferrals');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  if (searchParams.get('mode') === 'options') {
    const [emergencyPhysicians, specialists] = await Promise.all([
      prisma.emergencyPhysician.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      listSpecialistPickOptions(),
    ]);
    return NextResponse.json({ emergencyPhysicians, specialists });
  }
  const q = searchParams.get('q')?.trim();
  const fromRaw = searchParams.get('from');
  const toRaw = searchParams.get('to');
  const from = fromRaw ? new Date(fromRaw) : null;
  const to = toRaw ? new Date(toRaw) : null;

  const createdAt =
    from && !Number.isNaN(from.getTime())
      ? {
          gte: from,
          ...(to && !Number.isNaN(to.getTime())
            ? { lte: new Date(to.getTime() + 86400000 - 1) }
            : {}),
        }
      : undefined;

  const rows = await prisma.specialistReferral.findMany({
    where: {
      ...(createdAt ? { createdAt } : {}),
      ...(q
        ? {
            OR: [
              { patientName: { contains: q, mode: 'insensitive' } },
              { referrerName: { contains: q, mode: 'insensitive' } },
              { specialistName: { contains: q, mode: 'insensitive' } },
              { patientPhone: { contains: normalizePhoneDigits(q) } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return NextResponse.json({ items: rows.map(mapSpecialistReferral) });
}

type PostBody = {
  referrerName?: string;
  emergencyPhysicianId?: string;
  patientName?: string;
  patientPhone?: string;
  specialistName?: string;
  specialistSpecialty?: string;
  note?: string;
};

export async function POST(request: Request) {
  const auth = await requireAdmin('specialistReferrals');
  if (auth.error) return auth.error;

  const body = await parseJson<PostBody>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  let referrerName = String(body.referrerName || '').trim();
  const emergencyPhysicianId = String(body.emergencyPhysicianId || '').trim() || null;
  if (emergencyPhysicianId) {
    const ep = await prisma.emergencyPhysician.findUnique({ where: { id: emergencyPhysicianId } });
    if (!ep) return jsonError('پزشک اورژانس انتخاب‌شده معتبر نیست.');
    referrerName = ep.name;
  }
  const patientName = String(body.patientName || '').trim();
  const patientPhone = normalizePhoneDigits(body.patientPhone);
  const specialistName = String(body.specialistName || '').trim();
  const specialistSpecialty = String(body.specialistSpecialty || '').trim() || null;
  const note = String(body.note || '').trim() || null;

  if (referrerName.length < 2) return jsonError('نام ارجاع‌دهنده الزامی است.');
  if (patientName.length < 2) return jsonError('نام بیمار الزامی است.');
  if (patientPhone.length < 10) return jsonError('شماره تماس معتبر نیست.');
  if (specialistName.length < 2) return jsonError('نام متخصص الزامی است.');

  const row = await prisma.specialistReferral.create({
    data: {
      id: generateOperationId(),
      referrerName,
      patientName,
      patientPhone,
      specialistName,
      specialistSpecialty,
      emergencyPhysicianId,
      note,
      createdByAdminId: auth.session.userId,
    },
  });

  return NextResponse.json({ item: mapSpecialistReferral(row) }, { status: 201 });
}
