/** تنظیمات متمرکز مدارک وام — تصمیم H0 */

export const LOAN_DOC_MAX_BYTES = 10 * 1024 * 1024;
export const LOAN_DOC_OTHER_MAX = 3;

export const LOAN_DOC_KINDS = [
  'birth-certificate',
  'national-id',
  'pay-stub',
  'credit-report',
  'guarantee-check',
  'other',
] as const;

export type LoanDocKind = (typeof LOAN_DOC_KINDS)[number];

export const LOAN_DOC_REQUIRED_KINDS: LoanDocKind[] = [
  'birth-certificate',
  'national-id',
  'pay-stub',
  'credit-report',
];

export const LOAN_DOC_KIND_LABELS: Record<LoanDocKind, string> = {
  'birth-certificate': 'شناسنامه',
  'national-id': 'کارت ملی',
  'pay-stub': 'فیش حقوقی یا حکم کارگزینی',
  'credit-report': 'اعتبارسنجی بانکی',
  'guarantee-check': 'چک تضمینی',
  other: 'سایر مدارک',
};

export const LOAN_CHECK_GUIDE = {
  payeeName: 'وحید اصغری',
  payeeNationalId: '1690073810',
  hint: 'به مبلغ وام · به تاریخ روز · در وجه وحید اصغری · کد ملی ۱۶۹۰۰۷۳۸۱۰',
};

export const LOAN_DOC_ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'pdf'] as const;

export const LOAN_DOC_ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
]);
