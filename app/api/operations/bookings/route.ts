import { jsonError } from '@/lib/auth/api-utils';
import { createBookingRecord } from '@/lib/operations/booking-service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('درخواست نامعتبر است.');
  }

  try {
    const booking = await createBookingRecord({
      doctorId: body.doctorId != null ? String(body.doctorId) : undefined,
      doctorName: body.doctorName ? String(body.doctorName) : undefined,
      specialty: body.specialty ? String(body.specialty) : undefined,
      type: body.type ? String(body.type) : undefined,
      typeLabel: body.typeLabel ? String(body.typeLabel) : undefined,
      day: body.day ? String(body.day) : undefined,
      timeValue: body.timeValue as string | number | undefined,
      timeLabel: body.timeLabel ? String(body.timeLabel) : undefined,
      patientName: body.patientName ? String(body.patientName) : undefined,
      patientPhone: body.patientPhone ? String(body.patientPhone) : undefined,
      amount: Number(body.amount || 0),
      isDeposit: body.isDeposit !== false,
      depositNonRefundable: body.depositNonRefundable !== false,
      referralCode: body.referralCode ? String(body.referralCode) : undefined,
      dateLabel: body.dateLabel ? String(body.dateLabel) : undefined,
    });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'خطا در ثبت رزرو.';
    const status = message.includes('قبلاً رزرو') ? 409 : 400;
    return jsonError(message, status);
  }
}
