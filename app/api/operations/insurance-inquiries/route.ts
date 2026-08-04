import { jsonError } from '@/lib/auth/api-utils';
import { generateOperationId, mapInsuranceInquiry } from '@/lib/operations/mappers';
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

  const patientPhone = normalizePhoneDigits(String(body.phone || body.patientPhone || ''));
  if (!patientPhone || patientPhone.length < 10) {
    return jsonError('شماره موبایل معتبر نیست.');
  }

  const session = await optionalPatient();
  const userId =
    session && normalizePhoneDigits(session.phone) === patientPhone
      ? session.userId
      : null;

  const row = await prisma.insuranceInquiry.create({
    data: {
      id: generateOperationId(),
      userId,
      patientPhone,
      patientName: body.patientName ? String(body.patientName) : null,
      mode: String(body.mode || 'none'),
      baseInsuranceId: body.baseInsuranceId ? String(body.baseInsuranceId) : null,
      complementaryInsuranceId: body.complementaryInsuranceId
        ? String(body.complementaryInsuranceId)
        : null,
      franchisePercent: Number(body.franchisePercent || 30),
      visitFee: Number(body.visitFee || 0),
      depositAmount: Number(body.depositAmount || 0),
      status: 'pending',
    },
  });

  return NextResponse.json({ inquiry: mapInsuranceInquiry(row) }, { status: 201 });
}
