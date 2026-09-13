export const HEALTH_SECTIONS = [
  { id: 'vitals', label: 'حیاتی / قند / نوار', emoji: '❤️', mvp: true },
  { id: 'general', label: 'عمومی', emoji: '🩺', mvp: true },
  { id: 'dental', label: 'دندان', emoji: '🦷', mvp: true },
  { id: 'internal', label: 'داخلی', emoji: '🫁', mvp: false },
  { id: 'labs', label: 'آزمایش', emoji: '🧪', mvp: false },
  { id: 'neuro', label: 'مغز و اعصاب', emoji: '🧠', mvp: false },
  { id: 'psych', label: 'روان', emoji: '🧘', mvp: false },
  { id: 'ent', label: 'گوش و حلق و بینی', emoji: '👂', mvp: false },
  { id: 'infect', label: 'عفونی', emoji: '🦠', mvp: false },
  { id: 'derm', label: 'پوست', emoji: '🧴', mvp: false },
  { id: 'renal', label: 'کلیه', emoji: '💧', mvp: false },
  { id: 'rheum', label: 'روماتولوژی', emoji: '🦴', mvp: false },
  { id: 'endo', label: 'دیابت / غدد', emoji: '💉', mvp: false },
  { id: 'cardio', label: 'قلب', emoji: '💓', mvp: false },
  { id: 'pulm', label: 'ریه', emoji: '🌬️', mvp: false },
  { id: 'imaging', label: 'سونو / مامو / راد', emoji: '📷', mvp: false },
  { id: 'endo_proc', label: 'آندوسکوپی / کولون', emoji: '🔬', mvp: false },
  { id: 'other', label: 'سایر', emoji: '📋', mvp: false },
] as const;

export type HealthSectionId = (typeof HEALTH_SECTIONS)[number]['id'];

export const MVP_SECTION_IDS = new Set<string>(
  HEALTH_SECTIONS.filter((s) => s.mvp).map((s) => s.id),
);

export function isKnownSection(id: string): id is HealthSectionId {
  return HEALTH_SECTIONS.some((s) => s.id === id);
}
