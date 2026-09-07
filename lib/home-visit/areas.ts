/** مناطق متنی پوشش اعزام — فاز ۱ بدون مختصات */

export type ServiceArea = {
  id: string;
  label: string;
};

export const HOME_VISIT_SERVICE_AREAS: ServiceArea[] = [
  { id: 'valiasr', label: 'ولیعصر' },
  { id: 'elgoli', label: 'ائل‌گلی' },
  { id: 'roshdieh', label: 'رشدیه' },
  { id: 'baghmisheh', label: 'باغمیشه' },
  { id: 'zafaranieh', label: 'زعفرانیه' },
  { id: 'manzarieh', label: 'منظریه' },
  { id: 'abresan', label: 'آبرسان' },
  { id: 'saat', label: 'میدان ساعت / مرکز شهر' },
  { id: 'imam', label: 'خیابان امام' },
  { id: 'nasr', label: 'شهرک نصر' },
  { id: 'parvaz', label: 'شهرک پرواز' },
  { id: 'eram', label: 'شهرک ارم' },
  { id: 'maralan', label: 'مارالان' },
  { id: 'taleghani', label: 'طالقانی' },
  { id: 'chaykenar', label: 'چایکنار' },
  { id: 'nesfeh-rah', label: 'نصف‌راه' },
  { id: 'raah-ahan', label: 'راه‌آهن' },
  { id: 'baroon-avak', label: 'بارون آواک' },
  { id: 'abbasi', label: 'عباسی' },
  { id: 'beheshti', label: 'شهید بهشتی' },
  { id: 'golpark', label: 'گلپارک' },
  { id: 'other-tabriz', label: 'سایر مناطق تبریز' },
  { id: 'suburb', label: 'حومه تبریز' },
];

const AREA_BY_ID = new Map(HOME_VISIT_SERVICE_AREAS.map((area) => [area.id, area]));

export function isKnownServiceArea(id?: string | null): boolean {
  return Boolean(id && AREA_BY_ID.has(id));
}

export function serviceAreaLabel(id?: string | null): string {
  if (!id) return '—';
  return AREA_BY_ID.get(id)?.label || id;
}
