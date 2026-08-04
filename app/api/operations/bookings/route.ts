import { jsonError } from '@/lib/auth/api-utils';
import { createCommission } from '@/lib/commerce/commission-service';
import { generateOperationId, mapBooking } from '@/lib/operations/mappers';
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

  const patientPhone = normalizePhoneDigits(String(body.patientPhone || ''));
  if (!patientPhone || patientPhone.length < 10) {
    return jsonError('شماره موبایل معتبر نیست.');
  }

  const doctorId = body.doctorId != null ? String(body.doctorId) : null;
  const day = body.day ? String(body.day) : null;
  const type = body.type ? String(body.type) : null;
  const timeValue = body.timeValue != null ? String(body.timeValue) : null;

  if (doctorId && day && type && timeValue) {
    const taken = await prisma.booking.findFirst({
      where: {
        status: { not: 'cancelled' },
        doctorId,
        day,
        type,
        timeValue,
      },
    });
    if (taken) return jsonError('این زمان قبلاً رزرو شده است.', 409);
  }

  const session = await optionalPatient();
  const userId =
    session && normalizePhoneDigits(session.phone) === patientPhone
      ? session.userId
      : null;

  const referralCode = body.referralCode ? String(body.referralCode) : null;
  const patientName = String(body.patientName || '').trim() || null;
  const amount = Number(body.amount || 0);

  const row = await prisma.booking.create({
    data: {
      id: generateOperationId(),
      userId,
      patientPhone,
      patientName,
      doctorId,
      doctorName: body.doctorName ? String(body.doctorName) : null,
      specialty: body.specialty ? String(body.specialty) : null,
      type,
      typeLabel: body.typeLabel ? String(body.typeLabel) : null,
      day,
      timeValue,
      timeLabel: body.timeLabel ? String(body.timeLabel) : null,
      amount,
      isDeposit: body.isDeposit !== false,
      depositNonRefundable: body.depositNonRefundable !== false,
      status: 'confirmed',
      dateLabel:
        body.dateLabel ? String(body.dateLabel) : new Date().toLocaleDateString('fa-IR'),
      referralCode,
    },
  });

  if (referralCode) {
    await createCommission({
      referralCode,
      sourceType: 'booking',
      sourceLabel: body.typeLabel ? String(body.typeLabel) : undefined,
      customerName: patientName || undefined,
      customerPhone: patientPhone,
      amount,
    });
  }

  return NextResponse.json({ booking: mapBooking(row) }, { status: 201 });
}
