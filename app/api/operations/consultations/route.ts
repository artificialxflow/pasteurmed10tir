import { jsonError } from '@/lib/auth/api-utils';
import { generateOperationId, mapConsultation } from '@/lib/operations/mappers';
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
  const patientName = String(body.name || body.patientName || '').trim();
  if (!patientPhone || patientPhone.length < 10) {
    return jsonError('شماره موبایل معتبر نیست.');
  }
  if (!patientName) return jsonError('نام را وارد کنید.');

  const session = await optionalPatient();
  const userId =
    session && normalizePhoneDigits(session.phone) === patientPhone
      ? session.userId
      : null;

  const row = await prisma.consultation.create({
    data: {
      id: generateOperationId(),
      userId,
      patientPhone,
      patientName,
      type: body.type ? String(body.type) : null,
      typeLabel: body.typeLabel ? String(body.typeLabel) : null,
      category: body.category ? String(body.category) : null,
      categoryLabel: body.categoryLabel ? String(body.categoryLabel) : null,
      specialty: body.specialty ? String(body.specialty) : null,
      specialtyLabel: body.specialtyLabel ? String(body.specialtyLabel) : null,
      doctorId: body.doctorId != null ? String(body.doctorId) : null,
      doctorName: body.doctorName ? String(body.doctorName) : null,
      description: body.description ? String(body.description) : null,
      estimate: body.estimate ? String(body.estimate) : null,
      amount: Number(body.amount || 0),
      priceSource: body.priceSource ? String(body.priceSource) : null,
      hasImage: Boolean(body.hasImage),
      onlineInsuranceCovered: Boolean(body.onlineInsuranceCovered),
      status: 'pending',
    },
  });

  return NextResponse.json({ item: mapConsultation(row) }, { status: 201 });
}
