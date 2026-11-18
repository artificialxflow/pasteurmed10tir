export function warrantyPlannedDurationMs(startedAt: Date, expiresAt: Date): number {
  return Math.max(0, expiresAt.getTime() - startedAt.getTime());
}

/** شروع واقعی از لحظهٔ فعال‌سازی بیمار؛ مدت همان بازهٔ ثبت‌شده ادمین */
export function applyPatientWarrantyActivation(
  plannedStartedAt: Date,
  plannedExpiresAt: Date,
  now = new Date(),
): { startedAt: Date; expiresAt: Date; activatedAt: Date } {
  const durationMs = warrantyPlannedDurationMs(plannedStartedAt, plannedExpiresAt);
  return {
    startedAt: now,
    expiresAt: new Date(now.getTime() + durationMs),
    activatedAt: now,
  };
}

export function warrantyPatientStatusLabel(status: 'pending' | 'active'): string {
  return status === 'pending' ? 'در انتظار فعال‌سازی در پنل' : 'فعال';
}