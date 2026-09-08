export type PreferredGender = 'any' | 'male' | 'female';

export function parsePreferredGender(raw: unknown): PreferredGender {
  if (raw === 'male' || raw === 'female') return raw;
  return 'any';
}

export function parseStaffGender(raw: unknown): 'male' | 'female' | null {
  if (raw === 'male' || raw === 'female') return raw;
  return null;
}

export function staffGenderLabel(gender?: string | null): string {
  if (gender === 'male') return 'آقا';
  if (gender === 'female') return 'خانم';
  return '—';
}

export function preferredGenderLabel(gender?: string | null): string {
  if (gender === 'male') return 'آقا';
  if (gender === 'female') return 'خانم';
  return 'فرقی ندارد';
}
