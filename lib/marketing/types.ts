import type {
  MarketingFollowUpKind,
  MarketingNewCaseOutcome,
  MarketingReportKind,
  MarketingUnsuccessfulReason,
} from '@prisma/client';

export type MarketingContact = {
  name: string;
  phone: string;
  role: string;
};

export const MARKETING_KIND_OPTIONS: Array<{ id: MarketingReportKind; label: string }> = [
  { id: 'new_case', label: 'مورد جدید' },
  { id: 'success', label: 'موفق' },
  { id: 'follow_up', label: 'نیاز به پیگیری' },
  { id: 'unsuccessful', label: 'ناموفق' },
  { id: 'blocked', label: 'مسدود' },
];

export const MARKETING_NEW_CASE_OUTCOME_OPTIONS: Array<{
  id: MarketingNewCaseOutcome;
  label: string;
}> = [
  { id: 'success', label: 'موفق' },
  { id: 'unsuccessful', label: 'ناموفق' },
  { id: 'follow_up', label: 'نیاز به پیگیری' },
  { id: 'blocked', label: 'مسدود' },
];

export const MARKETING_UNSUCCESSFUL_REASON_OPTIONS: Array<{
  id: MarketingUnsuccessfulReason;
  label: string;
}> = [
  { id: 'not_approved', label: 'مورد تأیید نبود' },
  { id: 'tariff', label: 'مشکل تعرفه' },
  { id: 'contract', label: 'مشکل قرارداد' },
  { id: 'loan_percent', label: 'مشکل درصد وام' },
  { id: 'discount', label: 'مشکل تخفیف' },
  { id: 'competitors', label: 'رقبا' },
];

export const MARKETING_FOLLOW_UP_KIND_OPTIONS: Array<{
  id: MarketingFollowUpKind;
  label: string;
}> = [
  { id: 'catalog', label: 'ارائه کاتالوگ' },
  { id: 'call', label: 'تماس گرفته شود' },
  { id: 'appointment', label: 'قرار ملاقات' },
  { id: 'commission', label: 'کمیسیون' },
  { id: 'no_response', label: 'عدم پاسخگویی' },
  { id: 'in_person', label: 'حضوری' },
  { id: 'sample', label: 'ارائه سمپل' },
];

export function marketingKindLabel(kind: MarketingReportKind): string {
  return MARKETING_KIND_OPTIONS.find((o) => o.id === kind)?.label || kind;
}

export function marketingUnsuccessfulReasonLabel(
  reason: MarketingUnsuccessfulReason | null | undefined,
): string {
  if (!reason) return '—';
  return MARKETING_UNSUCCESSFUL_REASON_OPTIONS.find((o) => o.id === reason)?.label || reason;
}

export function marketingFollowUpKindLabel(
  kind: MarketingFollowUpKind | null | undefined,
): string {
  if (!kind) return '—';
  return MARKETING_FOLLOW_UP_KIND_OPTIONS.find((o) => o.id === kind)?.label || kind;
}

export const MARKETING_FOLLOW_UP_SLOT_COUNT = 5;
