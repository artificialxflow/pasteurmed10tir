/** جریمه ۱٪ روزانه مانده قسط — بسته 35/05 (SMS و نمایش قابل پرداخت) */
export const INSTALLMENT_DAILY_PENALTY_PERCENT = 1;

export function installmentDaysOverdue(dueDate: Date, todayStart: Date): number {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const start = new Date(todayStart);
  start.setHours(0, 0, 0, 0);
  const diffMs = start.getTime() - due.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function installmentDailyPenaltyToman(remaining: number, overdueDays: number): number {
  const base = Math.max(0, Math.round(remaining));
  if (!base || overdueDays <= 0) return 0;
  return Math.floor((base * INSTALLMENT_DAILY_PENALTY_PERCENT * overdueDays) / 100);
}

export function installmentPayableWithPenaltyToman(
  remaining: number,
  dueDate: Date,
  todayStart: Date,
): { remaining: number; penalty: number; payable: number; overdueDays: number } {
  const rem = Math.max(0, Math.round(remaining));
  const overdueDays = installmentDaysOverdue(dueDate, todayStart);
  const penalty = installmentDailyPenaltyToman(rem, overdueDays);
  return { remaining: rem, penalty, payable: rem + penalty, overdueDays };
}