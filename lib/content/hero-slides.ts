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
    alt: 'وام درمانی — تسهیلات پاستور پلاس',
    href: ROUTES.web.dentalMembership,
  },
  {
    src: '/hero/slide-5-online-visit.jpg',
    alt: 'ویزیت آنلاین و تصویری با متخصصین پاستور پلاس',
    href: ROUTES.web.consultation,
  },
];

/**
 * اسلایدهای پرونده سلامت → /account/health-record
 * اسلایدهای تسهیلات / وام درمانی → /dental/membership
 * تسهیلات تجهیزات → /shop/facility
 */
export function normalizeHeroSlideHref(slide: Pick<HeroSlide, 'src' | 'alt' | 'href'>): string {
  const text = `${slide.alt || ''} ${slide.src || ''}`;
  const href = String(slide.href || '').trim();

  if (/پرونده\s*سلامت|health[-_]?record|سوابق\s*پزشکی/i.test(text)) {
    return ROUTES.web.healthRecord;
  }

  if (
    /تسهیلات\s*VIP|تجهیزات|equipment[-_]?loan/i.test(text) ||
    /equipment-loan|shop\/facility/i.test(slide.src) ||
    href.includes('/shop/facility')
  ) {
    return ROUTES.web.shopFacility;
  }

  if (
    /وام|تسهیلات|medical[-_]?loan|میلیون|بازپرداخت/i.test(text) ||
    /medical-loan|membership/i.test(slide.src)
  ) {
    return ROUTES.web.dentalMembership;
  }

  return href || ROUTES.web.home;
}

export function normalizeHeroSlide(slide: HeroSlide): HeroSlide {
  return {
    ...slide,
    href: normalizeHeroSlideHref(slide),
  };
}

export function parseHeroSlides(raw: unknown): HeroSlide[] {
  if (!Array.isArray(raw)) return [];
  const out: HeroSlide[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const src = String(row.src || row.image || '').trim();
    if (!src) continue;
    out.push(
      normalizeHeroSlide({
        src,
        alt: String(row.alt || row.title || '').trim() || 'اسلاید پاستور پلاس',
        href: String(row.href || '').trim() || ROUTES.web.home,
      }),
    );
  }
  return out;
}

export function resolveHeroSlides(raw: unknown): HeroSlide[] {
  const parsed = parseHeroSlides(raw);
  if (parsed.length) return parsed;
  return DEFAULT_HERO_SLIDES.map((slide) => normalizeHeroSlide({ ...slide }));
}
