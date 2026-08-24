import { prisma } from '@/lib/prisma';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { generateCommerceId } from '@/lib/commerce/mappers';
import { loadWalletSettings } from '@/lib/commerce/wallet-service';
import type { InstallmentSource } from '@prisma/client';

function buildDueDates(count: number, start = new Date()): string[] {
  const dates: string[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < count; i += 1) {
    dates.push(cursor.toISOString());
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return dates;
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
      dueDates: buildDueDates(count, start),
      status: 'active',
    },
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

  return prisma.installmentPlan.create({
    data: {
      id: generateCommerceId(),
      phone,
      patientName: input.patientName || null,
      source: 'facility',
      title: input.title || `اقساط تسهیلات ${total.toLocaleString('fa-IR')} تومان`,
      totalAmount: total,
      paidAmount: 0,
      installmentCount: 6,
      dueDates: buildDueDates(6),
      status: 'active',
      linkedRequestId: input.linkedRequestId || null,
    },
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
      dueDates: buildDueDates(months),
      status: 'active',
      linkedRequestId: input.linkedRequestId || null,
    },
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
  return prisma.installmentPlan.findMany({
    where: {
      status: { not: 'hidden' },
      source: { not: 'membership' },
      ...(key ? { phone: key } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export type InstallmentSourceValue = InstallmentSource;
