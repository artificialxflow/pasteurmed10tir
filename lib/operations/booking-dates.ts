/**
 * Booking calendar dates — Iran timezone (UTC+3:30), Persian weekday names.
 */
const IRAN_OFFSET_MS = (3 * 60 + 30) * 60 * 1000;

const PERSIAN_WEEKDAY_BY_DOW = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
] as const;

export type BookingDateOption = {
  isoDate: string;
  weekday: string;
  label: string;
};

function normalizeWeekday(name: string): string {
  return name.trim().replace(/\u200c/g, '');
}

function weekdayMatches(scheduleDay: string, weekday: string): boolean {
  return normalizeWeekday(scheduleDay) === normalizeWeekday(weekday);
}

function isoFromIrDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Start/end of calendar day in Iran, as UTC Date instances for DB queries. */
export function iranDayBounds(isoDate: string): { start: Date; end: Date } {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) {
    const invalid = new Date(0);
    return { start: invalid, end: invalid };
  }
  const startIr = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const endIr = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  return {
    start: new Date(startIr.getTime() - IRAN_OFFSET_MS),
    end: new Date(endIr.getTime() - IRAN_OFFSET_MS),
  };
}

export function persianWeekdayFromIsoDate(isoDate: string): string | null {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const noonIr = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  const dow = noonIr.getUTCDay();
  return PERSIAN_WEEKDAY_BY_DOW[dow] ?? null;
}

export function appointmentAtFromIsoAndHour(
  isoDate: string,
  hourRaw: number | string | null | undefined,
): Date | null {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const hour = Number(hourRaw);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  const resultIr = new Date(Date.UTC(y, m - 1, d, hour, 0, 0, 0));
  return new Date(resultIr.getTime() - IRAN_OFFSET_MS);
}

export function formatBookingDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return date.toLocaleDateString('fa-IR', {
    timeZone: 'Asia/Tehran',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Upcoming calendar dates matching doctor working weekdays (default 8 weeks). */
export function buildAvailableBookingDates(
  workingDays: string[],
  weeksAhead = 8,
): BookingDateOption[] {
  if (!workingDays.length) return [];

  const nowIr = new Date(Date.now() + IRAN_OFFSET_MS);
  nowIr.setUTCHours(0, 0, 0, 0);

  const results: BookingDateOption[] = [];
  const totalDays = weeksAhead * 7;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(nowIr.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    const weekday = PERSIAN_WEEKDAY_BY_DOW[d.getUTCDay()];
    const matchedDay = workingDays.find((wd) => weekdayMatches(wd, weekday));
    if (!matchedDay) continue;

    const isoDate = isoFromIrDate(d);
    results.push({
      isoDate,
      weekday: matchedDay,
      label: formatBookingDateLabel(isoDate),
    });
  }

  return results;
}
