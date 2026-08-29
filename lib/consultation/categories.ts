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
