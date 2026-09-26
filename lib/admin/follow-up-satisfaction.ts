import type { FollowUpCase, FollowUpServiceCategory } from '@prisma/client';
import { FOLLOW_UP_DISSATISFACTION_OPTIONS } from '@/lib/follow-up/types';

export type SatisfactionRole = 'doctor' | 'assistants' | 'reception';

export type SatisfactionStats = {
  serviceCategory: FollowUpServiceCategory | 'all';
  role: SatisfactionRole;
  average: number | null;
  count: number;
  dissatisfied: Array<{
    id: string;
    patientName: string;
    patientPhone: string;
    doctorName: string;
    dissatisfactionTarget: string;
    dissatisfactionLabel: string;
    workDate: string;
  }>;
};

function avg(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function ratingForRole(row: FollowUpCase, role: SatisfactionRole): number | null {
  if (role === 'doctor') return row.satisfactionDoctor;
  if (role === 'assistants') return row.satisfactionAssistants;
  return row.satisfactionReception;
}

export function computeSatisfactionStats(
  rows: FollowUpCase[],
  serviceCategory: FollowUpServiceCategory | 'all',
  role: SatisfactionRole,
): SatisfactionStats {
  const filtered =
    serviceCategory === 'all'
      ? rows
      : rows.filter((r) => r.serviceCategory === serviceCategory);

  const ratings = filtered
    .map((r) => ratingForRole(r, role))
    .filter((n): n is number => n != null);

  const dissatisfied = filtered
    .filter((r) => r.outcome === 'dissatisfied' && r.dissatisfactionTarget)
    .map((r) => ({
      id: r.id,
      patientName: r.patientName,
      patientPhone: r.patientPhone,
      doctorName: r.doctorName,
      dissatisfactionTarget: r.dissatisfactionTarget!,
      dissatisfactionLabel:
        FOLLOW_UP_DISSATISFACTION_OPTIONS.find((o) => o.id === r.dissatisfactionTarget)
          ?.label || r.dissatisfactionTarget!,
      workDate: r.workDate.toISOString().slice(0, 10),
    }));

  return {
    serviceCategory,
    role,
    average: avg(ratings),
    count: ratings.length,
    dissatisfied,
  };
}
