import { formatJalaliDate } from '@/lib/patient';

/** ۲٪ ماندهٔ قسط به‌ازای هر ماه کامل تأخیر — تصمیم L16 */
export const OVERDUE_PENALTY_PERCENT = 2;

/** از این تاریخ به بعد ماه‌های تأخیر شمرده می‌شود (عقب‌گرد سنگین نه) */
export const OVERDUE_PENALTY_EFFECTIVE_FROM = '2026-09-08';

const PENALTY_SOURCES = new Set(['loan', 'facility', 'credit']);

export function completeMonthsOverdue(dueIso: string, now = new Date()): number {
  const due = new Date(dueIso.length === 10 ? `${dueIso}T12:00:00` : dueIso);
  if (Number.isNaN(due.getTime())) return 0;
  const effective = new Date(`${OVERDUE_PENALTY_EFFECTIVE_FROM}T00:00:00`);
  const start = due > effective ? due : effective;
  if (now <= start) return 0;
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

export function overduePenaltyToman(input: {
  source?: string | null;
  status?: string | null;
  dueDate?: string | null;
  remaining?: number | null;
}): number {
  if (!PENALTY_SOURCES.has(String(input.source || ''))) return 0;
  if (input.status !== 'overdue' && input.status !== 'partial') return 0;
  const remaining = Math.max(0, Number(input.remaining || 0));
  if (!remaining || !input.dueDate) return 0;
  const months = completeMonthsOverdue(input.dueDate);
  if (months <= 0) return 0;
  return Math.floor((remaining * OVERDUE_PENALTY_PERCENT * months) / 100);
}

export function overduePenaltyLabel(penalty: number, months: number): string {
  if (penalty <= 0) return '';
  return `ضرر-زیان ${OVERDUE_PENALTY_PERCENT.toLocaleString('fa-IR')}٪ × ${months.toLocaleString('fa-IR')} ماه از ${formatJalaliDate(OVERDUE_PENALTY_EFFECTIVE_FROM)}`;
}
