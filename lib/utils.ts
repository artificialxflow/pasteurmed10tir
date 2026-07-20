/** Format amount with fa-IR numerals and تومان suffix. */
export function formatPrice(amount: number): string {
  if (!amount) return 'رایگان';
  return `${amount.toLocaleString('fa-IR')} تومان`;
}

/** Format hour label for booking slots. */
export function formatHour(h: number): string {
  return `ساعت ${h}`;
}

/** Keep digits only (Persian/Arabic digits converted). */
export function normalizePhone(phone: string): string {
  return String(phone || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^\d]/g, '');
}

/** Generate a mock entity id: PST-timestamp-random. */
export function generateId(): string {
  return `PST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Join class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
