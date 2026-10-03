import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';

export type PhysicianVisitPrescription = {
  id: string;
  date: string;
  createdAt: string;
  medications: string;
  dosageSchedule?: string;
  diagnosis?: string;
  recommendations?: string;
  consultationId?: string;
  bookingId?: string;
};

function asPayload(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function ownedByPhysician(
  payload: Record<string, unknown>,
  physicianId: number,
  physicianName: string,
): boolean {
  const entryPhysicianId = payload.physicianId != null ? String(payload.physicianId) : '';
  if (entryPhysicianId) return entryPhysicianId === String(physicianId);
  const doctorName = String(payload.doctorName || '').trim();
  return Boolean(physicianName.trim() && doctorName && doctorName === physicianName.trim());
}

function toSummary(entry: {
  id: string;
  entryDate: Date;
  createdAt: Date;
  payload: unknown;
}): PhysicianVisitPrescription {
  const payload = asPayload(entry.payload);
  return {
    id: entry.id,
    date: entry.entryDate.toISOString().slice(0, 10),
    createdAt: entry.createdAt.toISOString(),
    medications: String(payload.medications || '').trim(),
    dosageSchedule: String(payload.dosageSchedule || '').trim() || undefined,
    diagnosis: String(payload.diagnosis || '').trim() || undefined,
    recommendations: String(payload.recommendations || '').trim() || undefined,
    consultationId: payload.consultationId ? String(payload.consultationId) : undefined,
    bookingId: payload.bookingId ? String(payload.bookingId) : undefined,
  };
}

/**
 * نسخه‌های قبلی هر ویزیت — فقط نوشته‌های همین پزشک برای همان consultation/booking.
 */
export async function listPrescriptionsByVisitForPhysician(input: {
  physicianId: number;
  physicianName: string;
  visits: Array<{ id: string; patientPhone: string }>;
}): Promise<Map<string, PhysicianVisitPrescription[]>> {
  const byVisit = new Map<string, PhysicianVisitPrescription[]>();
  const visitIds = new Set(input.visits.map((v) => v.id));
  if (!visitIds.size) return byVisit;

  const phones = [
    ...new Set(
      input.visits
        .map((v) => normalizePhoneDigits(v.patientPhone))
        .filter((p) => p.length >= 10),
    ),
  ];
  if (!phones.length) return byVisit;

  const users = await prisma.user.findMany({
    where: { phone: { in: phones } },
    select: { healthRecord: { select: { id: true } } },
  });
  const recordIds = users
    .map((u) => u.healthRecord?.id)
    .filter((id): id is string => Boolean(id));
  if (!recordIds.length) return byVisit;

  const entries = await prisma.healthRecordEntry.findMany({
    where: {
      recordId: { in: recordIds },
      section: 'prescription',
    },
    orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
    take: 500,
  });

  for (const entry of entries) {
    const payload = asPayload(entry.payload);
    if (!ownedByPhysician(payload, input.physicianId, input.physicianName)) continue;

    const consultationId = payload.consultationId ? String(payload.consultationId) : '';
    const bookingId = payload.bookingId ? String(payload.bookingId) : '';
    const visitKey =
      consultationId && visitIds.has(consultationId)
        ? consultationId
        : bookingId && visitIds.has(bookingId)
          ? bookingId
          : '';
    if (!visitKey) continue;

    const list = byVisit.get(visitKey) || [];
    list.push(toSummary(entry));
    byVisit.set(visitKey, list);
  }

  return byVisit;
}
