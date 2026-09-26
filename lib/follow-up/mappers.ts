import type { FollowUpAttendedAction, FollowUpCase, SpecialistReferral } from '@prisma/client';
import { followUpOutcomeLabel, followUpServiceLabel } from '@/lib/follow-up/types';

export function mapSpecialistReferral(row: SpecialistReferral) {
  return {
    id: row.id,
    referrerName: row.referrerName,
    patientName: row.patientName,
    patientPhone: row.patientPhone,
    specialistName: row.specialistName,
    note: row.note ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapFollowUpCase(row: FollowUpCase) {
  return {
    id: row.id,
    workDate: row.workDate.toISOString().slice(0, 10),
    patientName: row.patientName,
    patientPhone: row.patientPhone,
    doctorName: row.doctorName,
    serviceCategory: row.serviceCategory,
    serviceCategoryLabel: followUpServiceLabel(row.serviceCategory),
    satisfactionDoctor: row.satisfactionDoctor,
    satisfactionAssistants: row.satisfactionAssistants,
    satisfactionReception: row.satisfactionReception,
    outcome: row.outcome,
    outcomeLabel: followUpOutcomeLabel(row.outcome),
    attendedAction: row.attendedAction ?? undefined,
    dissatisfactionTarget: row.dissatisfactionTarget ?? undefined,
    followUpDate: row.followUpDate?.toISOString().slice(0, 10),
    appointmentGiven: row.appointmentGiven,
    followUpDone: row.followUpDone,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type FollowUpTab = 'new' | 'appointment' | 'followup' | 'completed' | 'satisfaction';

export function isAwaitingAppointment(row: Pick<FollowUpCase, 'outcome' | 'attendedAction' | 'appointmentGiven'>) {
  return (
    row.outcome === 'attended' &&
    row.attendedAction === 'appointment_needed' &&
    !row.appointmentGiven
  );
}

export function isAwaitingFollowUp(row: Pick<FollowUpCase, 'outcome' | 'attendedAction' | 'followUpDone'>) {
  return (
    row.outcome === 'attended' &&
    row.attendedAction === 'follow_up_needed' &&
    !row.followUpDone
  );
}

export function isCompletedCase(row: FollowUpCase): boolean {
  if (row.outcome === 'no_show' || row.outcome === 'dissatisfied') return true;
  if (row.outcome === 'attended') {
    if (row.attendedAction === 'appointment_needed') return row.appointmentGiven;
    if (row.attendedAction === 'follow_up_needed') return row.followUpDone;
  }
  return false;
}

export function statusSummary(row: FollowUpCase): string {
  if (isAwaitingAppointment(row)) return 'در صف نوبت';
  if (isAwaitingFollowUp(row)) return 'در صف پیگیری';
  if (row.outcome === 'no_show') return 'نیامد';
  if (row.outcome === 'dissatisfied') return 'ناراضی';
  if (row.appointmentGiven) return 'نوبت داده شد';
  if (row.followUpDone) return 'پیگیری انجام شد';
  return followUpOutcomeLabel(row.outcome);
}

export function attendedActionLabel(action: FollowUpAttendedAction | null | undefined): string {
  if (action === 'appointment_needed') return 'نوبت داده شود';
  if (action === 'follow_up_needed') return 'پیگیری بعدی';
  return '—';
}
