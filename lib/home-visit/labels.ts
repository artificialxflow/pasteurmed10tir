import type { FieldStaffKind, FieldStaffStatus, HomeVisitKind } from '@prisma/client';

export function fieldStaffKindLabel(kind?: string | null): string {
  if (kind === 'nurse') return 'پرستار';
  if (kind === 'physician') return 'پزشک';
  return '—';
}

export function fieldStaffStatusLabel(status?: string | null): string {
  if (status === 'available') return 'در دسترس';
  if (status === 'busy') return 'مشغول';
  if (status === 'inactive') return 'غیرفعال';
  return '—';
}

export function homeVisitKindLabel(kind?: string | null): string {
  if (kind === 'nursing') return 'پرستاری در منزل';
  if (kind === 'medical_home') return 'ویزیت پزشک در منزل';
  return '—';
}

export function homeVisitStatusLabel(status?: string | null): string {
  switch (status) {
    case 'submitted':
      return 'درخواست ثبت شد';
    case 'staff_assigned':
      return 'نیروی مناسب پیدا شد';
    case 'staff_confirmed':
      return 'نیرو تأیید شد';
    case 'en_route':
      return 'نیرو در مسیر است';
    case 'completed':
      return 'خدمت انجام شد';
    case 'reviewed':
      return 'امتیاز ثبت شد';
    case 'cancelled':
      return 'لغو شد';
    default:
      return '—';
  }
}

export const FIELD_STAFF_KIND_OPTIONS: { value: FieldStaffKind; label: string }[] = [
  { value: 'nurse', label: 'پرستار' },
  { value: 'physician', label: 'پزشک' },
];

export const FIELD_STAFF_STATUS_OPTIONS: { value: FieldStaffStatus; label: string }[] = [
  { value: 'available', label: 'در دسترس' },
  { value: 'busy', label: 'مشغول' },
  { value: 'inactive', label: 'غیرفعال' },
];

export function staffKindForVisit(kind: HomeVisitKind): FieldStaffKind {
  return kind === 'nursing' ? 'nurse' : 'physician';
}
