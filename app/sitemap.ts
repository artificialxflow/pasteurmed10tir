import { absoluteUrl, PUBLIC_SITEMAP_PATHS } from '@/lib/seo';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_SITEMAP_PATHS.map((item) => ({
    url: absoluteUrl(item.path),
    lastModified,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));
}
