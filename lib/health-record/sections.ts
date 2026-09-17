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

export type HealthFieldKind = 'text' | 'number' | 'textarea' | 'date';

export type HealthSectionField = {
  key: string;
  label: string;
  kind: HealthFieldKind;
  hint?: string;
};

const VITALS_EXTRA: HealthSectionField[] = [
  { key: 'age', label: 'سن', kind: 'number' },
  { key: 'height', label: 'قد', kind: 'text' },
  { key: 'weight', label: 'وزن', kind: 'text' },
];

const GENERAL_FIELDS: HealthSectionField[] = [
  { key: 'doctorName', label: 'نام پزشک / ثبت‌کننده', kind: 'text' },
  ...VITALS_EXTRA,
  { key: 'diseaseHistory', label: 'سوابق بیماری', kind: 'textarea' },
  { key: 'medications', label: 'داروهای مصرفی', kind: 'textarea' },
  { key: 'surgeries', label: 'عمل‌های جراحی انجام‌شده', kind: 'textarea' },
  { key: 'complaint', label: 'شکایت اصلی', kind: 'textarea' },
  { key: 'diagnosis', label: 'تشخیص', kind: 'textarea' },
  { key: 'recommendations', label: 'توصیه‌ها', kind: 'textarea' },
  { key: 'care', label: 'مراقبت‌ها', kind: 'textarea' },
];

const DENTAL_FIELDS: HealthSectionField[] = [
  { key: 'doctorName', label: 'نام دندانپزشک', kind: 'text' },
  { key: 'needRestore', label: 'دندان‌های نیازمند ترمیم', kind: 'textarea', hint: 'متنی' },
  { key: 'needExtract', label: 'دندان‌های نیازمند کشیدن', kind: 'textarea' },
  { key: 'needSurgery', label: 'دندان‌های نیازمند جراحی', kind: 'textarea' },
  { key: 'needRootCanal', label: 'دندان‌های نیازمند عصب‌کشی', kind: 'textarea' },
  { key: 'needImplant', label: 'دندان‌های نیازمند ایمپلنت', kind: 'textarea' },
  { key: 'servicesDone', label: 'خدمات انجام‌شده', kind: 'textarea' },
];

const SPECIALIST_FIELDS: HealthSectionField[] = [
  { key: 'doctorName', label: 'نام پزشک', kind: 'text' },
  ...VITALS_EXTRA,
  { key: 'diagnosis', label: 'تشخیص', kind: 'textarea' },
  { key: 'labTrackingCode', label: 'آزمایشات درخواستی (کد رهگیری)', kind: 'text' },
  {
    key: 'medications',
    label: 'داروها',
    kind: 'textarea',
    hint: 'فارسی؛ دوز و ساعت مصرف',
  },
  { key: 'nextVisitDate', label: 'زمان ویزیت بعدی', kind: 'date' },
  { key: 'recommendations', label: 'توصیه‌ها', kind: 'textarea' },
  { key: 'care', label: 'مراقبت‌ها', kind: 'textarea' },
  { key: 'otherNotes', label: 'سایر موارد', kind: 'textarea' },
];

/** فقط تاریخ + پیوست (گزارش آزمایش / سونو / آندوسکوپی) */
const ATTACHMENT_ONLY_FIELDS: HealthSectionField[] = [];

const FIELDS_BY_SECTION: Record<HealthSectionId, HealthSectionField[]> = {
  vitals: [
    { key: 'doctorName', label: 'نام ثبت‌کننده', kind: 'text' },
    { key: 'bpSystolic', label: 'فشار سیستول', kind: 'number' },
    { key: 'bpDiastolic', label: 'دیاستول', kind: 'number' },
    { key: 'hr', label: 'ضربان', kind: 'number' },
    { key: 'glucose', label: 'قند', kind: 'number' },
    { key: 'notes', label: 'یادداشت / نوار', kind: 'textarea' },
  ],
  general: GENERAL_FIELDS,
  dental: DENTAL_FIELDS,
  internal: SPECIALIST_FIELDS,
  labs: ATTACHMENT_ONLY_FIELDS,
  neuro: SPECIALIST_FIELDS,
  psych: SPECIALIST_FIELDS,
  ent: SPECIALIST_FIELDS,
  infect: SPECIALIST_FIELDS,
  derm: SPECIALIST_FIELDS,
  renal: SPECIALIST_FIELDS,
  rheum: SPECIALIST_FIELDS,
  endo: SPECIALIST_FIELDS,
  cardio: SPECIALIST_FIELDS,
  pulm: SPECIALIST_FIELDS,
  imaging: ATTACHMENT_ONLY_FIELDS,
  endo_proc: ATTACHMENT_ONLY_FIELDS,
  other: SPECIALIST_FIELDS,
};

export const HEALTH_RECORD_ATTACHMENT_SECTIONS = new Set<HealthSectionId>([
  'labs',
  'imaging',
  'endo_proc',
]);

export const HEALTH_RECORD_FILE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp,.pdf,application/pdf';

export function sectionIsAttachmentOnly(id: HealthSectionId): boolean {
  return HEALTH_RECORD_ATTACHMENT_SECTIONS.has(id);
}

export function fieldsForSection(id: HealthSectionId): HealthSectionField[] {
  return FIELDS_BY_SECTION[id];
}

export function fieldLabel(id: HealthSectionId, key: string): string {
  return fieldsForSection(id).find((f) => f.key === key)?.label || key;
}

export function payloadDisplayRows(
  section: string,
  payload: Record<string, unknown> | null | undefined,
): Array<{ label: string; value: string }> {
  if (!payload) return [];
  const id = isKnownSection(section) ? section : null;
  return Object.entries(payload)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(([key, v]) => ({
      label: id ? fieldLabel(id, key) : key,
      value: String(v),
    }));
}

export function sectionAllowsUpload(id: HealthSectionId): boolean {
  return true;
}

export function sectionUploadHint(id: HealthSectionId): string {
  if (sectionIsAttachmentOnly(id)) return 'افزودن یا جایگزینی گزارش (jpg، png، pdf)';
  if (id === 'dental') return 'عکس کلی دندان و عکس‌های اضافی';
  if (id === 'vitals') return 'پیوست نوار / مدرک';
  return 'پیوست مدرک در صورت نیاز';
}

export function sectionCreateHint(id: HealthSectionId): string {
  if (id === 'labs') return 'تاریخ انجام آزمایش را انتخاب کنید و فایل گزارش (عکس یا PDF) را بارگذاری کنید.';
  if (id === 'imaging') return 'تاریخ سونوگرافی، ماموگرافی یا رادیولوژی — فقط تاریخ و فایل گزارش.';
  if (id === 'endo_proc') return 'تاریخ آندوسکوپی یا کولونوسکوپی — فقط تاریخ و فایل گزارش.';
  return '';
}
