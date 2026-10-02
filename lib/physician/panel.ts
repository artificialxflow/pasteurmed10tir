import { supportsConsultationVideo } from '@/lib/consultation/categories';
import { canJoinConsultationVideoStatus } from '@/lib/jitsi/labels';
import { findPhysicianByPhone, listMyStaffCommissionsByPhone } from '@/lib/home-visit/service';
import { mapBooking, mapConsultation } from '@/lib/operations/mappers';
import { prisma } from '@/lib/prisma';

export async function requirePhysicianForPhone(phone: string) {
  return findPhysicianByPhone(phone);
}

export function mapPhysicianPanel(row: {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  commissionPercent: number;
  status: string;
}) {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    phone: row.phone,
    commissionPercent: row.commissionPercent,
    status: row.status,
  };
}

export async function listPhysicianVisits(physicianId: number) {
  const doctorKey = String(physicianId);

  const [consultations, bookings] = await Promise.all([
    prisma.consultation.findMany({
      where: { doctorId: doctorKey },
      include: { dependent: { select: { name: true, fileNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.booking.findMany({
      where: { doctorId: doctorKey, status: { not: 'cancelled' } },
      include: { dependent: { select: { name: true, fileNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  const consultationItems = consultations.map((row) => {
    const mapped = mapConsultation(row);
    const videoCategory = supportsConsultationVideo(mapped.category);
    return {
      kind: 'consultation' as const,
      id: mapped.id,
      patientName: mapped.name || mapped.dependentName || '—',
      patientPhone: mapped.phone,
      title: mapped.typeLabel || mapped.categoryLabel || 'مشاوره',
      category: mapped.category,
      when:
        `${String(mapped.preferredDateLabel || '')} ${String(mapped.preferredTimeLabel || '')}`.trim() ||
        '—',
      status: mapped.status,
      videoStatus: mapped.videoStatus,
      supportsVideo: videoCategory,
      canJoinVideo:
        videoCategory && canJoinConsultationVideoStatus(mapped.videoStatus),
      canWritePrescription: videoCategory && mapped.status !== 'cancelled',
      createdAt: mapped.createdAt,
    };
  });

  const bookingItems = bookings.map((row) => {
    const mapped = mapBooking(row);
    return {
      kind: 'booking' as const,
      id: mapped.id,
      patientName: mapped.patientName || mapped.dependentName || '—',
      patientPhone: mapped.patientPhone,
      title: mapped.typeLabel || mapped.specialty || 'نوبت',
      category: undefined as string | undefined,
      when:
        `${String(mapped.dateLabel || mapped.day || '')} ${String(mapped.timeLabel || '')}`.trim() ||
        '—',
      status: mapped.status,
      videoStatus: null as string | null,
      supportsVideo: false,
      canJoinVideo: false,
      canWritePrescription: mapped.status !== 'cancelled',
      createdAt: mapped.createdAt,
    };
  });

  return [...consultationItems, ...bookingItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function physicianWorkStats(physicianId: number) {
  const doctorKey = String(physicianId);
  const [consultations, bookings] = await Promise.all([
    prisma.consultation.findMany({
      where: { doctorId: doctorKey },
      select: { status: true, videoStatus: true, amount: true },
    }),
    prisma.booking.findMany({
      where: { doctorId: doctorKey },
      select: { status: true },
    }),
  ]);

  const consultationTotal = consultations.length;
  const consultationPending = consultations.filter((c) => c.status === 'pending').length;
  const consultationAnswered = consultations.filter((c) => c.status === 'answered').length;
  const consultationCancelled = consultations.filter((c) => c.status === 'cancelled').length;
  const videoReady = consultations.filter(
    (c) => c.videoStatus === 'scheduled' || c.videoStatus === 'in_call',
  ).length;
  const videoCompleted = consultations.filter((c) => c.videoStatus === 'completed').length;
  const bookingActive = bookings.filter((b) => b.status !== 'cancelled').length;
  const bookingConfirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const bookingCancelled = bookings.filter((b) => b.status === 'cancelled').length;
  const consultationAmountSum = consultations
    .filter((c) => c.status === 'answered')
    .reduce((sum, c) => sum + Math.max(0, Number(c.amount || 0)), 0);

  return {
    consultationTotal,
    consultationPending,
    consultationAnswered,
    consultationCancelled,
    videoReady,
    videoCompleted,
    bookingActive,
    bookingConfirmed,
    bookingCancelled,
    consultationAmountSum,
  };
}

export async function listPhysicianCommissions(phone: string) {
  const physician = await findPhysicianByPhone(phone);
  if (!physician) {
    return { item: null, items: [] as Awaited<ReturnType<typeof listMyStaffCommissionsByPhone>>['items'], summary: null };
  }

  const result = await listMyStaffCommissionsByPhone(phone);
  const staffKey = `physician:${physician.id}`;
  const items = result.items.filter(
    (row) =>
      String(row.staffId || '') === staffKey || String(row.staffKind || '') === 'physician',
  );

  const paidTotal = items
    .filter((r) => r.status === 'paid')
    .reduce((s, r) => s + Number(r.commissionAmount || 0), 0);
  const pendingTotal = items
    .filter((r) => r.status !== 'paid')
    .reduce((s, r) => s + Number(r.commissionAmount || 0), 0);

  return {
    item: mapPhysicianPanel(physician),
    items,
    summary: {
      count: items.length,
      total: paidTotal + pendingTotal,
      paidTotal,
      pendingTotal,
    },
  };
}
