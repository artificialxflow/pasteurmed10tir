import { HEALTH_SECTIONS, type HealthSectionId } from '@/lib/health-record/sections';

export type BodyHotspot = {
  id: string;
  sectionId: HealthSectionId;
  label: string;
  /** درصد نسبت به ناحیه تصویر بدن (بعد از letterbox داخلی) */
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * Hotspotهای نامرئی — ترتیب مهم است: نواحی بزرگ اول، اعضای دقیق آخر (روی هم).
 * مختصات برای body-anatomy.jpg با object-contain و inset ~8% تنظیم شده.
 */
export const HEALTH_BODY_HOTSPOTS: BodyHotspot[] = [
  // لایه‌های پهن (پایین‌ترین z-index)
  { id: 'skin-l', sectionId: 'derm', label: 'پوست', left: 8, top: 34, width: 14, height: 28 },
  { id: 'skin-r', sectionId: 'derm', label: 'پوست', left: 78, top: 34, width: 14, height: 28 },
  { id: 'vitals', sectionId: 'vitals', label: 'حیاتی / قند / نوار', left: 36, top: 32, width: 28, height: 10 },
  { id: 'lung', sectionId: 'pulm', label: 'ریه', left: 30, top: 31, width: 40, height: 14 },
  { id: 'infect', sectionId: 'infect', label: 'عفونی', left: 34, top: 40, width: 32, height: 14 },
  // اعضای دقیق (بالاترین z-index)
  { id: 'brain', sectionId: 'neuro', label: 'مغز و اعصاب', left: 42, top: 9, width: 16, height: 11 },
  { id: 'psych', sectionId: 'psych', label: 'روان', left: 38, top: 7, width: 24, height: 9 },
  { id: 'eye', sectionId: 'ophthalm', label: 'چشم‌پزشکی', left: 38, top: 16, width: 24, height: 5 },
  { id: 'nose', sectionId: 'ent', label: 'گوش و حلق و بینی', left: 44, top: 20, width: 12, height: 7 },
  { id: 'mouth', sectionId: 'dental', label: 'دندان', left: 43, top: 25, width: 14, height: 6 },
  { id: 'heart', sectionId: 'cardio', label: 'قلب', left: 45, top: 35, width: 11, height: 9 },
  { id: 'liver', sectionId: 'endo', label: 'دیابت / غدد', left: 53, top: 41, width: 13, height: 8 },
  { id: 'stomach', sectionId: 'internal', label: 'داخلی', left: 39, top: 46, width: 22, height: 9 },
  { id: 'kidney-l', sectionId: 'renal', label: 'کلیه / اورولوژی', left: 35, top: 45, width: 11, height: 7 },
  { id: 'kidney-r', sectionId: 'renal', label: 'کلیه / اورولوژی', left: 54, top: 45, width: 11, height: 7 },
  { id: 'joint-l', sectionId: 'rheum', label: 'روماتولوژی', left: 10, top: 33, width: 12, height: 14 },
  { id: 'joint-r', sectionId: 'rheum', label: 'روماتولوژی', left: 78, top: 33, width: 12, height: 14 },
  { id: 'bone', sectionId: 'ortho', label: 'ارتوپدی', left: 34, top: 66, width: 32, height: 24 },
];

/** inset تصویر داخل باکس (درصد) — برای هم‌ترازی hotspot */
export const HEALTH_BODY_IMAGE_INSET = {
  top: 8,
  right: 12,
  bottom: 6,
  left: 12,
};

/** ستون چپ — گزینه‌های پرونده (RTL: سمت راست صفحه) */
export const HEALTH_BODY_PANEL_LEFT: HealthSectionId[] = [
  'vitals',
  'general',
  'labs',
  'imaging',
  'endo_proc',
  'other',
];

/** ستون راست — تخصص‌ها (RTL: سمت چپ صفحه) */
export const HEALTH_BODY_PANEL_RIGHT: HealthSectionId[] = [
  'dental',
  'neuro',
  'cardio',
  'renal',
  'ophthalm',
  'ent',
  'internal',
  'endo',
  'pulm',
  'ortho',
  'rheum',
  'derm',
  'psych',
  'infect',
];

export const HEALTH_BODY_IMAGE = '/images/health-record/body-anatomy.jpg';

export function sectionMeta(id: HealthSectionId) {
  return HEALTH_SECTIONS.find((s) => s.id === id);
}

export function sectionLabel(id: HealthSectionId): string {
  return sectionMeta(id)?.label || id;
}

export function renalDisplayLabel(): string {
  return 'کلیه / اورولوژی';
}

/** تبدیل hotspot به موقعیت واقعی داخل باکس با لحاظ inset */
export function hotspotStyle(spot: BodyHotspot): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  const { top, right, bottom, left } = HEALTH_BODY_IMAGE_INSET;
  const usableW = 100 - left - right;
  const usableH = 100 - top - bottom;
  return {
    left: `${left + (spot.left / 100) * usableW}%`,
    top: `${top + (spot.top / 100) * usableH}%`,
    width: `${(spot.width / 100) * usableW}%`,
    height: `${(spot.height / 100) * usableH}%`,
  };
}
