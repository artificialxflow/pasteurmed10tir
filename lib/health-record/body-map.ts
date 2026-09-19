import { HEALTH_SECTIONS, type HealthSectionId } from '@/lib/health-record/sections';

export type BodyHotspot = {
  id: string;
  sectionId: HealthSectionId;
  label: string;
  /** درصد نسبت به ابعاد طبیعی تصویر body-anatomy.jpg */
  left: number;
  top: number;
  width: number;
  height: number;
};

/** ابعاد واقعی فایل JPG — برای object-contain */
export const HEALTH_BODY_IMAGE_SIZE = { width: 853, height: 1280 };

/**
 * Hotspotها — درصد نسبت به تصویر ۸۵۳×۱۲۸۰ (نمای روبرو).
 * ترتیب: نواحی بزرگ اول، اعضای دقیق آخر.
 */
export const HEALTH_BODY_HOTSPOTS: BodyHotspot[] = [
  { id: 'lung', sectionId: 'pulm', label: 'ریه', left: 27, top: 25, width: 46, height: 12 },
  { id: 'stomach', sectionId: 'internal', label: 'داخلی', left: 36, top: 43, width: 28, height: 9 },
  { id: 'bone-l', sectionId: 'ortho', label: 'ارتوپدی', left: 37, top: 56, width: 13, height: 15 },
  { id: 'bone-r', sectionId: 'ortho', label: 'ارتوپدی', left: 50, top: 56, width: 13, height: 15 },
  { id: 'hand-l', sectionId: 'derm', label: 'پوست', left: 7, top: 41, width: 15, height: 11 },
  { id: 'hand-r', sectionId: 'derm', label: 'پوست', left: 78, top: 41, width: 15, height: 11 },
  { id: 'knee-l', sectionId: 'rheum', label: 'روماتولوژی', left: 35, top: 70, width: 13, height: 10 },
  { id: 'knee-r', sectionId: 'rheum', label: 'روماتولوژی', left: 52, top: 70, width: 13, height: 10 },
  { id: 'throat', sectionId: 'infect', label: 'عفونی', left: 41, top: 23, width: 18, height: 5 },
  { id: 'kidney-l', sectionId: 'renal', label: 'کلیه / اورولوژی', left: 33, top: 37, width: 13, height: 7 },
  { id: 'kidney-r', sectionId: 'renal', label: 'کلیه / اورولوژی', left: 54, top: 37, width: 13, height: 7 },
  { id: 'liver', sectionId: 'endo', label: 'دیابت / غدد', left: 25, top: 38, width: 14, height: 8 },
  { id: 'heart', sectionId: 'cardio', label: 'قلب', left: 43, top: 29, width: 14, height: 9 },
  { id: 'brain', sectionId: 'neuro', label: 'مغز و اعصاب', left: 38, top: 6, width: 24, height: 9 },
  { id: 'psych', sectionId: 'psych', label: 'روان', left: 36, top: 10, width: 28, height: 7 },
  { id: 'eye', sectionId: 'ophthalm', label: 'چشم‌پزشکی', left: 34, top: 14, width: 32, height: 4 },
  { id: 'ent-l', sectionId: 'ent', label: 'گوش و حلق و بینی', left: 24, top: 15, width: 11, height: 8 },
  { id: 'ent-r', sectionId: 'ent', label: 'گوش و حلق و بینی', left: 65, top: 15, width: 11, height: 8 },
  { id: 'mouth', sectionId: 'dental', label: 'دندان', left: 40, top: 19, width: 20, height: 5 },
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

export type ImageRenderRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** مستطیل واقعی تصویر داخل باکس با object-contain */
export function computeObjectContainRect(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number,
): ImageRenderRect {
  if (containerW <= 0 || containerH <= 0 || imageW <= 0 || imageH <= 0) {
    return { left: 0, top: 0, width: containerW, height: containerH };
  }
  const containerAspect = containerW / containerH;
  const imageAspect = imageW / imageH;
  if (imageAspect > containerAspect) {
    const width = containerW;
    const height = containerW / imageAspect;
    return { left: 0, top: (containerH - height) / 2, width, height };
  }
  const height = containerH;
  const width = containerH * imageAspect;
  return { left: (containerW - width) / 2, top: 0, width, height };
}

export function sectionMeta(id: HealthSectionId) {
  return HEALTH_SECTIONS.find((s) => s.id === id);
}

export function sectionLabel(id: HealthSectionId): string {
  return sectionMeta(id)?.label || id;
}

export function renalDisplayLabel(): string {
  return 'کلیه / اورولوژی';
}

/** تبدیل hotspot (درصد تصویر) به درصد باکس — با object-contain */
export function hotspotStyle(
  spot: BodyHotspot,
  containerW?: number,
  containerH?: number,
  imageW = HEALTH_BODY_IMAGE_SIZE.width,
  imageH = HEALTH_BODY_IMAGE_SIZE.height,
): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  if (!containerW || !containerH) {
    return hotspotStyleFallback(spot);
  }
  const rect = computeObjectContainRect(containerW, containerH, imageW, imageH);
  const leftPx = rect.left + (spot.left / 100) * rect.width;
  const topPx = rect.top + (spot.top / 100) * rect.height;
  const widthPx = (spot.width / 100) * rect.width;
  const heightPx = (spot.height / 100) * rect.height;
  return {
    left: `${(leftPx / containerW) * 100}%`,
    top: `${(topPx / containerH) * 100}%`,
    width: `${(widthPx / containerW) * 100}%`,
    height: `${(heightPx / containerH) * 100}%`,
  };
}

/** fallback قبل از اندازه‌گیری باکس */
function hotspotStyleFallback(spot: BodyHotspot) {
  const imageAspect = HEALTH_BODY_IMAGE_SIZE.width / HEALTH_BODY_IMAGE_SIZE.height;
  const containerAspect = 3 / 5;
  let offsetTop = 0;
  let scaleH = 1;
  if (imageAspect > containerAspect) {
    const renderedH = containerAspect / imageAspect;
    offsetTop = (1 - renderedH) / 2;
    scaleH = renderedH;
  }
  const top = offsetTop + (spot.top / 100) * scaleH;
  const height = (spot.height / 100) * scaleH;
  return {
    left: `${spot.left}%`,
    top: `${top * 100}%`,
    width: `${spot.width}%`,
    height: `${height * 100}%`,
  };
}
