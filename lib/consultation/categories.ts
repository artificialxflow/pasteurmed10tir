/** دسته‌هایی که فقط درخواست ثبت می‌شود و اپراتور تماس می‌گیرد (بدون پرداخت آنلاین). */
export const CONSULTATION_CALLBACK_CATEGORIES = [
  "dental-home",
  "dental-corporate",
  "psychology",
  "nutrition",
  "midwifery",
] as const;

export type ConsultationCallbackCategory = (typeof CONSULTATION_CALLBACK_CATEGORIES)[number];

export const MEDICAL_HOME_CATEGORY = "medical-home";

/** ویزیت پزشک عمومی / تخصصی در کلینیک (با انتخاب پزشک و نوبت). */
export const MEDICAL_CLINIC_CATEGORIES = ["medical", "medical-specialty"] as const;

/** مسیرهای اختصاصی — Quick Links عمومی نمایش داده نمی‌شود. */
export const FOCUSED_CONSULTATION_CATEGORIES = [
  MEDICAL_HOME_CATEGORY,
  ...MEDICAL_CLINIC_CATEGORIES,
  ...CONSULTATION_CALLBACK_CATEGORIES,
] as const;

export type FocusedConsultationCategory = (typeof FOCUSED_CONSULTATION_CATEGORIES)[number];

export function isConsultationCallbackCategory(
  categoryId?: string | null,
): categoryId is ConsultationCallbackCategory {
  return CONSULTATION_CALLBACK_CATEGORIES.includes(
    categoryId as ConsultationCallbackCategory,
  );
}

export function isMedicalHomeCategory(categoryId?: string | null): boolean {
  return categoryId === MEDICAL_HOME_CATEGORY;
}

export function isFocusedConsultationCategory(
  categoryId?: string | null,
): categoryId is FocusedConsultationCategory {
  return FOCUSED_CONSULTATION_CATEGORIES.includes(
    categoryId as FocusedConsultationCategory,
  );
}
