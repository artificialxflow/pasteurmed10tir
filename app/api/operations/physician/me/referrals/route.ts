import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { findPhysicianByPhone } from '@/lib/home-visit/service';
import { mapSpecialistReferral } from '@/lib/follow-up/mappers';
import { normalizePhoneDigits } from '@/lib/follow-up/types';
import { generateOperationId } from '@/lib/operations/mappers';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const physician = await findPhysicianByPhone(auth.session.phone);
  if (!physician) return jsonError('دسترسی پزشک یافت نشد.', 403);

  const rows = await prisma.specialistReferral.findMany({
    where: {
      OR: [
        { createdByAdminId: auth.session.userId },
        { referrerName: physician.name },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ items: rows.map(mapSpecialistReferral) });
}

type PostBody = {
  patientName?: string;
  patientPhone?: string;
  specialistName?: string;
  note?: string;
};

export async function POST(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const physician = await findPhysicianByPhone(auth.session.phone);
  if (!physician) return jsonError('دسترسی پزشک یافت نشد.', 403);

  const body = await parseJson<PostBody>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const patientName = String(body.patientName || '').trim();
  const patientPhone = normalizePhoneDigits(body.patientPhone);
  const specialistName = String(body.specialistName || '').trim();
  const note = String(body.note || '').trim() || null;

  if (patientName.length < 2) return jsonError('نام بیمار الزامی است.');
  if (patientPhone.length < 10) return jsonError('شماره تماس معتبر نیست.');
  if (specialistName.length < 2) return jsonError('نام متخصص الزامی است.');

  const row = await prisma.specialistReferral.create({
    data: {
      id: generateOperationId(),
      referrerName: physician.name,
      patientName,
      patientPhone,
      specialistName,
      note,
      createdByAdminId: auth.session.userId,
    },
  });

  return NextResponse.json({ item: mapSpecialistReferral(row) }, { status: 201 });
}
