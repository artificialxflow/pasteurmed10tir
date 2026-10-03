import { requireAdmin } from '@/lib/content/require-admin';
import {
  formatBookingDateLabel,
  iranDayBounds,
  yesterdayIranIsoDate,
} from '@/lib/operations/booking-dates';
import { mapBooking, mapConsultation } from '@/lib/operations/mappers';
import { prisma } from '@/lib/prisma';
import { formatJalaliDate } from '@/lib/patient';
import { NextResponse } from 'next/server';

type YesterdayListItem = {
  id: string;
  source: 'booking' | 'consultation';
  sourceLabel: string;
  name: string;
  patientPhone: string;
  doctorName?: string;
  appointmentLabel: string;
  typeLabel: string;
  status: string;
  statusLabel: string;
  note?: string;
};

function bookingStatusLabel(status: string): string {
  if (status === 'confirmed') return 'تأیید شده';
  if (status === 'pending') return 'در انتظار';
  if (status === 'cancelled') return 'لغو شده';
  return status;
}

function consultationStatusLabel(status: string): string {
  if (status === 'answered') return 'پاسخ داده';
  if (status === 'cancelled') return 'لغو شده';
  if (status === 'pending') return 'در انتظار';
  return status;
}

/** بیماران دارای نوبت برای تاریخ دیروز (تقویم ایران) — لیست هر روز عوض می‌شود. */
export async function GET() {
  const auth = await requireAdmin('followUp');
  if (auth.error) return auth.error;

  const yesterdayIso = yesterdayIranIsoDate();
  const { start, end } = iranDayBounds(yesterdayIso);
  const dateLabel = formatBookingDateLabel(yesterdayIso);

  const [bookings, consultations] = await Promise.all([
    prisma.booking.findMany({
      where: {
        OR: [
          { appointmentAt: { gte: start, lte: end } },
          { day: yesterdayIso },
        ],
      },
      include: { dependent: { select: { name: true, fileNumber: true } } },
      orderBy: [{ appointmentAt: 'asc' }, { createdAt: 'asc' }],
      take: 500,
    }),
    prisma.consultation.findMany({
      where: { preferredDate: yesterdayIso },
      include: { dependent: { select: { name: true, fileNumber: true } } },
      orderBy: [{ preferredTime: 'asc' }, { createdAt: 'asc' }],
      take: 500,
    }),
  ]);

  const bookingItems: YesterdayListItem[] = bookings.map((row) => {
    const mapped = mapBooking(row);
    return {
      id: mapped.id,
      source: 'booking',
      sourceLabel: 'رزرو',
      name: mapped.patientName || mapped.dependentName || '—',
      patientPhone: mapped.patientPhone,
      doctorName: mapped.doctorName,
      appointmentLabel:
        `${String(mapped.dateLabel || mapped.day || dateLabel)} ${String(mapped.timeLabel || '')}`.trim(),
      typeLabel: String(mapped.typeLabel || mapped.specialty || 'رزرو'),
      status: mapped.status,
      statusLabel: bookingStatusLabel(mapped.status),
      note: mapped.staffNote,
    };
  });

  const consultationItems: YesterdayListItem[] = consultations.map((row) => {
    const mapped = mapConsultation(row);
    return {
      id: mapped.id,
      source: 'consultation',
      sourceLabel: 'مشاوره / ویزیت',
      name: mapped.name || mapped.dependentName || '—',
      patientPhone: mapped.phone,
      doctorName: mapped.doctorName,
      appointmentLabel:
        `${String(mapped.preferredDateLabel || formatJalaliDate(yesterdayIso))} ${String(mapped.preferredTimeLabel || mapped.preferredTime || '')}`.trim(),
      typeLabel: String(mapped.typeLabel || mapped.categoryLabel || 'مشاوره'),
      status: mapped.status,
      statusLabel: consultationStatusLabel(mapped.status),
      note: mapped.description,
    };
  });

  const items = [...bookingItems, ...consultationItems].sort((a, b) =>
    a.appointmentLabel.localeCompare(b.appointmentLabel, 'fa'),
  );

  return NextResponse.json({
    dateIso: yesterdayIso,
    dateLabel,
    count: items.length,
    items,
  });
}
