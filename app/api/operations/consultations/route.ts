import { jsonError } from '@/lib/auth/api-utils';
import { createConsultationRecord } from '@/lib/operations/consultation-service';
import { normalizePhoneDigits } from '@/lib/operations/phone';
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

  const row = await createConsultationRecord({
    type: body.type ? String(body.type) : undefined,
    typeLabel: body.typeLabel ? String(body.typeLabel) : undefined,
    category: body.category ? String(body.category) : undefined,
    categoryLabel: body.categoryLabel ? String(body.categoryLabel) : undefined,
    specialty: body.specialty ? String(body.specialty) : undefined,
    specialtyLabel: body.specialtyLabel ? String(body.specialtyLabel) : undefined,
    doctorId:
      body.doctorId != null && body.doctorId !== ''
        ? String(body.doctorId)
        : null,
    doctorName: body.doctorName ? String(body.doctorName) : undefined,
    patientName,
    patientPhone,
    description: body.description ? String(body.description) : undefined,
    estimate: body.estimate ? String(body.estimate) : undefined,
    amount: Number(body.amount || 0),
    priceSource: body.priceSource ? String(body.priceSource) : undefined,
    hasImage: Boolean(body.hasImage),
    onlineInsuranceCovered: Boolean(body.onlineInsuranceCovered),
  });

  return NextResponse.json({ item: row }, { status: 201 });
}
