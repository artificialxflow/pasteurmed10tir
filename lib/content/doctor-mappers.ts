import type { DaySchedule, Dentist } from '@/lib/data';
import { buildTreatmentSlots, buildVisitHours } from '@/lib/data';
import type { Dentist as DbDentist, Physician as DbPhysician, Prisma } from '@prisma/client';

export type DentistRecord = Dentist;

export function mapDentist(row: DbDentist): DentistRecord {
  const schedule =
    row.schedule && typeof row.schedule === 'object' && !Array.isArray(row.schedule)
      ? (row.schedule as unknown as Record<string, DaySchedule>)
      : {};
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    image: row.image,
    days: [...row.days],
    hours: row.hours || '',
    status: (row.status as DentistRecord['status']) || 'available',
    schedule,
  };
}

export function mapPhysician(row: DbPhysician) {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    specialtyId: row.specialtyId ?? undefined,
    image: row.image,
    days: [...row.days],
    status: (row.status as 'available' | 'busy' | 'inactive') || 'available',
  };
}

/** Build default schedule for booking when admin only sets days + hours label. */
export function defaultScheduleForDays(days: string[]): Record<string, DaySchedule> {
  const schedule: Record<string, DaySchedule> = {};
  for (const day of days) {
    const trimmed = day.trim();
    if (!trimmed) continue;
    schedule[trimmed] = {
      visitHours: buildVisitHours(9, 17),
      treatmentSlots: buildTreatmentSlots(9, 17, [10, 14, 16]),
    };
  }
  return schedule;
}

export function parseDaysInput(raw: string): string[] {
  return raw
    .split(/[,،]/)
    .map((d) => d.trim())
    .filter(Boolean);
}

export function daysToInput(days: string[]): string {
  return (days || []).join('، ');
}

export type DentistBody = {
  id: number;
  name: string;
  specialty: string;
  image: string;
  days: string[];
  hours?: string;
  status?: string;
  schedule?: Record<string, DaySchedule>;
};

export function normalizeDentistBody(raw: DentistBody): DentistBody {
  const days = Array.isArray(raw.days) ? raw.days.map(String).filter(Boolean) : [];
  let schedule = raw.schedule;
  if (!schedule || Object.keys(schedule).length === 0) {
    schedule = defaultScheduleForDays(days);
  }
  return {
    id: Number(raw.id),
    name: String(raw.name || '').trim(),
    specialty: String(raw.specialty || '').trim() || 'دندانپزشکی عمومی',
    image: String(raw.image || '/uploads/placeholder.svg').trim(),
    days,
    hours: String(raw.hours || '').trim() || '۹ تا ۱۷',
    status: String(raw.status || 'available'),
    schedule,
  };
}

export function dentistToDbInput(
  item: DentistBody,
  sortOrder: number,
): Prisma.DentistCreateManyInput {
  const normalized = normalizeDentistBody(item);
  return {
    id: normalized.id,
    name: normalized.name,
    specialty: normalized.specialty,
    image: normalized.image,
    days: normalized.days,
    hours: normalized.hours || '',
    status: normalized.status || 'available',
    schedule: normalized.schedule as unknown as Prisma.InputJsonValue,
    sortOrder,
  };
}

export type PhysicianBody = {
  id: number;
  name: string;
  specialty: string;
  specialtyId?: string;
  image: string;
  days: string[];
  status?: string;
};

export function normalizePhysicianBody(raw: PhysicianBody): PhysicianBody {
  return {
    id: Number(raw.id),
    name: String(raw.name || '').trim(),
    specialty: String(raw.specialty || '').trim(),
    specialtyId: raw.specialtyId?.trim() || undefined,
    image: String(raw.image || '/uploads/placeholder.svg').trim(),
    days: Array.isArray(raw.days) ? raw.days.map(String).filter(Boolean) : [],
    status: String(raw.status || 'available'),
  };
}
