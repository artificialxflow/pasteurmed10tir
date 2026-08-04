import { jsonError } from '@/lib/auth/api-utils';
import { generateOperationId, mapDoctorReview } from '@/lib/operations/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { optionalPatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('درخواست نامعتبر است.');
  }

  const patientPhone = normalizePhoneDigits(String(body.phone || ''));
  const comment = String(body.comment || '').trim();
  const doctorName = String(body.doctorName || '').trim();
  const doctorId = body.doctorId != null ? String(body.doctorId) : '';

  if (!patientPhone || !comment || !doctorName || !doctorId) {
    return jsonError('اطلاعات نظر ناقص است.');
  }

  const session = await optionalPatient();
  const userId =
    session && normalizePhoneDigits(session.phone) === patientPhone
      ? session.userId
      : null;

  const row = await prisma.doctorReview.create({
    data: {
      id: generateOperationId(),
      userId,
      patientPhone,
      doctorId,
      doctorName,
      doctorKind: String(body.doctorKind || 'dental'),
      rating: Math.min(5, Math.max(1, Number(body.rating || 5))),
      comment,
      status: 'pending',
    },
  });

  return NextResponse.json({ item: mapDoctorReview(row) }, { status: 201 });
}
