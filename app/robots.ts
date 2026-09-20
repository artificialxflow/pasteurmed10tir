import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api',
        '/uploads',
        '/account',
        '/app',
        '/installments',
        '/wallet',
        '/reminders',
        '/shop/cart',
        '/*/confirm',
        '/*/success',
        '/*/failed',
      ],
    },
    sitemap: 'https://pasteur.plus/sitemap.xml',
  };
}
