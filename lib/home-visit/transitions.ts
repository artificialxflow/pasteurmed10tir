import type { HomeVisitStatus } from '@prisma/client';

export const HOME_VISIT_TIMELINE_STEPS: HomeVisitStatus[] = [
  'submitted',
  'staff_assigned',
  'staff_confirmed',
  'en_route',
  'completed',
  'reviewed',
];

const NEXT_STATUS: Partial<Record<HomeVisitStatus, HomeVisitStatus>> = {
  submitted: 'staff_assigned',
  staff_assigned: 'staff_confirmed',
  staff_confirmed: 'en_route',
  en_route: 'completed',
  completed: 'reviewed',
};

export function canCancelHomeVisit(status: HomeVisitStatus): boolean {
  return status === 'submitted' || status === 'staff_assigned' || status === 'staff_confirmed';
}

export function canAssignHomeVisit(status: HomeVisitStatus): boolean {
  return status === 'submitted' || status === 'staff_assigned';
}

export function canTransitionHomeVisit(from: HomeVisitStatus, to: HomeVisitStatus): boolean {
  if (to === 'cancelled') return canCancelHomeVisit(from);
  return NEXT_STATUS[from] === to;
}

export function nextHomeVisitStatus(status: HomeVisitStatus): HomeVisitStatus | null {
  return NEXT_STATUS[status] ?? null;
}
