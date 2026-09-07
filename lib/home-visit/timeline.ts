import { homeVisitStatusLabel } from '@/lib/home-visit/labels';
import { HOME_VISIT_TIMELINE_STEPS } from '@/lib/home-visit/transitions';
import { formatJalaliDateTime } from '@/lib/patient';
import type { HomeVisitStatus } from '@prisma/client';

export type TimelineItem = {
  key: string;
  label: string;
  timeLabel?: string;
  state: 'done' | 'current' | 'upcoming' | 'cancelled';
};

export type StatusEventLike = {
  status: string;
  createdAt: string;
};

export function buildHomeVisitTimeline(input: {
  status: string;
  createdAt: string;
  assignedAt?: string;
  events?: StatusEventLike[];
}): TimelineItem[] {
  const firstAt = new Map<string, string>();
  for (const event of input.events || []) {
    if (!firstAt.has(event.status)) firstAt.set(event.status, event.createdAt);
  }
  if (!firstAt.has('submitted')) firstAt.set('submitted', input.createdAt);
  if (input.assignedAt && !firstAt.has('staff_assigned')) {
    firstAt.set('staff_assigned', input.assignedAt);
  }

  const cancelled = input.status === 'cancelled';
  const current = cancelled
    ? lastReachedStep(firstAt)
    : (input.status as HomeVisitStatus);
  const currentIndex = HOME_VISIT_TIMELINE_STEPS.indexOf(current);

  const items: TimelineItem[] = HOME_VISIT_TIMELINE_STEPS.map((step, index) => {
    const at = firstAt.get(step);
    let state: TimelineItem['state'] = 'upcoming';
    if (cancelled) {
      state = at ? 'done' : 'upcoming';
    } else if (index < currentIndex) {
      state = 'done';
    } else if (step === current) {
      state = 'current';
    }
    return {
      key: step,
      label: homeVisitStatusLabel(step),
      timeLabel: at ? formatJalaliDateTime(at) : undefined,
      state,
    };
  });

  if (cancelled) {
    items.push({
      key: 'cancelled',
      label: homeVisitStatusLabel('cancelled'),
      timeLabel: firstAt.get('cancelled') ? formatJalaliDateTime(firstAt.get('cancelled')) : undefined,
      state: 'cancelled',
    });
  }

  return items;
}

function lastReachedStep(firstAt: Map<string, string>): HomeVisitStatus {
  let last: HomeVisitStatus = 'submitted';
  for (const step of HOME_VISIT_TIMELINE_STEPS) {
    if (firstAt.has(step)) last = step;
  }
  return last;
}
