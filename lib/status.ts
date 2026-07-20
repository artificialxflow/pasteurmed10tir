export type DoctorStatusKey = 'available' | 'busy' | 'inactive';

export interface StatusLabel {
  text: string;
  class: string;
}

export const STATUS_LABELS: Record<DoctorStatusKey, StatusLabel> = {
  available: { text: 'آزاد', class: 'badge-available' },
  busy: { text: 'مشغول', class: 'badge-busy' },
  inactive: { text: 'غیرفعال', class: 'badge-inactive' },
};
