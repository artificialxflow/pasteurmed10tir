import { HEALTH_SECTIONS, type HealthSectionId } from '@/lib/health-record/sections';

export type BodyMapRegion = {
  id: string;
  sectionId: HealthSectionId;
  label: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
};

/** Hotspotهای نقشه بدن — مختصات در viewBox 240×420 */
export const HEALTH_BODY_MAP_REGIONS: BodyMapRegion[] = [
  { id: 'neuro', sectionId: 'neuro', label: 'مغز و اعصاب', x: 120, y: 42, labelX: 168, labelY: 38 },
  { id: 'ophthalm', sectionId: 'ophthalm', label: 'چشم‌پزشکی', x: 108, y: 58, labelX: 12, labelY: 52 },
  { id: 'ent', sectionId: 'ent', label: 'گوش و حلق', x: 148, y: 62, labelX: 168, labelY: 58 },
  { id: 'psych', sectionId: 'psych', label: 'روان', x: 92, y: 48, labelX: 12, labelY: 42 },
  { id: 'dental', sectionId: 'dental', label: 'دندان', x: 120, y: 72, labelX: 168, labelY: 72 },
  { id: 'vitals', sectionId: 'vitals', label: 'حیاتی / نوار', x: 120, y: 118, labelX: 12, labelY: 112 },
  { id: 'cardio', sectionId: 'cardio', label: 'قلب', x: 108, y: 132, labelX: 168, labelY: 128 },
  { id: 'pulm', sectionId: 'pulm', label: 'ریه', x: 138, y: 128, labelX: 168, labelY: 148 },
  { id: 'internal', sectionId: 'internal', label: 'داخلی', x: 120, y: 168, labelX: 12, labelY: 162 },
  { id: 'endo', sectionId: 'endo', label: 'دیابت / غدد', x: 120, y: 198, labelX: 168, labelY: 192 },
  { id: 'renal', sectionId: 'renal', label: 'کلیه', x: 92, y: 188, labelX: 12, labelY: 188 },
  { id: 'rheum', sectionId: 'rheum', label: 'روماتولوژی', x: 58, y: 148, labelX: 12, labelY: 132 },
  { id: 'ortho', sectionId: 'ortho', label: 'ارتوپدی', x: 168, y: 280, labelX: 168, labelY: 272 },
  { id: 'derm', sectionId: 'derm', label: 'پوست', x: 182, y: 168, labelX: 168, labelY: 212 },
];

const bodyMapSectionIds = new Set(HEALTH_BODY_MAP_REGIONS.map((r) => r.sectionId));

/** بخش‌هایی که فقط از گرید پایین انتخاب می‌شوند */
export const HEALTH_GRID_ONLY_SECTIONS = HEALTH_SECTIONS.filter((s) => !bodyMapSectionIds.has(s.id));

export function sectionLabel(id: HealthSectionId): string {
  return HEALTH_SECTIONS.find((s) => s.id === id)?.label || id;
}
