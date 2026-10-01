import { requireAdmin } from '@/lib/content/require-admin';
import { mapBooking, mapConsultation } from '@/lib/operations/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type CancelledListItem = {
  id: string;
  source: 'booking' | 'consultation';
  sourceLabel: string;
  name: string;
  patientPhone: string;
  doctorName?: string;
  appointmentLabel: string;
  typeLabel: string;
  cancelledAt: string;
  note?: string;
};

export async function GET(request: Request) {
  const auth = await requireAdmin('followUp');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get('q') || '').trim();
  const phoneDigits = q ? normalizePhoneDigits(q) : '';

  const searchFilter = q
    ? {
        OR: [
          { patientName: { contains: q, mode: 'insensitive' as const } },
          { doctorName: { contains: q, mode: 'insensitive' as const } },
          ...(phoneDigits.length >= 4
            ? [{ patientPhone: { contains: phoneDigits } }]
            : []),
        ],
      }
    : {};

  const [bookings, consultations] = await Promise.all([
    prisma.booking.findMany({
      where: { status: 'cancelled', ...searchFilter },
      include: { dependent: { select: { name: true, fileNumber: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 400,
    }),
    prisma.consultation.findMany({
      where: { status: 'cancelled', ...searchFilter },
      include: { dependent: { select: { name: true, fileNumber: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 400,
    }),
  ]);

  const bookingItems: CancelledListItem[] = bookings.map((row) => {
    const mapped = mapBooking(row);
    return {
      id: mapped.id,
      source: 'booking',
      sourceLabel: 'رزرو',
      name: mapped.patientName || mapped.dependentName || '—',
      patientPhone: mapped.patientPhone,
      doctorName: mapped.doctorName,
      appointmentLabel:
        `${String(mapped.dateLabel || mapped.day || '—')} ${String(mapped.timeLabel || '')}`.trim(),
      typeLabel: String(mapped.typeLabel || mapped.specialty || 'رزرو دندان'),
      cancelledAt: row.updatedAt.toISOString(),
      note: mapped.staffNote,
    };
  });

  const consultationItems: CancelledListItem[] = consultations.map((row) => {
    const mapped = mapConsultation(row);
    return {
      id: mapped.id,
      source: 'consultation',
      sourceLabel: 'مشاوره',
      name: mapped.name || mapped.dependentName || '—',
      patientPhone: mapped.phone,
      doctorName: mapped.doctorName,
      appointmentLabel:
        `${String(mapped.preferredDateLabel || '')} ${String(mapped.preferredTimeLabel || '')}`.trim() ||
        '—',
      typeLabel: String(mapped.typeLabel || mapped.categoryLabel || 'مشاوره'),
      cancelledAt: row.updatedAt.toISOString(),
      note: mapped.description,
    };
  });

  const items = [...bookingItems, ...consultationItems].sort(
    (a, b) => new Date(b.cancelledAt).getTime() - new Date(a.cancelledAt).getTime(),
  );

  return NextResponse.json({ items: items.slice(0, 500) });
}
