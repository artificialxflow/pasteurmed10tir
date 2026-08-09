/**
 * Approx next appointment from Persian weekday name + hour (local IR approximation via UTC+3:30).
 */
const DAY_MAP: Record<string, number> = {
  یکشنبه: 0,
  دوشنبه: 1,
  سه‌شنبه: 2,
  سهشنبه: 2,
  چهارشنبه: 3,
  پنجشنبه: 4,
  جمعه: 5,
  شنبه: 6,
};

export function nextAppointmentAt(
  dayName: string | null | undefined,
  hourRaw: number | string | null | undefined,
): Date | null {
  if (!dayName) return null;
  const targetDow = DAY_MAP[dayName.trim()];
  if (targetDow === undefined) return null;

  const hour = Number(hourRaw);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;

  // Work in Iran Standard Time (UTC+3:30)
  const offsetMs = (3 * 60 + 30) * 60 * 1000;
  const nowUtc = Date.now();
  const nowIr = new Date(nowUtc + offsetMs);

  const resultIr = new Date(nowIr.getTime());
  const currentDow = resultIr.getUTCDay();
  let add = (targetDow - currentDow + 7) % 7;
  resultIr.setUTCHours(hour, 0, 0, 0);
  if (add === 0 && resultIr.getTime() <= nowIr.getTime()) add = 7;
  resultIr.setUTCDate(resultIr.getUTCDate() + add);

  return new Date(resultIr.getTime() - offsetMs);
}
