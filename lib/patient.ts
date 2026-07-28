/**
 * پروفایل بیمار، بیمه، نظرات، شکایات، راهنما، اقساط — mock فرانت
 */

export type InsuranceCompany = {
  id: string;
  name: string;
  active?: boolean;
};

export type PatientProfile = {
  phone: string;
  name: string;
  nationalId?: string;
  baseInsuranceId?: string;
  complementaryInsuranceId?: string;
  franchiseAmount: number;
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
  franchiseAmount: number;
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

export type InstallmentPlan = {
  id: string;
  phone: string;
  patientName?: string;
  source: 'membership' | 'wallet';
  title: string;
  totalAmount: number;
  paidAmount: number;
  installmentCount: number;
  dueDates: string[];
  status: 'active' | 'completed' | 'overdue';
  createdAt: string;
};

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

export function remainingInstallment(plan: InstallmentPlan): number {
  return Math.max(0, Number(plan.totalAmount || 0) - Number(plan.paidAmount || 0));
}

export function nextInstallmentDue(plan: InstallmentPlan): string | null {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (plan.dueDates || []).filter((d) => d >= today).sort();
  return upcoming[0] || plan.dueDates?.[plan.dueDates.length - 1] || null;
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
