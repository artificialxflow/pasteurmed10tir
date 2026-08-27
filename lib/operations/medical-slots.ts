/**
 * Medical visit slots — 15-minute (یک ربع) intervals within doctor presence hours.
 */

export type QuarterSlot = {
  /** "HH:mm" 24h ascii */
  value: string;
  label: string;
};

function toFaTime(hour: number, minute: number): string {
  const h = hour.toLocaleString('fa-IR');
  const m = minute.toLocaleString('fa-IR').padStart(2, '۰');
  return `${h}:${m}`;
}

/** Build 15-minute slots for each hour in `visitHours` (e.g. 9 → 09:00, 09:15, 09:30, 09:45). */
export function buildQuarterSlotsFromVisitHours(visitHours: number[]): QuarterSlot[] {
  const hours = [...new Set(visitHours.map((h) => Number(h)).filter((h) => Number.isFinite(h)))]
    .filter((h) => h >= 0 && h <= 23)
    .sort((a, b) => a - b);

  const slots: QuarterSlot[] = [];
  for (const hour of hours) {
    for (const minute of [0, 15, 30, 45]) {
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push({
        value,
        label: toFaTime(hour, minute),
      });
    }
  }
  return slots;
}

/** Derive slots from schedule day: prefer visitHours, else start–end range. */
export function medicalVisitSlotsForDay(daySchedule?: {
  visitHours?: number[];
} | null): QuarterSlot[] {
  const hours = daySchedule?.visitHours || [];
  if (!hours.length) return [];
  return buildQuarterSlotsFromVisitHours(hours);
}

export function formatPreferredTimeLabel(value: string): string {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    const asNum = Number(value);
    if (Number.isFinite(asNum)) return toFaTime(asNum, 0);
    return value;
  }
  return toFaTime(Number(match[1]), Number(match[2]));
}

export function isGeneralPhysician(doctor: {
  specialty?: string;
  specialtyId?: string | null;
}): boolean {
  const id = String(doctor.specialtyId || '')
    .trim()
    .toLowerCase();
  if (id === 'general' || id === 'gp' || id === 'general-medicine') return true;
  const name = String(doctor.specialty || '');
  return /عمومی|پزشک عمومی|general/i.test(name);
}
