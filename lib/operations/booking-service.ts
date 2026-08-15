import { createCommission } from '@/lib/commerce/commission-service';
import { addClubPoints, incrementClubVisits } from '@/lib/club/service';
import { generateOperationId, mapBooking } from '@/lib/operations/mappers';
import { nextAppointmentAt } from '@/lib/operations/appointment-time';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { optionalPatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { isSmsConfigured, sendBookingSms } from '@/lib/sms/client';

export type CreateBookingInput = {
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  type?: string;
  typeLabel?: string;
  day?: string;
  timeValue?: string | number;
  timeLabel?: string;
  patientName?: string;
  patientPhone?: string;
  amount?: number;
  isDeposit?: boolean;
  depositNonRefundable?: boolean;
  referralCode?: string;
  dateLabel?: string;
};

export async function createBookingRecord(body: CreateBookingInput) {
  const patientPhone = normalizePhoneDigits(String(body.patientPhone || ''));
  if (!patientPhone || patientPhone.length < 10) {
    throw new Error('شماره موبایل معتبر نیست.');
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
    if (taken) throw new Error('این زمان قبلاً رزرو شده است.');
  }

  const session = await optionalPatient();
  const userId =
    session && normalizePhoneDigits(session.phone) === patientPhone
      ? session.userId
      : null;

  const referralCode = body.referralCode ? String(body.referralCode) : null;
  const patientName = String(body.patientName || '').trim() || null;
  const amount = Number(body.amount || 0);
  const appointmentAt = nextAppointmentAt(day, timeValue);

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
      dateLabel: body.dateLabel || new Date().toLocaleDateString('fa-IR'),
      referralCode,
      appointmentAt,
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

  await addClubPoints(patientPhone, 50, 'رزرو نوبت');
  await incrementClubVisits(patientPhone);

  if (isSmsConfigured()) {
    const recent = await prisma.booking.count({
      where: {
        patientPhone,
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
        id: { not: row.id },
      },
    });
    if (recent === 0) {
      const timeLabel =
        row.timeLabel || (row.day ? `${row.day} ${row.timeValue ?? ''}` : '—');
      const serviceLabel = row.typeLabel || row.specialty || 'نوبت دندانپزشکی';
      void sendBookingSms(patientPhone, timeLabel, serviceLabel).catch((e) =>
        console.error('[sms] booking', e),
      );
    }
  }

  return mapBooking(row);
}
