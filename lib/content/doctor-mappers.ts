import type { DaySchedule, Dentist } from '@/lib/data';
import { buildTreatmentSlots, buildVisitHours } from '@/lib/data';
import type { Dentist as DbDentist, Physician as DbPhysician, Prisma } from '@prisma/client';

export type DentistRecord = Dentist;

export const DENTIST_WEEKDAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
] as const;

export type DayHoursEntry = { start: number; end: number };
export type DayHoursMap = Partial<Record<string, DayHoursEntry | null>>;

export function mapDentist(row: DbDentist): DentistRecord {
  const schedule =
    row.schedule && typeof row.schedule === 'object' && !Array.isArray(row.schedule)
      ? (row.schedule as unknown as Record<string, DaySchedule>)
      : {};
  const base: DentistRecord = {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    specialtyId: row.specialtyId ?? undefined,
    image: row.image,
    days: [...row.days],
    hours: row.hours || '',
    status: (row.status as DentistRecord['status']) || 'available',
    schedule,
  };
  // Heal legacy rows where hours label was ignored and schedule stayed at 9–17.
  const dayHours = dayHoursFromDentist(base);
  const healedSchedule = buildScheduleFromDayHours(dayHours);
  const summary = summarizeDayHours(dayHours);
  return {
    ...base,
    schedule: Object.keys(healedSchedule).length ? healedSchedule : base.schedule,
    days: summary.days.length ? summary.days : base.days,
    hours: summary.hours || base.hours,
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

function toAsciiDigits(value: string): string {
  return String(value || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/** Parse labels like "۱۰ تا ۲۲", "10-22", "9 تا 17". */
export function parseHoursRange(raw?: string | null): DayHoursEntry | null {
  if (!raw) return null;
  const normalized = toAsciiDigits(raw).replace(/\s+/g, ' ').trim();
  const match = normalized.match(/(\d{1,2})\s*(?:تا|-|–|:|to)\s*(\d{1,2})/i);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 0 || start > 23 || end < 1 || end > 24 || end <= start) return null;
  return { start, end };
}

export function formatHoursRange(start: number, end: number): string {
  return `${start.toLocaleString('fa-IR')} تا ${end.toLocaleString('fa-IR')}`;
}

export function buildDaySchedule(start: number, end: number): DaySchedule {
  return {
    visitHours: buildVisitHours(start, end),
    treatmentSlots: buildTreatmentSlots(start, end),
  };
}

export function buildScheduleFromDayHours(dayHours: DayHoursMap): Record<string, DaySchedule> {
  const schedule: Record<string, DaySchedule> = {};
  for (const [day, range] of Object.entries(dayHours)) {
    const trimmed = day.trim();
    if (!trimmed || !range) continue;
    if (range.end <= range.start) continue;
    schedule[trimmed] = buildDaySchedule(range.start, range.end);
  }
  return schedule;
}

/** Build schedule for booking when admin only sets days + hours label. */
export function defaultScheduleForDays(
  days: string[],
  hoursLabel?: string,
): Record<string, DaySchedule> {
  const range = parseHoursRange(hoursLabel) || { start: 9, end: 17 };
  const schedule: Record<string, DaySchedule> = {};
  for (const day of days) {
    const trimmed = day.trim();
    if (!trimmed) continue;
    schedule[trimmed] = buildDaySchedule(range.start, range.end);
  }
  return schedule;
}

export function dayHoursFromDentist(dentist: {
  days?: string[];
  hours?: string;
  schedule?: Record<string, DaySchedule>;
}): DayHoursMap {
  const map: DayHoursMap = {};
  const fallback = parseHoursRange(dentist.hours) || { start: 9, end: 17 };
  const schedule = dentist.schedule || {};
  const days =
    Array.isArray(dentist.days) && dentist.days.length
      ? dentist.days
      : Object.keys(schedule);

  for (const weekday of DENTIST_WEEKDAYS) {
    map[weekday] = null;
  }

  const extracted: Array<{ day: string; range: DayHoursEntry }> = [];
  for (const day of days) {
    const daySchedule = schedule[day];
    if (daySchedule?.visitHours?.length) {
      extracted.push({
        day,
        range: {
          start: Math.min(...daySchedule.visitHours),
          end: Math.max(...daySchedule.visitHours),
        },
      });
    } else if (daySchedule?.treatmentSlots?.length) {
      extracted.push({
        day,
        range: {
          start: Math.min(...daySchedule.treatmentSlots.map((s) => s.start)),
          end: Math.max(...daySchedule.treatmentSlots.map((s) => s.end)),
        },
      });
    }
  }

  const allSame =
    extracted.length > 0 &&
    extracted.every(
      (item) =>
        item.range.start === extracted[0].range.start &&
        item.range.end === extracted[0].range.end,
    );
  const looksLikeLegacyDefault =
    allSame && extracted[0].range.start === 9 && extracted[0].range.end === 17;
  const hoursConflicts =
    looksLikeLegacyDefault &&
    (fallback.start !== 9 || fallback.end !== 17);
  // Legacy bug: hours label was ignored while schedule stayed at 9–17.
  const preferHoursLabel = !extracted.length || hoursConflicts;

  for (const day of days) {
    if (preferHoursLabel) {
      map[day] = { ...fallback };
      continue;
    }
    const found = extracted.find((item) => item.day === day);
    map[day] = found ? { ...found.range } : { ...fallback };
  }
  return map;
}

export function summarizeDayHours(dayHours: DayHoursMap): { days: string[]; hours: string } {
  const active = Object.entries(dayHours).filter(
    (entry): entry is [string, DayHoursEntry] => Boolean(entry[1]),
  );
  const days = active.map(([day]) => day);
  if (!active.length) return { days: [], hours: '۹ تا ۱۷' };

  const first = active[0][1];
  const same = active.every(
    ([, range]) => range.start === first.start && range.end === first.end,
  );
  if (same) return { days, hours: formatHoursRange(first.start, first.end) };

  return {
    days,
    hours: active
      .map(([day, range]) => `${day} ${formatHoursRange(range.start, range.end)}`)
      .join(' · '),
  };
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
  specialtyId?: string;
  image: string;
  days: string[];
  hours?: string;
  status?: string;
  schedule?: Record<string, DaySchedule>;
  /** When set, rebuilds schedule + days + hours summary. */
  dayHours?: DayHoursMap;
};

export function normalizeDentistBody(raw: DentistBody): DentistBody {
  let days = Array.isArray(raw.days) ? raw.days.map(String).filter(Boolean) : [];
  let hours = String(raw.hours || '').trim() || '۹ تا ۱۷';
  let schedule = raw.schedule;

  if (raw.dayHours) {
    schedule = buildScheduleFromDayHours(raw.dayHours);
    const summary = summarizeDayHours(raw.dayHours);
    days = summary.days;
    hours = summary.hours;
  } else if (!schedule || Object.keys(schedule).length === 0) {
    schedule = defaultScheduleForDays(days, hours);
  } else {
    // Keep explicit schedule, but if days empty derive from schedule keys.
    if (!days.length) days = Object.keys(schedule);
  }

  return {
    id: Number(raw.id),
    name: String(raw.name || '').trim(),
    specialty: String(raw.specialty || '').trim() || 'دندانپزشکی عمومی',
    specialtyId: raw.specialtyId?.trim() || undefined,
    image: String(raw.image || '/uploads/placeholder.svg').trim(),
    days,
    hours,
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
    specialtyId: normalized.specialtyId || null,
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
