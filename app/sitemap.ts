import { ROUTES } from '@/lib/routes';
import type { MetadataRoute } from 'next';

const SITE = 'https://pasteur.plus';

/** مسیرهای عمومی — بدون import از lib/data برای پایداری sitemap */
const PUBLIC_PATHS: Array<{
  path: string;
  priority: number;
  changeFrequency: 'weekly' | 'monthly';
}> = [
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

function absoluteUrl(path: string) {
  if (path === '/') return SITE;
  return `${SITE}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_PATHS.map((item) => ({
    url: absoluteUrl(item.path),
    lastModified,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));
}
