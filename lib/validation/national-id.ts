/** Iranian national ID (کد ملی) checksum validation */

export function normalizeNationalId(raw: string): string {
  return String(raw || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');
}

export function isValidNationalId(raw: string): boolean {
  const code = normalizeNationalId(raw);
  if (!/^\d{10}$/.test(code)) return false;
  if (/^(\d)\1{9}$/.test(code)) return false;
  const check = Number(code[9]);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(code[i]) * (10 - i);
  const r = sum % 11;
  return r < 2 ? check === r : check === 11 - r;
}
