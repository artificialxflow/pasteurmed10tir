/**
 * Installment SMS reminders (updates/35/05):
 * - 5 and 2 days before due
 * - 2 and 5 days after due (with 1% daily penalty in amount text)
 */
import { installmentPayableWithPenaltyToman } from '@/lib/commerce/installment-daily-penalty';
import { iranDayBounds } from '@/lib/operations/booking-dates';
import { prisma } from '@/lib/prisma';
import {
  sendInstallmentDueSms,
  sendInstallmentOverdueSms,
  smsBodyIds,
} from '@/lib/sms/client';

const IRAN_OFFSET_MS = (3 * 60 + 30) * 60 * 1000;

function iranIsoDate(offsetDays = 0): string {
  const nowIr = new Date(Date.now() + IRAN_OFFSET_MS);
  nowIr.setUTCHours(0, 0, 0, 0);
  nowIr.setUTCDate(nowIr.getUTCDate() + offsetDays);
  const y = nowIr.getUTCFullYear();
  const m = String(nowIr.getUTCMonth() + 1).padStart(2, '0');
  const d = String(nowIr.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatAmountFa(amount: number): string {
  return `${Math.max(0, amount).toLocaleString('fa-IR')} تومان`;
}

function formatDueDateFa(due: Date): string {
  return due.toLocaleDateString('fa-IR', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export type InstallmentSmsCronResult = {
  dueSent: number;
  overdueSent: number;
  scannedDue: number;
  scannedOverdue: number;
  skippedDuePattern: boolean;
  skippedOverduePattern: boolean;
};

type DueSlot = { offsetDays: number; flag: 'dueSms5dSent' | 'dueSms2dSent' };
type OverdueSlot = { overdueDays: number; flag: 'overdueSms2dSent' | 'overdueSms5dSent' };

const DUE_SLOTS: DueSlot[] = [
  { offsetDays: 5, flag: 'dueSms5dSent' },
  { offsetDays: 2, flag: 'dueSms2dSent' },
];

const OVERDUE_SLOTS: OverdueSlot[] = [
  { overdueDays: 2, flag: 'overdueSms2dSent' },
  { overdueDays: 5, flag: 'overdueSms5dSent' },
];

export async function processInstallmentSmsReminders(): Promise<InstallmentSmsCronResult> {
  const ids = smsBodyIds();
  const todayStart = iranDayBounds(iranIsoDate(0)).start;
  let dueSent = 0;
  let overdueSent = 0;
  let scannedDue = 0;
  let scannedOverdue = 0;
  const skippedDuePattern = !ids.installmentDue;
  const skippedOverduePattern = !ids.installmentOverdue;

  if (ids.installmentDue) {
    for (const slot of DUE_SLOTS) {
      const targetIso = iranIsoDate(slot.offsetDays);
      const { start, end } = iranDayBounds(targetIso);
      const items = await prisma.installmentScheduleItem.findMany({
        where: {
          [slot.flag]: false,
          status: { not: 'paid' },
          dueDate: { gte: start, lte: end },
          plan: { status: { in: ['active', 'overdue'] }, deletedAt: null },
        },
        include: { plan: true },
        take: 80,
        orderBy: { dueDate: 'asc' },
      });
      scannedDue += items.length;

      for (const item of items) {
        const remaining = Math.max(0, item.amount - item.paidAmount);
        if (remaining <= 0) {
          await prisma.installmentScheduleItem.update({
            where: { id: item.id },
            data: { [slot.flag]: true, dueReminderSent: true },
          });
          continue;
        }
        const r = await sendInstallmentDueSms(
          item.plan.phone,
          item.plan.title,
          formatAmountFa(remaining),
          formatDueDateFa(item.dueDate),
        );
        if (r.ok) {
          await prisma.installmentScheduleItem.update({
            where: { id: item.id },
            data: { [slot.flag]: true, dueReminderSent: true },
          });
          dueSent += 1;
        }
      }
    }
  }

  if (ids.installmentOverdue) {
    const overdueItems = await prisma.installmentScheduleItem.findMany({
      where: {
        status: { not: 'paid' },
        dueDate: { lt: todayStart },
        plan: { status: { in: ['active', 'overdue'] }, deletedAt: null },
      },
      include: { plan: true },
      take: 120,
      orderBy: { dueDate: 'asc' },
    });

    for (const slot of OVERDUE_SLOTS) {
      const matching = overdueItems.filter((item) => {
        const remaining = Math.max(0, item.amount - item.paidAmount);
        if (remaining <= 0) return false;
        if (item[slot.flag]) return false;
        const { overdueDays } = installmentPayableWithPenaltyToman(
          remaining,
          item.dueDate,
          todayStart,
        );
        return overdueDays === slot.overdueDays;
      });
      scannedOverdue += matching.length;

      for (const item of matching) {
        const remaining = Math.max(0, item.amount - item.paidAmount);
        const pay = installmentPayableWithPenaltyToman(remaining, item.dueDate, todayStart);
        const amountLabel =
          pay.penalty > 0
            ? `${formatAmountFa(pay.payable)} (شامل ${pay.overdueDays.toLocaleString('fa-IR')} روز تأخیر)`
            : formatAmountFa(pay.payable);

        const r = await sendInstallmentOverdueSms(
          item.plan.phone,
          item.plan.title,
          `قسط ${item.index.toLocaleString('fa-IR')}`,
          amountLabel,
        );
        if (r.ok) {
          await prisma.installmentScheduleItem.update({
            where: { id: item.id },
            data: {
              [slot.flag]: true,
              lastOverdueSmsAt: new Date(),
              status: item.status === 'paid' ? item.status : 'overdue',
            },
          });
          overdueSent += 1;
        }
      }
    }
  }

  return {
    dueSent,
    overdueSent,
    scannedDue,
    scannedOverdue,
    skippedDuePattern,
    skippedOverduePattern,
  };
}