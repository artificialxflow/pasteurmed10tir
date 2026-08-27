/**
 * Installment SMS reminders (updates/10/07):
 * - 1 day before due date
 * - daily while overdue
 */
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

export async function processInstallmentSmsReminders(): Promise<InstallmentSmsCronResult> {
  const ids = smsBodyIds();
  const tomorrowIso = iranIsoDate(1);
  const { start: tomorrowStart, end: tomorrowEnd } = iranDayBounds(tomorrowIso);
  const todayStart = iranDayBounds(iranIsoDate(0)).start;

  let dueSent = 0;
  let overdueSent = 0;
  let scannedDue = 0;
  let scannedOverdue = 0;
  const skippedDuePattern = !ids.installmentDue;
  const skippedOverduePattern = !ids.installmentOverdue;

  if (ids.installmentDue) {
    const dueTomorrow = await prisma.installmentScheduleItem.findMany({
      where: {
        dueReminderSent: false,
        status: { not: 'paid' },
        dueDate: { gte: tomorrowStart, lte: tomorrowEnd },
        plan: { status: { in: ['active', 'overdue'] } },
      },
      include: { plan: true },
      take: 80,
      orderBy: { dueDate: 'asc' },
    });
    scannedDue = dueTomorrow.length;

    for (const item of dueTomorrow) {
      const remaining = Math.max(0, item.amount - item.paidAmount);
      if (remaining <= 0) {
        await prisma.installmentScheduleItem.update({
          where: { id: item.id },
          data: { dueReminderSent: true },
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
          data: { dueReminderSent: true },
        });
        dueSent += 1;
      }
    }
  }

  if (ids.installmentOverdue) {
    const overdueItems = await prisma.installmentScheduleItem.findMany({
      where: {
        status: { not: 'paid' },
        dueDate: { lt: todayStart },
        OR: [{ lastOverdueSmsAt: null }, { lastOverdueSmsAt: { lt: todayStart } }],
        plan: { status: { in: ['active', 'overdue'] } },
      },
      include: { plan: true },
      take: 80,
      orderBy: { dueDate: 'asc' },
    });
    scannedOverdue = overdueItems.length;

    for (const item of overdueItems) {
      const remaining = Math.max(0, item.amount - item.paidAmount);
      if (remaining <= 0) continue;

      const r = await sendInstallmentOverdueSms(
        item.plan.phone,
        item.plan.title,
        `قسط ${item.index.toLocaleString('fa-IR')}`,
        formatAmountFa(remaining),
      );
      if (r.ok) {
        await prisma.installmentScheduleItem.update({
          where: { id: item.id },
          data: {
            lastOverdueSmsAt: new Date(),
            status: item.status === 'paid' ? item.status : 'overdue',
          },
        });
        overdueSent += 1;
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
