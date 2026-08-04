/** Normalize Iranian mobile to digits (09xxxxxxxxx). */
export function normalizePhoneDigits(phone: string): string {
  let digits = String(phone || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');

  if (digits.startsWith('98') && digits.length === 12) digits = `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith('9')) digits = `0${digits}`;
  return digits;
}
