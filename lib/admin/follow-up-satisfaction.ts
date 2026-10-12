import type { FollowUpCase, FollowUpServiceCategory } from '@prisma/client';
import { FOLLOW_UP_DISSATISFACTION_OPTIONS } from '@/lib/follow-up/types';

export type SatisfactionRole = 'doctor' | 'assistants' | 'reception' | 'environment';

export type SatisfactionStats = {
  serviceCategory: FollowUpServiceCategory | 'all';
  role: SatisfactionRole;
  doctorName: string | null;
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
  if (role === 'reception') return row.satisfactionReception;
  return row.satisfactionEnvironment;
}

function rowIncludesAssistant(row: FollowUpCase, assistantName: string): boolean {
  if (!row.assistantNamesJson) return false;
  try {
    const names = JSON.parse(row.assistantNamesJson) as unknown;
    if (!Array.isArray(names)) return false;
    const q = assistantName.trim();
    return names.some((n) => String(n).trim() === q);
  } catch {
    return false;
  }
}

export function computeSatisfactionStats(
  rows: FollowUpCase[],
  serviceCategory: FollowUpServiceCategory | 'all',
  role: SatisfactionRole,
  doctorName?: string | null,
  assistantName?: string | null,
): SatisfactionStats {
  let filtered =
    serviceCategory === 'all'
      ? rows
      : rows.filter((r) => r.serviceCategory === serviceCategory);

  const doctorFilter = doctorName?.trim();
  if (doctorFilter) {
    filtered = filtered.filter((r) => r.doctorName.trim() === doctorFilter);
  }

  const assistantFilter = assistantName?.trim();
  if (assistantFilter && role === 'assistants') {
    filtered = filtered.filter((r) => rowIncludesAssistant(r, assistantFilter));
  }

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
    doctorName: doctorFilter || null,
    average: avg(ratings),
    count: ratings.length,
    dissatisfied,
  };
}
