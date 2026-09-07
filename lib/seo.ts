import { PASTEUR_DATA } from '@/lib/data';
import { ROUTES } from '@/lib/routes';

const SITE = 'https://pasteur.plus';

/** مسیرهای عمومی سایت برای sitemap — بدون صفحات پرداخت و پنل کاربری */
export const PUBLIC_SITEMAP_PATHS: Array<{ path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }> = [
  { path: ROUTES.web.home, priority: 1, changeFrequency: 'weekly' },
  { path: ROUTES.web.contact, priority: 0.8, changeFrequency: 'monthly' },
  { path: ROUTES.web.privacy, priority: 0.3, changeFrequency: 'monthly' },
  { path: ROUTES.web.dental, priority: 0.9, changeFrequency: 'weekly' },
  { path: ROUTES.web.dentalGeneral, priority: 0.8, changeFrequency: 'weekly' },
  { path: ROUTES.web.dentalSpecialty, priority: 0.8, changeFrequency: 'weekly' },
  { path: ROUTES.web.dentalTariffs, priority: 0.7, changeFrequency: 'weekly' },
  { path: ROUTES.web.dentalEducation, priority: 0.6, changeFrequency: 'monthly' },
  { path: ROUTES.web.dentalBooking, priority: 0.8, changeFrequency: 'weekly' },
  { path: ROUTES.web.dentalMembership, priority: 0.7, changeFrequency: 'monthly' },
  { path: ROUTES.web.medical, priority: 0.8, changeFrequency: 'weekly' },
  { path: ROUTES.web.medicalSpecialty, priority: 0.7, changeFrequency: 'weekly' },
  { path: ROUTES.web.medicalDoctors, priority: 0.7, changeFrequency: 'weekly' },
  { path: ROUTES.web.consultation, priority: 0.8, changeFrequency: 'weekly' },
  { path: ROUTES.web.nursing, priority: 0.7, changeFrequency: 'weekly' },
  { path: ROUTES.web.laser, priority: 0.7, changeFrequency: 'weekly' },
  { path: ROUTES.web.shop, priority: 0.7, changeFrequency: 'weekly' },
  { path: ROUTES.web.shopCatalog, priority: 0.6, changeFrequency: 'weekly' },
  { path: ROUTES.web.gallery, priority: 0.5, changeFrequency: 'monthly' },
  { path: ROUTES.web.partners, priority: 0.4, changeFrequency: 'monthly' },
  { path: ROUTES.web.club, priority: 0.5, changeFrequency: 'monthly' },
  { path: ROUTES.web.help, priority: 0.4, changeFrequency: 'monthly' },
  { path: ROUTES.web.support, priority: 0.4, changeFrequency: 'monthly' },
];

export function clinicJsonLd() {
  const inst = PASTEUR_DATA.institute;
  return {
    '@context': 'https://schema.org',
    '@type': ['MedicalClinic', 'LocalBusiness'],
    name: inst.nameFa,
    alternateName: inst.nameEn,
    url: SITE,
    logo: `${SITE}/brand/clinique-pasteur-logo.png`,
    image: `${SITE}/brand/clinique-pasteur-logo.png`,
    telephone: [`+98${inst.phoneDigits.replace(/^0/, '')}`, `+98${inst.phoneAltDigits.replace(/^0/, '')}`],
    address: {
      '@type': 'PostalAddress',
      streetAddress: inst.address,
      addressLocality: 'تبریز',
      addressRegion: 'آذربایجان شرقی',
      addressCountry: 'IR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: inst.latitude,
      longitude: inst.longitude,
    },
    areaServed: inst.serviceArea,
    openingHours: 'Mo-Su 00:00-23:59',
    description: inst.subtitle,
  };
}

export function absoluteUrl(path: string) {
  if (path === '/') return SITE;
  return `${SITE}${path}`;
}
