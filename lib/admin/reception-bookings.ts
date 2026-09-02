export type ReceptionCategory =
  | 'all'
  | 'dental'
  | 'laser'
  | 'medical'
  | 'nursing'
  | 'consultation';

export type ReceptionTimeOfDay = 'all' | 'morning' | 'afternoon' | 'evening';

export const RECEPTION_CATEGORY_TABS: Array<{ id: ReceptionCategory; label: string }> = [
  { id: 'all', label: 'همه' },
  { id: 'dental', label: 'دندانپزشکی' },
  { id: 'laser', label: 'لیزر و زیبایی' },
  { id: 'medical', label: 'پزشکی' },
  { id: 'nursing', label: 'پرستاری' },
  { id: 'consultation', label: 'مشاوره تغذیه / روانشناسی / مامایی' },
];

export const RECEPTION_TIME_TABS: Array<{ id: ReceptionTimeOfDay; label: string }> = [
  { id: 'all', label: 'همه ساعات' },
  { id: 'morning', label: 'صبح' },
  { id: 'afternoon', label: 'ظهر' },
  { id: 'evening', label: 'عصر' },
];

export type ReceptionItem = {
  id: string;
  source: 'booking' | 'consultation';
  category: Exclude<ReceptionCategory, 'all'>;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  typeLabel: string;
  categoryLabel: string;
  dateLabel: string;
  timeLabel: string;
  hour: number | null;
  amount: number;
  status: string;
  isDeposit?: boolean;
  depositNonRefundable?: boolean;
};

function parseHour(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const text = String(raw);
  const match = text.match(/(\d{1,2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  return Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

export function timeOfDayFromHour(hour: number | null): ReceptionTimeOfDay | 'all' {
  if (hour == null) return 'all';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function classifyBooking(row: {
  type?: string | null;
  typeLabel?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
}): Exclude<ReceptionCategory, 'all'> {
  const type = String(row.type || '').toLowerCase();
  if (type === 'laser' || String(row.doctorId || '') === 'laser') return 'laser';
  if (type === 'visit' || type === 'treatment') return 'dental';
  const label = `${row.typeLabel || ''} ${row.doctorName || ''}`;
  if (/لیزر|زیبایی/.test(label)) return 'laser';
  if (/پرستار/.test(label)) return 'nursing';
  if (/پزشک|منزل|ویزیت/.test(label) && type !== 'visit') return 'medical';
  return 'dental';
}

export function classifyConsultation(row: {
  category?: string | null;
  categoryLabel?: string | null;
  typeLabel?: string | null;
}): Exclude<ReceptionCategory, 'all'> {
  const category = String(row.category || '').toLowerCase();
  if (category === 'nursing' || category.startsWith('nursing')) return 'nursing';
  if (category === 'medical-home' || category === 'medical') return 'medical';
  if (
    category === 'psychology' ||
    category === 'nutrition' ||
    category === 'midwifery' ||
    category === 'dental-home' ||
    category === 'dental-corporate'
  ) {
    return 'consultation';
  }
  const label = `${row.categoryLabel || ''} ${row.typeLabel || ''}`;
  if (/پرستار/.test(label)) return 'nursing';
  if (/منزل|پزشکی|اعزام/.test(label)) return 'medical';
  if (/روان|تغذیه|ماما/.test(label)) return 'consultation';
  return 'consultation';
}

export function mapBookingToReception(row: Record<string, unknown>): ReceptionItem {
  const hour =
    parseHour(row.timeValue) ??
    parseHour(row.timeLabel) ??
    (row.appointmentAt ? new Date(String(row.appointmentAt)).getHours() : null);
  return {
    id: String(row.id),
    source: 'booking',
    category: classifyBooking({
      type: row.type ? String(row.type) : null,
      typeLabel: row.typeLabel ? String(row.typeLabel) : null,
      doctorId: row.doctorId ? String(row.doctorId) : null,
      doctorName: row.doctorName ? String(row.doctorName) : null,
    }),
    patientName: String(row.patientName || '—'),
    patientPhone: String(row.patientPhone || '—'),
    doctorName: String(row.doctorName || '—'),
    typeLabel: String(row.typeLabel || row.type || '—'),
    categoryLabel: 'رزرو نوبت',
    dateLabel: String(row.dateLabel || row.day || '—'),
    timeLabel: String(row.timeLabel || '—'),
    hour,
    amount: Number(row.amount || 0),
    status: String(row.status || 'pending'),
    isDeposit: Boolean(row.isDeposit),
    depositNonRefundable: Boolean(row.depositNonRefundable),
  };
}

export function mapConsultationToReception(row: Record<string, unknown>): ReceptionItem {
  const hour = parseHour(row.preferredTime) ?? parseHour(row.preferredTimeLabel);
  return {
    id: String(row.id),
    source: 'consultation',
    category: classifyConsultation({
      category: row.category ? String(row.category) : null,
      categoryLabel: row.categoryLabel ? String(row.categoryLabel) : null,
      typeLabel: row.typeLabel ? String(row.typeLabel) : null,
    }),
    patientName: String(row.name || row.patientName || '—'),
    patientPhone: String(row.phone || row.patientPhone || '—'),
    doctorName: String(row.doctorName || '—'),
    typeLabel: String(row.typeLabel || row.type || '—'),
    categoryLabel: String(row.categoryLabel || row.category || 'مشاوره'),
    dateLabel: String(row.preferredDateLabel || row.preferredDate || '—'),
    timeLabel: String(row.preferredTimeLabel || row.preferredTime || '—'),
    hour,
    amount: Number(row.amount || 0),
    status: String(row.status || 'pending'),
  };
}

export function filterReceptionItems(
  items: ReceptionItem[],
  input: {
    category: ReceptionCategory;
    timeOfDay: ReceptionTimeOfDay;
    doctor: string;
  },
): ReceptionItem[] {
  const doctor = input.doctor.trim();
  return items.filter((item) => {
    if (input.category !== 'all' && item.category !== input.category) return false;
    if (input.timeOfDay !== 'all') {
      const bucket = timeOfDayFromHour(item.hour);
      if (bucket !== input.timeOfDay) return false;
    }
    if (doctor && doctor !== 'all' && item.doctorName !== doctor) return false;
    return true;
  });
}

export function uniqueDoctors(items: ReceptionItem[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item.doctorName && item.doctorName !== '—') set.add(item.doctorName);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'fa'));
}

export function receptionCategoryLabel(category: Exclude<ReceptionCategory, 'all'>): string {
  return RECEPTION_CATEGORY_TABS.find((t) => t.id === category)?.label || category;
}
