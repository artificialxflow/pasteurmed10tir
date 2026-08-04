const HREF_RULES: { pattern: RegExp; href: string }[] = [
  { pattern: /لیزر|laser/i, href: '/laser' },
  { pattern: /دندان|dental/i, href: '/dental' },
  { pattern: /پرستار|nursing/i, href: '/nursing' },
  { pattern: /پزشک|medical|doctor/i, href: '/medical' },
  { pattern: /فروش|shop|محصول/i, href: '/shop' },
  { pattern: /گالری|gallery/i, href: '/gallery' },
];

/** Infer public route from Persian/English service title. */
export function inferServiceHref(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '/';

  for (const { pattern, href } of HREF_RULES) {
    if (pattern.test(trimmed)) return href;
  }

  return '/';
}
