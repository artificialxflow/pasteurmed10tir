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
 * مختصات برای body-anatomy.jpg (نمای روبرو) با object-contain تنظیم شده.
 */
export const HEALTH_BODY_HOTSPOTS: BodyHotspot[] = [
  // لایه‌های پهن
  { id: 'lung', sectionId: 'pulm', label: 'ریه', left: 26, top: 30, width: 48, height: 13 },
  { id: 'stomach', sectionId: 'internal', label: 'داخلی', left: 35, top: 47, width: 30, height: 10 },
  { id: 'bone-l', sectionId: 'ortho', label: 'ارتوپدی', left: 37, top: 57, width: 13, height: 17 },
  { id: 'bone-r', sectionId: 'ortho', label: 'ارتوپدی', left: 50, top: 57, width: 13, height: 17 },
  { id: 'hand-l', sectionId: 'derm', label: 'پوست', left: 4, top: 47, width: 16, height: 13 },
  { id: 'hand-r', sectionId: 'derm', label: 'پوست', left: 80, top: 47, width: 16, height: 13 },
  { id: 'knee-l', sectionId: 'rheum', label: 'روماتولوژی', left: 35, top: 69, width: 14, height: 11 },
  { id: 'knee-r', sectionId: 'rheum', label: 'روماتولوژی', left: 51, top: 69, width: 14, height: 11 },
  { id: 'throat', sectionId: 'infect', label: 'عفونی', left: 41, top: 28, width: 18, height: 6 },
  { id: 'kidney-l', sectionId: 'renal', label: 'کلیه / اورولوژی', left: 33, top: 42, width: 13, height: 8 },
  { id: 'kidney-r', sectionId: 'renal', label: 'کلیه / اورولوژی', left: 54, top: 42, width: 13, height: 8 },
  { id: 'liver', sectionId: 'endo', label: 'دیابت / غدد', left: 26, top: 43, width: 15, height: 9 },
  // اعضای دقیق (بالاترین z-index)
  { id: 'heart', sectionId: 'cardio', label: 'قلب', left: 43, top: 33, width: 14, height: 10 },
  { id: 'brain', sectionId: 'neuro', label: 'مغز و اعصاب', left: 39, top: 6, width: 22, height: 9 },
  { id: 'psych', sectionId: 'psych', label: 'روان', left: 37, top: 12, width: 26, height: 7 },
  { id: 'eye', sectionId: 'ophthalm', label: 'چشم‌پزشکی', left: 35, top: 16, width: 30, height: 5 },
  { id: 'ent-l', sectionId: 'ent', label: 'گوش و حلق و بینی', left: 26, top: 18, width: 11, height: 9 },
  { id: 'ent-r', sectionId: 'ent', label: 'گوش و حلق و بینی', left: 63, top: 18, width: 11, height: 9 },
  { id: 'mouth', sectionId: 'dental', label: 'دندان', left: 41, top: 23, width: 18, height: 6 },
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

/** ستون راست — تخصص‌های بالایی (RTL: سمت چپ صفحه) */
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
];

/** ردیف افقی زیر تصویر بدن */
export const HEALTH_BODY_PANEL_BOTTOM: HealthSectionId[] = [
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
