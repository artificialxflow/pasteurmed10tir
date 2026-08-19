/**
 * پروفایل بیمار، بیمه، نظرات، شکایات، راهنما، اقساط — mock فرانت
 */

export type InsuranceCompany = {
  id: string;
  name: string;
  active?: boolean;
};

export type PatientStatus = 'pending' | 'approved' | 'rejected';

export type ZohalStatus = 'skipped' | 'pending' | 'passed' | 'failed' | 'error';

export type PatientProfile = {
  phone: string;
  name: string;
  nationalId?: string;
  baseInsuranceId?: string;
  complementaryInsuranceId?: string;
  /** درصد فرانشیز ۰–۱۰۰ (واحد صحیح v4) */
  franchisePercent: number;
  /** @deprecated واحد قدیمی تومان — فقط برای مهاجرت داده */
  franchiseAmount?: number;
  status: PatientStatus;
  reviewedAt?: string;
  reviewNote?: string;
  zohalStatus?: ZohalStatus;
  shahkarMatched?: boolean | null;
  zohalCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type InsuranceMode = 'none' | 'base' | 'complementary' | 'both';

export type InsuranceInquiryStatus = 'pending' | 'approved' | 'rejected';

export type InsuranceInquiry = {
  id: string;
  phone: string;
  patientName?: string;
  mode: InsuranceMode;
  baseInsuranceId?: string;
  complementaryInsuranceId?: string;
  franchisePercent: number;
  visitFee: number;
  depositAmount: number;
  status: InsuranceInquiryStatus;
  createdAt: string;
  resolvedAt?: string;
};

export type DoctorReview = {
  id: string;
  doctorId: string | number;
  doctorName: string;
  doctorKind: 'dental' | 'medical';
  phone: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'hidden';
  createdAt: string;
};

export type ComplaintStatus = 'new' | 'reviewing' | 'closed';

export type Complaint = {
  id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  status: ComplaintStatus;
  createdAt: string;
};

export type HelpItem = {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'pdf';
  url: string;
  active?: boolean;
};

export type InstallmentSource = 'credit' | 'facility' | 'membership' | 'wallet';

export type InstallmentPlan = {
  id: string;
  phone: string;
  patientName?: string;
  source: InstallmentSource;
  title: string;
  totalAmount: number;
  paidAmount: number;
  installmentCount: number;
  dueDates: string[];
  status: 'active' | 'completed' | 'overdue' | 'hidden';
  linkedRequestId?: string;
  createdAt: string;
};

export const DEFAULT_FRANCHISE_PERCENT = 10;
/** هزینه ویزیت نمونه برای QA (اسکرین ۰۲/۰۲ و ۰۲/۰۵) */
export const DEFAULT_VISIT_FEE_TOMAN = 350_000;

export const DEFAULT_BASE_INSURANCES: InsuranceCompany[] = [
  { id: 'tamin', name: 'تأمین اجتماعی', active: true },
  { id: 'salamat', name: 'بیمه سلامت', active: true },
  { id: 'niroo', name: 'نیروهای مسلح', active: true },
];

export const DEFAULT_COMPLEMENTARY_INSURANCES: InsuranceCompany[] = [
  { id: 'dana', name: 'بیمه دانا', active: true },
  { id: 'asia', name: 'بیمه آسیا', active: true },
  { id: 'alborz', name: 'بیمه البرز', active: true },
  { id: 'pasargad', name: 'بیمه پاسارگاد', active: true },
  { id: 'saman', name: 'بیمه سامان', active: true },
];

export const DEFAULT_HELP_ITEMS: HelpItem[] = [
  {
    id: 'help-booking',
    title: 'آموزش رزرو نوبت دندانپزشکی',
    description: 'مراحل انتخاب پزشک، روز، ساعت و پرداخت بیعانه',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    active: true,
  },
  {
    id: 'help-account',
    title: 'راهنمای پنل کاربری و بیمه (PDF)',
    description: 'ثبت مشخصات، بیمه پایه/تکمیلی و فرانشیز',
    type: 'pdf',
    url: '/privacy',
    active: true,
  },
];

export function normalizePatientPhone(phone?: string | null): string {
  return String(phone || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^\d]/g, '');
}

export function clampFranchisePercent(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_FRANCHISE_PERCENT;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** مبلغ واریزی = درصد فرانشیز × هزینه ویزیت */
export function payableFromFranchise(visitFee: number, percent: number): number {
  return Math.round((Math.max(0, Number(visitFee) || 0) * clampFranchisePercent(percent)) / 100);
}

/** خواندن درصد از پروفایل با مهاجرت از franchiseAmount قدیمی */
export function resolveFranchisePercent(
  profile?: Pick<PatientProfile, 'franchisePercent' | 'franchiseAmount'> | null,
): number {
  if (profile == null) return DEFAULT_FRANCHISE_PERCENT;
  if (profile.franchisePercent != null && Number(profile.franchisePercent) >= 0) {
    return clampFranchisePercent(Number(profile.franchisePercent));
  }
  const legacy = Number(profile.franchiseAmount || 0);
  if (legacy > 0 && legacy <= 100) return clampFranchisePercent(legacy);
  return DEFAULT_FRANCHISE_PERCENT;
}

export function isPatientApproved(profile?: PatientProfile | null): boolean {
  return profile?.status === 'approved';
}

export function patientStatusLabel(status?: PatientStatus | string): string {
  if (status === 'approved') return 'تأیید شده';
  if (status === 'rejected') return 'رد شده';
  return 'در حال بررسی';
}

export function insuranceInquiryStatusLabel(status?: InsuranceInquiryStatus | string): string {
  if (status === 'approved') return 'تأیید شده';
  if (status === 'rejected') return 'رد شده';
  return 'در انتظار بررسی';
}

export function bookingStatusLabel(status?: string): string {
  if (status === 'confirmed') return 'تأیید شده';
  if (status === 'cancelled') return 'لغو شده';
  return 'در انتظار';
}

export function installmentSourceLabel(source: InstallmentSource | string): string {
  if (source === 'credit' || source === 'wallet') return 'اعتبار';
  if (source === 'facility') return 'تسهیلات';
  if (source === 'membership') return 'عضویت (منسوخ)';
  return source;
}

export function remainingInstallment(plan: InstallmentPlan): number {
  return Math.max(0, Number(plan.totalAmount || 0) - Number(plan.paidAmount || 0));
}

export function nextInstallmentDue(plan: InstallmentPlan): string | null {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (plan.dueDates || []).filter((d) => d >= today).sort();
  return upcoming[0] || plan.dueDates?.[plan.dueDates.length - 1] || null;
}

/** نمایش تاریخ شمسی برای سررسید اقساط */
export function formatJalaliDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const raw = isoDate.length === 10 ? `${isoDate}T12:00:00` : isoDate;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('fa-IR');
}

export function buildDueDates(count: number, start = new Date()): string[] {
  const dates: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function normalizePatientProfile(
  raw: Partial<PatientProfile> & { phone: string },
): PatientProfile {
  const now = new Date().toISOString();
  return {
    phone: normalizePatientPhone(raw.phone),
    name: raw.name || 'بیمار',
    nationalId: raw.nationalId,
    baseInsuranceId: raw.baseInsuranceId,
    complementaryInsuranceId: raw.complementaryInsuranceId,
    franchisePercent: resolveFranchisePercent(raw as PatientProfile),
    status: (raw.status as PatientStatus) || 'pending',
    reviewedAt: raw.reviewedAt,
    reviewNote: raw.reviewNote,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };
}
