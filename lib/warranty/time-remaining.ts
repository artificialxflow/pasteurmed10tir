/** Remaining warranty time until expiresAt (clock uses local viewer; dates stored UTC). */
export function warrantyTimeRemaining(expiresAt: string | Date): {
  expired: boolean;
  days: number;
  hours: number;
  totalHours: number;
} {
  const end = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt.getTime();
  const diffMs = end - Date.now();
  if (diffMs <= 0) {
    return { expired: true, days: 0, hours: 0, totalHours: 0 };
  }
  const totalHours = Math.ceil(diffMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return { expired: false, days, hours, totalHours };
}

export function formatWarrantyRemaining(expiresAt: string): string {
  const r = warrantyTimeRemaining(expiresAt);
  if (r.expired) return 'منقضی شده';
  if (r.days > 0 && r.hours > 0) {
    return `${r.days.toLocaleString('fa-IR')} روز و ${r.hours.toLocaleString('fa-IR')} ساعت مانده`;
  }
  if (r.days > 0) return `${r.days.toLocaleString('fa-IR')} روز تا پایان گارانتی`;
  return `${Math.max(1, r.hours).toLocaleString('fa-IR')} ساعت مانده`;
}