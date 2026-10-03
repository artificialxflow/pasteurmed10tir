import { supportsConsultationVideo } from '@/lib/consultation/categories';

/** سه کانال اصلی مشاوره — `image` قدیمی به تصویری نگاشت می‌شود. */
export type ConsultationModality = 'text' | 'audio' | 'video';

/** انواع قابل انتخاب در فرم (سه کانال مجزا). */
export const CONSULTATION_FORM_TYPE_IDS = ['text', 'phone', 'video'] as const;

export type ConsultationFormTypeId = (typeof CONSULTATION_FORM_TYPE_IDS)[number];

export function consultationModality(typeId?: string | null): ConsultationModality {
  const t = String(typeId || '')
    .trim()
    .toLowerCase();
  if (t === 'phone' || t === 'audio') return 'audio';
  /** `image` = مشاوره تصویری قدیمی (ارسال عکس) → کانال تصویری کامل */
  if (t === 'video' || t === 'image') return 'video';
  return 'text';
}

export function consultationAllowsImage(typeId?: string | null): boolean {
  return consultationModality(typeId) === 'video';
}

export function consultationAllowsAudio(typeId?: string | null): boolean {
  const m = consultationModality(typeId);
  return m === 'audio' || m === 'video';
}

export function consultationTypeSupportsVideoRoom(typeId?: string | null): boolean {
  return consultationModality(typeId) === 'video';
}

/**
 * اتاق/ویزیت تصویری فقط وقتی هم دسته خدمت ویدیویی باشد
 * و هم نوع مشاوره «تصویری» باشد — نه متنی و نه صوتی.
 * رکوردهای قدیمی بدون `type` مثل قبل فقط با دسته چک می‌شوند.
 */
export function consultationSupportsVideoSession(input: {
  category?: string | null;
  type?: string | null;
}): boolean {
  if (!supportsConsultationVideo(input.category)) return false;
  const typeId = String(input.type || '').trim();
  if (!typeId) return true;
  return consultationTypeSupportsVideoRoom(typeId);
}

/** نرمال‌سازی type از query/form — image قدیمی → video */
export function normalizeConsultationFormTypeId(
  typeId?: string | null,
): ConsultationFormTypeId {
  const m = consultationModality(typeId);
  if (m === 'audio') return 'phone';
  if (m === 'video') return 'video';
  return 'text';
}

export function modalityCapabilityHint(typeId?: string | null): string {
  const m = consultationModality(typeId);
  if (m === 'video') return 'تصویر + متن + صوت';
  if (m === 'audio') return 'صوت + متن';
  return 'فقط متن';
}
