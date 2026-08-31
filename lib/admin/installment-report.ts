import type { InstallmentPlan } from '@/lib/patient';
import {
  formatJalaliDate,
  installmentSourceLabel,
  nextInstallmentDue,
  remainingInstallment,
} from '@/lib/patient';

export type InstallmentReportSource =
  | 'all'
  | 'loan'
  | 'facility'
  | 'credit'
  | 'legacy-membership';

export const INSTALLMENT_REPORT_TABS: Array<{ id: InstallmentReportSource; label: string }> = [
  { id: 'all', label: 'همه' },
  { id: 'loan', label: 'درمانی' },
  { id: 'facility', label: 'تجهیزات' },
  { id: 'credit', label: 'اعتباری' },
  { id: 'legacy-membership', label: 'منسوخ / عضویت' },
];

export function installmentReportSourceLabel(source: InstallmentReportSource): string {
  const tab = INSTALLMENT_REPORT_TABS.find((item) => item.id === source);
  return tab?.label || source;
}

export function filterInstallmentPlansForReport(
  items: InstallmentPlan[],
  rawItems: InstallmentPlan[],
  source: InstallmentReportSource,
): InstallmentPlan[] {
  if (source === 'all') return items;
  if (source === 'legacy-membership') {
    return rawItems.filter((p) => p.source === 'membership' || p.status === 'hidden');
  }
  if (source === 'credit') {
    return items.filter((p) => p.source === 'credit' || p.source === 'wallet');
  }
  return items.filter((p) => p.source === source);
}

export type InstallmentReportRow = {
  patientName: string;
  phone: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  sourceLabel: string;
  status: string;
  nextDue: string;
  createdAt: string;
};

function planStatusLabel(status: string): string {
  if (status === 'active') return 'فعال';
  if (status === 'completed') return 'تسویه‌شده';
  if (status === 'overdue') return 'معوق';
  if (status === 'hidden') return 'مخفی';
  return status;
}

export function buildInstallmentReportRows(plans: InstallmentPlan[]): InstallmentReportRow[] {
  return plans.map((plan) => ({
    patientName: plan.patientName || '—',
    phone: plan.phone,
    title: plan.title,
    totalAmount: plan.totalAmount,
    paidAmount: plan.paidAmount,
    remaining: remainingInstallment(plan),
    sourceLabel: installmentSourceLabel(plan.source),
    status: planStatusLabel(plan.status),
    nextDue: formatJalaliDate(nextInstallmentDue(plan)),
    createdAt: formatJalaliDate(plan.createdAt),
  }));
}

export const INSTALLMENT_REPORT_HEADERS = [
  'بیمار',
  'موبایل',
  'عنوان',
  'کل (تومان)',
  'پرداخت‌شده (تومان)',
  'مانده (تومان)',
  'منبع',
  'وضعیت',
  'سررسید بعدی',
  'تاریخ ثبت',
] as const;
