import { HEALTH_SECTIONS, type HealthSectionId } from '@/lib/health-record/sections';

export type BodyHotspot = {
  id: string;
  sectionId: HealthSectionId;
  label: string;
  /** درصد نسبت به ناحیه تصویر بدن */
  left: number;
  top: number;
  width: number;
  height: number;
};

/** ناحیه‌های نامرئی روی بدن — فقط hit area */
export const HEALTH_BODY_HOTSPOTS: BodyHotspot[] = [
  { id: 'brain', sectionId: 'neuro', label: 'مغز و اعصاب', left: 40, top: 3, width: 20, height: 13 },
  { id: 'psych', sectionId: 'psych', label: 'روان', left: 34, top: 6, width: 32, height: 10 },
  { id: 'eye', sectionId: 'ophthalm', label: 'چشم‌پزشکی', left: 36, top: 14, width: 28, height: 6 },
  { id: 'nose', sectionId: 'ent', label: 'گوش و حلق و بینی', left: 43, top: 19, width: 14, height: 8 },
  { id: 'mouth', sectionId: 'dental', label: 'دندان', left: 40, top: 24, width: 20, height: 6 },
  { id: 'vitals', sectionId: 'vitals', label: 'حیاتی / قند / نوار', left: 38, top: 30, width: 24, height: 8 },
  { id: 'heart', sectionId: 'cardio', label: 'قلب', left: 44, top: 33, width: 12, height: 10 },
  { id: 'lung', sectionId: 'pulm', label: 'ریه', left: 32, top: 31, width: 36, height: 14 },
  { id: 'liver', sectionId: 'endo', label: 'دیابت / غدد', left: 52, top: 40, width: 16, height: 10 },
  { id: 'stomach', sectionId: 'internal', label: 'داخلی', left: 38, top: 42, width: 24, height: 10 },
  { id: 'kidney-l', sectionId: 'renal', label: 'کلیه / اورولوژی', left: 34, top: 44, width: 12, height: 8 },
  { id: 'kidney-r', sectionId: 'renal', label: 'کلیه / اورولوژی', left: 54, top: 44, width: 12, height: 8 },
  { id: 'skin', sectionId: 'derm', label: 'پوست', left: 22, top: 28, width: 56, height: 42 },
  { id: 'joint', sectionId: 'rheum', label: 'روماتولوژی', left: 12, top: 36, width: 16, height: 18 },
  { id: 'bone', sectionId: 'ortho', label: 'ارتوپدی', left: 34, top: 62, width: 32, height: 30 },
  { id: 'infect', sectionId: 'infect', label: 'عفونی', left: 36, top: 38, width: 28, height: 16 },
];

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
