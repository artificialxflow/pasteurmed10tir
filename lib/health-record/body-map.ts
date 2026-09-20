import { HEALTH_SECTIONS, type HealthSectionId } from '@/lib/health-record/sections';

export type BodyHotspot = {
  id: string;
  sectionId: HealthSectionId;
  label: string;
  /** درصد نسبت به ناحیه بدن (HEALTH_BODY_CONTENT_BOUNDS) — نه کل فریم JPG */
  left: number;
  top: number;
  width: number;
  height: number;
};

/** ابعاد واقعی فایل JPG */
export const HEALTH_BODY_IMAGE_SIZE = { width: 853, height: 1280 };

/**
 * محدوده واقعی بدن داخل JPG (بدون پدینگ آبی).
 * hotspotها نسبت به این مستطیل تعریف می‌شوند: ۰=بالای سر، ۱۰۰=پا.
 */
export const HEALTH_BODY_CONTENT_BOUNDS = {
  left: 15,
  top: 1,
  right: 15,
  bottom: 3,
};

/**
 * Hotspotها — درصد نسبت به HEALTH_BODY_CONTENT_BOUNDS.
 * کaliبره با لنگر دندان (top: 11) + آناتومی body-anatomy.jpg
 * ترتیب: نواحی بزرگ اول، اعضای دقیق آخر.
 */
export const HEALTH_BODY_HOTSPOTS: BodyHotspot[] = [
  { id: 'lung', sectionId: 'pulm', label: 'ریه', left: 18, top: 20, width: 64, height: 12 },
  { id: 'stomach', sectionId: 'internal', label: 'داخلی', left: 28, top: 34, width: 44, height: 16 },
  { id: 'bone-l', sectionId: 'ortho', label: 'ارتوپدی', left: 34, top: 52, width: 16, height: 18 },
  { id: 'bone-r', sectionId: 'ortho', label: 'ارتوپدی', left: 50, top: 52, width: 16, height: 18 },
  { id: 'hand-l', sectionId: 'derm', label: 'پوست', left: 0, top: 48, width: 18, height: 14 },
  { id: 'hand-r', sectionId: 'derm', label: 'پوست', left: 82, top: 48, width: 18, height: 14 },
  { id: 'knee-l', sectionId: 'rheum', label: 'روماتولوژی', left: 33, top: 68, width: 15, height: 10 },
  { id: 'knee-r', sectionId: 'rheum', label: 'روماتولوژی', left: 52, top: 68, width: 15, height: 10 },
  { id: 'throat', sectionId: 'infect', label: 'عفونی', left: 38, top: 17, width: 24, height: 4 },
  { id: 'kidney-l', sectionId: 'renal', label: 'کلیه / اورولوژی', left: 28, top: 37, width: 15, height: 7 },
  { id: 'kidney-r', sectionId: 'renal', label: 'کلیه / اورولوژی', left: 57, top: 37, width: 15, height: 7 },
  { id: 'liver', sectionId: 'endo', label: 'دیابت / غدد', left: 22, top: 32, width: 28, height: 14 },
  { id: 'heart', sectionId: 'cardio', label: 'قلب', left: 40, top: 25, width: 20, height: 8 },
  { id: 'brain', sectionId: 'neuro', label: 'مغز و اعصاب', left: 36, top: 0, width: 28, height: 7 },
  { id: 'psych', sectionId: 'psych', label: 'روان', left: 32, top: 0, width: 36, height: 10 },
  { id: 'eye', sectionId: 'ophthalm', label: 'چشم‌پزشکی', left: 30, top: 5, width: 40, height: 3 },
  { id: 'ent-face', sectionId: 'ent', label: 'گوش و حلق و بینی', left: 26, top: 7, width: 48, height: 14 },
  { id: 'mouth', sectionId: 'dental', label: 'دندان', left: 38, top: 11, width: 24, height: 3 },
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

/** تبدیل درصد ناحیه بدن → درصد کل تصویر JPG */
export function spotToImagePercent(spot: Pick<BodyHotspot, 'left' | 'top' | 'width' | 'height'>) {
  const b = HEALTH_BODY_CONTENT_BOUNDS;
  const usableW = 100 - b.left - b.right;
  const usableH = 100 - b.top - b.bottom;
  return {
    left: b.left + (spot.left / 100) * usableW,
    top: b.top + (spot.top / 100) * usableH,
    width: (spot.width / 100) * usableW,
    height: (spot.height / 100) * usableH,
  };
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

/** تبدیل hotspot به درصد باکس — content bounds + object-contain */
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
  const img = spotToImagePercent(spot);
  if (!containerW || !containerH) {
    return hotspotStyleFallback(img);
  }
  const rect = computeObjectContainRect(containerW, containerH, imageW, imageH);
  const leftPx = rect.left + (img.left / 100) * rect.width;
  const topPx = rect.top + (img.top / 100) * rect.height;
  const widthPx = (img.width / 100) * rect.width;
  const heightPx = (img.height / 100) * rect.height;
  return {
    left: `${(leftPx / containerW) * 100}%`,
    top: `${(topPx / containerH) * 100}%`,
    width: `${(widthPx / containerW) * 100}%`,
    height: `${(heightPx / containerH) * 100}%`,
  };
}

function hotspotStyleFallback(img: ReturnType<typeof spotToImagePercent>) {
  const imageAspect = HEALTH_BODY_IMAGE_SIZE.width / HEALTH_BODY_IMAGE_SIZE.height;
  const containerAspect = 3 / 5;
  let offsetTop = 0;
  let scaleH = 1;
  if (imageAspect > containerAspect) {
    const renderedH = containerAspect / imageAspect;
    offsetTop = (1 - renderedH) / 2;
    scaleH = renderedH;
  }
  const top = offsetTop + (img.top / 100) * scaleH;
  const height = (img.height / 100) * scaleH;
  return {
    left: `${img.left}%`,
    top: `${top * 100}%`,
    width: `${img.width}%`,
    height: `${height * 100}%`,
  };
}
