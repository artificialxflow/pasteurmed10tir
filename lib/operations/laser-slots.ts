/**
 * Laser appointment slots — 10:00 to 19:00, one-hour blocks (۱۰ صبح تا ۷ عصر).
 */
import {
  buildAvailableBookingDates,
  formatBookingDateLabel,
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

export type LaserHourSlot = {
  value: string;
  hour: number;
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

export function buildLaserAvailableDates(daysAheadWeeks = 3): BookingDateOption[] {
  return buildAvailableBookingDates([...LASER_WORKING_DAYS], daysAheadWeeks);
}

export function formatLaserTimeLabel(hourRaw: string | number): string {
  const hour = Number(hourRaw);
  if (!Number.isFinite(hour)) return String(hourRaw);
  return `${toFaHour(hour)} — ${toFaHour(hour + 1)}`;
}

export { formatBookingDateLabel };
