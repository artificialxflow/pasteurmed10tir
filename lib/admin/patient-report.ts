import {
  formatJalaliDate,
  patientStatusLabel,
  resolveFranchisePercent,
  type PatientProfile,
  type PatientStatus,
} from '@/lib/patient';
import { zohalStatusLabel } from '@/lib/zohal/patient-verify';

export type PatientReportStatusFilter = 'all' | PatientStatus;

export type PatientReportStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  withNationalId: number;
  zohalPassed: number;
};

export type PatientReportRow = {
  name: string;
  phone: string;
  nationalId: string;
  franchisePercent: number;
  baseInsurance: string;
  complementaryInsurance: string;
  zohalLabel: string;
  status: string;
  reviewNote: string;
  createdAt: string;
  updatedAt: string;
};

export const PATIENT_REPORT_HEADERS = [
  'نام',
  'موبایل',
  'کد ملی',
  'فرانشیز٪',
  'بیمه پایه',
  'بیمه تکمیلی',
  'زحل',
  'وضعیت',
  'یادداشت',
  'تاریخ ثبت',
  'آخرین بروزرسانی',
] as const;

export function summarizePatientProfiles(items: PatientProfile[]): PatientReportStats {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let withNationalId = 0;
  let zohalPassed = 0;

  for (const item of items) {
    if (item.status === 'pending') pending += 1;
    else if (item.status === 'approved') approved += 1;
    else if (item.status === 'rejected') rejected += 1;
    if (item.nationalId) withNationalId += 1;
    if (item.zohalStatus === 'passed' || item.shahkarMatched === true) zohalPassed += 1;
  }

  return {
    total: items.length,
    pending,
    approved,
    rejected,
    withNationalId,
    zohalPassed,
  };
}

export function filterPatientsForReport(
  items: PatientProfile[],
  status: PatientReportStatusFilter,
  search = '',
): PatientProfile[] {
  const q = search.trim().toLowerCase();
  return items.filter((p) => {
    if (status !== 'all' && p.status !== status) return false;
    if (!q) return true;
    return (
      p.phone.includes(q) ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.nationalId || '').includes(q)
    );
  });
}

export function patientReportStatusLabel(status: PatientReportStatusFilter): string {
  if (status === 'all') return 'همه';
  return patientStatusLabel(status);
}

export function buildPatientReportRows(
  items: PatientProfile[],
  insuranceName: (id?: string) => string = (id) => id || '—',
): PatientReportRow[] {
  return items.map((p) => ({
    name: p.name || '—',
    phone: p.phone,
    nationalId: p.nationalId || '—',
    franchisePercent: resolveFranchisePercent(p),
    baseInsurance: insuranceName(p.baseInsuranceId),
    complementaryInsurance: insuranceName(p.complementaryInsuranceId),
    zohalLabel: zohalStatusLabel(p.zohalStatus, p.shahkarMatched),
    status: patientStatusLabel(p.status),
    reviewNote: p.reviewNote || '—',
    createdAt: formatJalaliDate(p.createdAt),
    updatedAt: formatJalaliDate(p.updatedAt),
  }));
}
