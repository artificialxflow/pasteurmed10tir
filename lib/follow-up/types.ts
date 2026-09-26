import type {
  FollowUpAttendedAction,
  FollowUpDissatisfactionTarget,
  FollowUpOutcome,
  FollowUpServiceCategory,
} from '@prisma/client';

export const FOLLOW_UP_SERVICE_OPTIONS: Array<{
  id: FollowUpServiceCategory;
  label: string;
}> = [
  { id: 'dental', label: 'دندانپزشکی' },
  { id: 'medical', label: 'پزشکی' },
  { id: 'nursing', label: 'پرستاری' },
  { id: 'laser', label: 'لیزر و زیبایی' },
];

export const FOLLOW_UP_OUTCOME_OPTIONS: Array<{ id: FollowUpOutcome; label: string }> = [
  { id: 'attended', label: 'آمد' },
  { id: 'no_show', label: 'نیامد' },
  { id: 'dissatisfied', label: 'ناراضی' },
];

export const FOLLOW_UP_ATTENDED_ACTION_OPTIONS: Array<{
  id: FollowUpAttendedAction;
  label: string;
}> = [
  { id: 'appointment_needed', label: 'نوبت داده شود' },
  { id: 'follow_up_needed', label: 'نیاز به پیگیری بعدی' },
];

export const FOLLOW_UP_DISSATISFACTION_OPTIONS: Array<{
  id: FollowUpDissatisfactionTarget;
  label: string;
}> = [
  { id: 'doctor', label: 'ناراضی از دکتر' },
  { id: 'staff', label: 'ناراضی از کادر' },
  { id: 'environment', label: 'ناراضی از محیط' },
];

export function followUpServiceLabel(category: FollowUpServiceCategory): string {
  return FOLLOW_UP_SERVICE_OPTIONS.find((o) => o.id === category)?.label || category;
}

export function followUpOutcomeLabel(outcome: FollowUpOutcome): string {
  return FOLLOW_UP_OUTCOME_OPTIONS.find((o) => o.id === outcome)?.label || outcome;
}

export function parseRating(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

export function normalizePhoneDigits(raw: unknown): string {
  return String(raw || '')
    .replace(/\D/g, '')
    .slice(-11);
}

export function parseIsoDateOnly(raw: unknown): Date | null {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function todayDateOnlyUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function formatDateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
