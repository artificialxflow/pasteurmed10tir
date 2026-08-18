export function slugifyFa(input: string): string {
  const base =
    String(input || '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}\-]+/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'product';
  return base;
}

export function ensureUniqueSlug(base: string, taken: Set<string>): string {
  let slug = slugifyFa(base);
  if (!slug) slug = 'product';
  let candidate = slug;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${slug}-${n}`;
    n += 1;
  }
  taken.add(candidate);
  return candidate;
}

/** Preserve slug/name as typed (for category labels); only dedupe collisions. */
export function ensureUniqueSlugLiteral(base: string, taken: Set<string>): string {
  let slug = String(base || '').trim() || 'category';
  let candidate = slug;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${slug}-${n}`;
    n += 1;
  }
  taken.add(candidate);
  return candidate;
}
