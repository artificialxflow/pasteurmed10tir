/** نرمال‌سازی شناسه نوع مشاوره برای قیمت و تعرفه (سازگاری `image` قدیمی). */
export function normalizeConsultationPriceTypeId(typeId?: string | null): string {
  const t = String(typeId || '').trim().toLowerCase();
  if (t === 'image') return 'video';
  return t;
}

export function tariffLookupKeys(typeId?: string | null): string[] {
  const primary = normalizeConsultationPriceTypeId(typeId);
  if (!primary) return [];
  const keys = [primary];
  if (primary === 'video') keys.push('image');
  if (primary === 'emergency') keys.push('video', 'image');
  return keys;
}
