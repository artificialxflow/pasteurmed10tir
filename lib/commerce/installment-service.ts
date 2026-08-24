import { prisma } from '@/lib/prisma';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { generateCommerceId } from '@/lib/commerce/mappers';
import { loadWalletSettings } from '@/lib/commerce/wallet-service';
import type {
  InstallmentItemStatus,
  InstallmentPaymentMethod,
  InstallmentSource,
} from '@prisma/client';

export function buildDueDates(count: number, start = new Date()): string[] {
  const dates: string[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < count; i += 1) {
    dates.push(cursor.toISOString());
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return dates;
}

/** Split total across N installments; remainder on the last. */
export function splitInstallmentAmounts(total: number, count: number): number[] {
  const n = Math.max(1, count);
  const base = Math.floor(total / n);
  const amounts = Array.from({ length: n }, () => base);
  const remainder = total - base * n;
  amounts[n - 1] += remainder;
  return amounts;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function deriveItemStatus(input: {
  dueDate: Date;
  amount: number;
  paidAmount: number;
}): InstallmentItemStatus {
  if (input.paidAmount >= input.amount) return 'paid';
  if (input.paidAmount > 0) return 'partial';
  const due = new Date(input.dueDate);
  due.setHours(0, 0, 0, 0);
  if (due < startOfToday()) return 'overdue';
  if (due.getTime() === startOfToday().getTime()) return 'due';
  return 'pending';
}

export function buildScheduleCreateData(input: {
  totalAmount: number;
  installmentCount: number;
  dueDates: string[];
}) {
  const count = Math.max(1, input.installmentCount);
  const amounts = splitInstallmentAmounts(input.totalAmount, count);
  const dates =
    input.dueDates.length >= count
      ? input.dueDates.slice(0, count)
      : buildDueDates(count);

  return amounts.map((amount, i) => {
    const dueDate = new Date(dates[i] || dates[dates.length - 1] || new Date().toISOString());
    return {
      id: generateCommerceId(),
      index: i + 1,
      dueDate,
      amount,
      paidAmount: 0,
      status: deriveItemStatus({ dueDate, amount, paidAmount: 0 }),
    };
  });
}

/** Allocate plan.paidAmount onto earliest schedule items (for backfill). */
export function allocatePaidAcrossItems(
  amounts: number[],
  paidTotal: number,
): number[] {
  let remaining = Math.max(0, paidTotal);
  return amounts.map((amount) => {
    const paid = Math.min(amount, remaining);
    remaining -= paid;
    return paid;
  });
}

async function ensureScheduleForPlan(planId: string) {
  const plan = await prisma.installmentPlan.findUnique({
    where: { id: planId },
    include: { scheduleItems: true },
  });
  if (!plan) return null;
  if (plan.scheduleItems.length > 0) return plan;

  const amounts = splitInstallmentAmounts(plan.totalAmount, plan.installmentCount);
  const paidParts = allocatePaidAcrossItems(amounts, plan.paidAmount);
  const dates =
    plan.dueDates.length >= plan.installmentCount
      ? plan.dueDates
      : buildDueDates(plan.installmentCount, plan.createdAt);

  await prisma.installmentScheduleItem.createMany({
    data: amounts.map((amount, i) => {
      const dueDate = new Date(dates[i] || plan.createdAt);
      const paidAmount = paidParts[i] || 0;
      return {
        id: generateCommerceId(),
        planId: plan.id,
        index: i + 1,
        dueDate,
        amount,
        paidAmount,
        status: deriveItemStatus({ dueDate, amount, paidAmount }),
      };
    }),
  });

  return prisma.installmentPlan.findUnique({
    where: { id: planId },
    include: {
      scheduleItems: { orderBy: { index: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function createCreditInstallmentPlan(input: {
  phone?: string | null;
  patientName?: string;
  ceilingAmount: number;
  label?: string;
}) {
  const phone = normalizePhoneDigits(input.phone || '');
  if (!phone) return null;
  const total = Math.max(0, Number(input.ceilingAmount || 0));
  if (!total) return null;

  const settings = await loadWalletSettings();
  const count = settings.installmentMax || 6;
  const start = new Date();
  start.setMonth(start.getMonth() + (settings.graceMonths || 1));
  const dueDates = buildDueDates(count, start);

  return prisma.installmentPlan.create({
    data: {
      id: generateCommerceId(),
      phone,
      patientName: input.patientName || null,
      source: 'credit',
      title: input.label || `اقساط بسته اعتباری ${total.toLocaleString('fa-IR')} تومان`,
      totalAmount: total,
      paidAmount: 0,
      installmentCount: count,
      dueDates,
      status: 'active',
      scheduleItems: { create: buildScheduleCreateData({ totalAmount: total, installmentCount: count, dueDates }) },
    },
    include: { scheduleItems: { orderBy: { index: 'asc' } }, payments: true },
  });
}

export async function createFacilityInstallmentPlan(input: {
  phone?: string | null;
  patientName?: string;
  amount: number;
  linkedRequestId?: string;
  title?: string;
}) {
  const phone = normalizePhoneDigits(input.phone || '');
  if (!phone) return null;
  const total = Math.max(0, Number(input.amount || 0));
  if (!total) return null;
  const count = 6;
  const dueDates = buildDueDates(count);

  return prisma.installmentPlan.create({
    data: {
      id: generateCommerceId(),
      phone,
      patientName: input.patientName || null,
      source: 'facility',
      title: input.title || `اقساط تسهیلات ${total.toLocaleString('fa-IR')} تومان`,
      totalAmount: total,
      paidAmount: 0,
      installmentCount: count,
      dueDates,
      status: 'active',
      linkedRequestId: input.linkedRequestId || null,
      scheduleItems: { create: buildScheduleCreateData({ totalAmount: total, installmentCount: count, dueDates }) },
    },
    include: { scheduleItems: { orderBy: { index: 'asc' } }, payments: true },
  });
}

/** Medical/membership loan after admin approve — 12% total, N months. */
export async function createLoanInstallmentPlan(input: {
  phone?: string | null;
  patientName?: string;
  amount: number;
  months?: number;
  linkedRequestId?: string;
  title?: string;
}) {
  const phone = normalizePhoneDigits(input.phone || '');
  if (!phone) return null;
  const principal = Math.max(0, Number(input.amount || 0));
  if (!principal) return null;
  const months = Math.min(36, Math.max(3, Number(input.months || 12)));
  const total = Math.round(principal * 1.12);
  const dueDates = buildDueDates(months);

  return prisma.installmentPlan.create({
    data: {
      id: generateCommerceId(),
      phone,
      patientName: input.patientName || null,
      source: 'loan',
      title:
        input.title ||
        `اقساط وام درمانی ${total.toLocaleString('fa-IR')} تومان (${months} ماه)`,
      totalAmount: total,
      paidAmount: 0,
      installmentCount: months,
      dueDates,
      status: 'active',
      linkedRequestId: input.linkedRequestId || null,
      scheduleItems: { create: buildScheduleCreateData({ totalAmount: total, installmentCount: months, dueDates }) },
    },
    include: { scheduleItems: { orderBy: { index: 'asc' } }, payments: true },
  });
}

export async function hideMembershipInstallmentPlans(phone?: string | null) {
  const key = phone ? normalizePhoneDigits(phone) : null;
  await prisma.installmentPlan.updateMany({
    where: {
      source: 'membership',
      ...(key ? { phone: key } : {}),
    },
    data: { status: 'hidden' },
  });
}

export async function listVisibleInstallments(phone?: string | null) {
  const key = phone ? normalizePhoneDigits(phone) : undefined;
  const rows = await prisma.installmentPlan.findMany({
    where: {
      status: { not: 'hidden' },
      source: { not: 'membership' },
      ...(key ? { phone: key } : {}),
    },
    include: {
      scheduleItems: { orderBy: { index: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const out = [];
  for (const row of rows) {
    if (row.scheduleItems.length === 0) {
      const healed = await ensureScheduleForPlan(row.id);
      if (healed) out.push(healed);
      else out.push(row);
    } else {
      // Refresh derived statuses (overdue) without heavy writes every time —
      // only update if stale overdue/pending mismatch.
      let dirty = false;
      for (const item of row.scheduleItems) {
        const next = deriveItemStatus(item);
        if (next !== item.status && item.status !== 'paid') {
          dirty = true;
          await prisma.installmentScheduleItem.update({
            where: { id: item.id },
            data: { status: next },
          });
        }
      }
      if (dirty) {
        const refreshed = await prisma.installmentPlan.findUnique({
          where: { id: row.id },
          include: {
            scheduleItems: { orderBy: { index: 'asc' } },
            payments: { orderBy: { createdAt: 'desc' } },
          },
        });
        out.push(refreshed || row);
      } else {
        out.push(row);
      }
    }
  }
  return out;
}

export async function applyInstallmentPayment(input: {
  planId: string;
  scheduleItemId: string;
  amount: number;
  method: InstallmentPaymentMethod;
  trackId?: string | null;
  note?: string | null;
  phone?: string | null;
}) {
  const plan = await prisma.installmentPlan.findUnique({
    where: { id: input.planId },
    include: { scheduleItems: true },
  });
  if (!plan) throw new Error('طرح اقساط یافت نشد.');
  if (input.phone) {
    const phone = normalizePhoneDigits(input.phone);
    if (plan.phone !== phone) throw new Error('دسترسی به این طرح مجاز نیست.');
  }

  const item = plan.scheduleItems.find((s) => s.id === input.scheduleItemId);
  if (!item) throw new Error('قسط یافت نشد.');
  if (item.status === 'paid' || item.paidAmount >= item.amount) {
    throw new Error('این قسط قبلاً پرداخت شده است.');
  }

  const due = item.amount - item.paidAmount;
  const amount = Math.round(Number(input.amount));
  if (amount !== due) {
    throw new Error(`مبلغ باید دقیقاً ${due.toLocaleString('fa-IR')} تومان باشد.`);
  }

  const paymentId = generateCommerceId();
  const paidAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.installmentPayment.create({
      data: {
        id: paymentId,
        planId: plan.id,
        scheduleItemId: item.id,
        amount,
        method: input.method,
        status: 'completed',
        trackId: input.trackId || null,
        note: input.note || null,
        paidAt,
      },
    });

    const newPaid = item.paidAmount + amount;
    await tx.installmentScheduleItem.update({
      where: { id: item.id },
      data: {
        paidAmount: newPaid,
        status: deriveItemStatus({
          dueDate: item.dueDate,
          amount: item.amount,
          paidAmount: newPaid,
        }),
      },
    });

    const planPaid = plan.paidAmount + amount;
    const allItems = await tx.installmentScheduleItem.findMany({ where: { planId: plan.id } });
    const allPaid = allItems.every((s) =>
      s.id === item.id ? newPaid >= s.amount : s.paidAmount >= s.amount,
    );

    await tx.installmentPlan.update({
      where: { id: plan.id },
      data: {
        paidAmount: planPaid,
        status: allPaid ? 'completed' : plan.status === 'hidden' ? 'hidden' : 'active',
      },
    });
  });

  return prisma.installmentPlan.findUnique({
    where: { id: plan.id },
    include: {
      scheduleItems: { orderBy: { index: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export type InstallmentSourceValue = InstallmentSource;
