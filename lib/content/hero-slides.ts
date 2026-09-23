import { ROUTES } from '@/lib/routes';

export type HeroSlide = {
  src: string;
  alt: string;
  href: string;
};

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    src: '/hero/slide-1-heritage.jpg',
    alt: 'کلینیک پاستور — از ۱۳۶۶ تا امروز',
    href: ROUTES.web.contact,
  },
  {
    src: '/hero/slide-2-equipment-loan.jpg',
    alt: 'وام خرید تجهیزات دندانپزشکی — تسهیلات VIP',
    href: ROUTES.web.shopFacility,
  },
  {
    src: '/hero/slide-3-implant.jpg',
    alt: 'ایمپلنت دیجیتال — تحویل دندان در یک روز',
    href: ROUTES.web.dentalBooking,
  },
  {
    src: '/hero/slide-4-medical-loan.jpg',
    alt: 'وام درمانی ۳۰۰ میلیونی',
    href: ROUTES.web.account,
  },
  {
    src: '/hero/slide-5-online-visit.jpg',
    alt: 'ویزیت آنلاین و تصویری با متخصصین پاستور پلاس',
    href: ROUTES.web.consultation,
  },
];

export function parseHeroSlides(raw: unknown): HeroSlide[] {
  if (!Array.isArray(raw)) return [];
  const out: HeroSlide[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const src = String(row.src || row.image || '').trim();
    if (!src) continue;
    out.push({
      src,
      alt: String(row.alt || row.title || '').trim() || 'اسلاید پاستور پلاس',
      href: String(row.href || '').trim() || ROUTES.web.home,
    });
  }
  return out;
}

export function resolveHeroSlides(raw: unknown): HeroSlide[] {
  const parsed = parseHeroSlides(raw);
  return parsed.length ? parsed : DEFAULT_HERO_SLIDES;
}
