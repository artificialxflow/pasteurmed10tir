export function defaultInsuranceLogoPath(id: string): string {
  const safe = String(id || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 48);
  if (!safe) return '/api/content/insurance-mark/ins';
  return `/insurances/${safe}.svg`;
}
