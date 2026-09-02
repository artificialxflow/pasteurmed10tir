/**
 * Laser appointment slots — 10:00 to 19:00, one-hour blocks (۱۰ صبح تا ۷ عصر).
 */
import {
  buildAvailableBookingDatesForMonths,
  formatBookingDateLabel,
  persianMonthKey,
  persianMonthLabel,
  type BookingDateOption,
} from '@/lib/operations/booking-dates';

export const LASER_SLOT_START_HOUR = 10;
/** Last bookable hour start (18:00–19:00). End of day is 19:00. */
export const LASER_SLOT_END_HOUR = 18;

export const LASER_WORKING_DAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
] as const;

export const DEFAULT_LASER_RESERVATION_FEE = 100_000;
export const LASER_BOOKING_MONTHS_AHEAD = 3;

export type LaserHourSlot = {
  value: string;
  hour: number;
  label: string;
};

export type LaserMonthOption = {
  key: string;
  label: string;
};

function toFaHour(hour: number): string {
  return `${hour.toLocaleString('fa-IR')}:۰۰`;
}

export function buildLaserHourSlots(): LaserHourSlot[] {
  const slots: LaserHourSlot[] = [];
  for (let hour = LASER_SLOT_START_HOUR; hour <= LASER_SLOT_END_HOUR; hour++) {
    slots.push({
      hour,
      value: String(hour),
      label: `${toFaHour(hour)} — ${toFaHour(hour + 1)}`,
    });
  }
  return slots;
}

/** Legacy weeks-based helper — now maps to month coverage. */
export function buildLaserAvailableDates(daysAheadWeeks = 12): BookingDateOption[] {
  const months = Math.max(1, Math.ceil(daysAheadWeeks / 4));
  return buildLaserDatesForMonths(months);
}

export function buildLaserDatesForMonths(
  monthsAhead = LASER_BOOKING_MONTHS_AHEAD,
): BookingDateOption[] {
  return buildAvailableBookingDatesForMonths([...LASER_WORKING_DAYS], monthsAhead);
}

export function listLaserMonthOptions(dates: BookingDateOption[]): LaserMonthOption[] {
  const seen = new Map<string, string>();
  for (const date of dates) {
    const key = persianMonthKey(date.isoDate);
    if (!key || seen.has(key)) continue;
    seen.set(key, persianMonthLabel(date.isoDate));
  }
  return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
}

export function filterLaserDatesByMonth(
  dates: BookingDateOption[],
  monthKey: string,
): BookingDateOption[] {
  if (!monthKey) return dates;
  return dates.filter((d) => persianMonthKey(d.isoDate) === monthKey);
}

export function formatLaserTimeLabel(hourRaw: string | number): string {
  const hour = Number(hourRaw);
  if (!Number.isFinite(hour)) return String(hourRaw);
  return `${toFaHour(hour)} — ${toFaHour(hour + 1)}`;
}

export { formatBookingDateLabel };
