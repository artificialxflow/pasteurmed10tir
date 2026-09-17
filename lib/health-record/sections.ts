export const HEALTH_SECTIONS = [
  { id: 'vitals', label: 'حیاتی / قند / نوار', emoji: '❤️' },
  { id: 'general', label: 'عمومی', emoji: '🩺' },
  { id: 'dental', label: 'دندان', emoji: '🦷' },
  { id: 'internal', label: 'داخلی', emoji: '🫁' },
  { id: 'labs', label: 'آزمایش', emoji: '🧪' },
  { id: 'neuro', label: 'مغز و اعصاب', emoji: '🧠' },
  { id: 'psych', label: 'روان', emoji: '🧘' },
  { id: 'ent', label: 'گوش و حلق و بینی', emoji: '👂' },
  { id: 'infect', label: 'عفونی', emoji: '🦠' },
  { id: 'derm', label: 'پوست', emoji: '🧴' },
  { id: 'renal', label: 'کلیه', emoji: '💧' },
  { id: 'rheum', label: 'روماتولوژی', emoji: '🦴' },
  { id: 'endo', label: 'دیابت / غدد', emoji: '💉' },
  { id: 'cardio', label: 'قلب', emoji: '💓' },
  { id: 'pulm', label: 'ریه', emoji: '🌬️' },
  { id: 'imaging', label: 'سونو / مامو / راد', emoji: '📷' },
  { id: 'endo_proc', label: 'آندوسکوپی / کولون', emoji: '🔬' },
  { id: 'other', label: 'سایر', emoji: '📋' },
] as const;

export type HealthSectionId = (typeof HEALTH_SECTIONS)[number]['id'];

export const MVP_SECTION_IDS = new Set<string>(HEALTH_SECTIONS.map((s) => s.id));

export function isKnownSection(id: string): id is HealthSectionId {
  return HEALTH_SECTIONS.some((s) => s.id === id);
}

export type HealthFieldKind = 'text' | 'number' | 'textarea';

export type HealthSectionField = {
  key: string;
  label: string;
  kind: HealthFieldKind;
};

const CLINIC_FIELDS: HealthSectionField[] = [
  { key: 'complaint', label: 'شرح حال / شکایت', kind: 'textarea' },
  { key: 'diagnosis', label: 'تشخیص', kind: 'text' },
  { key: 'medications', label: 'دارو', kind: 'textarea' },
  { key: 'notes', label: 'یادداشت', kind: 'text' },
];

const FIELDS_BY_SECTION: Record<HealthSectionId, HealthSectionField[]> = {
  vitals: [
    { key: 'bpSystolic', label: 'فشار سیستول', kind: 'number' },
    { key: 'bpDiastolic', label: 'دیاستول', kind: 'number' },
    { key: 'hr', label: 'ضربان', kind: 'number' },
    { key: 'glucose', label: 'قند', kind: 'number' },
    { key: 'notes', label: 'یادداشت', kind: 'text' },
  ],
  general: CLINIC_FIELDS,
  dental: [
    { key: 'note', label: 'یادداشت دندانپزشکی', kind: 'textarea' },
    { key: 'notes', label: 'یادداشت اضافی', kind: 'text' },
  ],
  internal: CLINIC_FIELDS,
  labs: [
    { key: 'fbs', label: 'FBS', kind: 'number' },
    { key: 'hba1c', label: 'HbA1c', kind: 'number' },
    { key: 'otherLabs', label: 'سایر آزمایش‌ها', kind: 'textarea' },
    { key: 'notes', label: 'یادداشت', kind: 'text' },
  ],
  neuro: CLINIC_FIELDS,
  psych: CLINIC_FIELDS,
  ent: CLINIC_FIELDS,
  infect: CLINIC_FIELDS,
  derm: CLINIC_FIELDS,
  renal: CLINIC_FIELDS,
  rheum: CLINIC_FIELDS,
  endo: CLINIC_FIELDS,
  cardio: CLINIC_FIELDS,
  pulm: CLINIC_FIELDS,
  imaging: [
    { key: 'imagingType', label: 'نوع تصویربرداری', kind: 'text' },
    { key: 'report', label: 'گزارش', kind: 'textarea' },
    { key: 'notes', label: 'یادداشت', kind: 'text' },
  ],
  endo_proc: [
    { key: 'procedureType', label: 'نوع اقدام', kind: 'text' },
    { key: 'report', label: 'گزارش', kind: 'textarea' },
    { key: 'notes', label: 'یادداشت', kind: 'text' },
  ],
  other: [
    { key: 'title', label: 'عنوان', kind: 'text' },
    { key: 'notes', label: 'شرح', kind: 'textarea' },
  ],
};

export function fieldsForSection(id: HealthSectionId): HealthSectionField[] {
  return FIELDS_BY_SECTION[id];
}

export function sectionAllowsUpload(id: HealthSectionId): boolean {
  return id !== 'general';
}
