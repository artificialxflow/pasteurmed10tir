import { prisma } from '@/lib/prisma';

const ACTIVE_STATUSES = ['pending', 'answered'] as const;

export async function listOccupiedDoctorVisitSlots(input: {
  doctorId: string;
  date: string;
}): Promise<string[]> {
  const doctorId = String(input.doctorId || '').trim();
  const date = String(input.date || '').trim();
  if (!doctorId || !date) return [];

  const rows = await prisma.consultation.findMany({
    where: {
      doctorId,
      preferredDate: date,
      status: { in: [...ACTIVE_STATUSES] },
      preferredTime: { not: null },
    },
    select: { preferredTime: true },
  });

  return rows
    .map((r) => String(r.preferredTime || '').trim())
    .filter(Boolean);
}

export async function isDoctorVisitSlotTaken(input: {
  doctorId?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
}): Promise<boolean> {
  const doctorId = String(input.doctorId || '').trim();
  const preferredDate = String(input.preferredDate || '').trim();
  const preferredTime = String(input.preferredTime || '').trim();
  if (!doctorId || !preferredDate || !preferredTime) return false;

  const existing = await prisma.consultation.findFirst({
    where: {
      doctorId,
      preferredDate,
      preferredTime,
      status: { in: [...ACTIVE_STATUSES] },
    },
    select: { id: true },
  });
  return Boolean(existing);
}
