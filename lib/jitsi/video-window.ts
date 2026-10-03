import { appointmentAtFromIsoAndTime } from '@/lib/operations/booking-dates';

/** Room stays joinable until 30 minutes after the scheduled visit time. */
export const CONSULTATION_VIDEO_GRACE_MS = 30 * 60 * 1000;

export type ConsultationVideoSchedule = {
  preferredDate?: string | null;
  preferredTime?: string | null;
  videoStatus?: string | null;
};

function isJoinableVideoStatus(status: string | null | undefined): boolean {
  return status === 'scheduled' || status === 'in_call';
}

/** Absolute expiry instant (visit start + grace), or null if schedule unknown. */
export function consultationVideoExpiresAt(
  row: ConsultationVideoSchedule,
): Date | null {
  const iso = String(row.preferredDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const start = appointmentAtFromIsoAndTime(iso.slice(0, 10), row.preferredTime);
  if (!start) return null;
  return new Date(start.getTime() + CONSULTATION_VIDEO_GRACE_MS);
}

export function isConsultationVideoWindowExpired(
  row: ConsultationVideoSchedule,
  nowMs: number = Date.now(),
): boolean {
  const expiresAt = consultationVideoExpiresAt(row);
  if (!expiresAt) return false;
  return nowMs >= expiresAt.getTime();
}

/** Status + visit-time window (when schedule is known). */
export function canJoinConsultationVideoNow(row: ConsultationVideoSchedule): boolean {
  if (!isJoinableVideoStatus(row.videoStatus)) return false;
  return !isConsultationVideoWindowExpired(row);
}
