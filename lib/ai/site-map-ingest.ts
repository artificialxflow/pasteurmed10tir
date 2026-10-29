import { ROUTES } from '@/lib/routes';

type RouteEntry = { path: string; label: string; section: string };

function webRoutes(): RouteEntry[] {
  const labels: Record<string, string> = {
    home: 'صفحه اصلی',
    contact: 'تماس',
    help: 'آموزش سامانه',
    support: 'پشتیبانی',
    installments: 'اقساط و وام',
    consultation: 'مشاوره',
    dental: 'دندانپزشکی',
    shop: 'فروشگاه',
    medical: 'پزشکی',
    nursing: 'پرستاری',
    laser: 'لیزر',
    wallet: 'کیف اعتبار',
    club: 'باشگاه',
    gallery: 'گالری',
    partners: 'همکاری',
    assistant: 'دستیار هوشمند',
  };

  return Object.entries(ROUTES.web).map(([key, path]) => ({
    path,
    label: labels[key] || key,
    section: 'وب',
  }));
}

function appRoutes(): RouteEntry[] {
  return Object.entries(ROUTES.app).map(([key, path]) => ({
    path,
    label: key,
    section: 'اپ',
  }));
}

export function buildSiteMapCorpus(): string {
  const lines: string[] = [
    'نقشه مسیرهای سایت و اپ پاستور پلاس (pasteur.plus).',
    'کاربران می‌توانند از منو یا جستجو به این بخش‌ها بروند.',
    '',
  ];

  for (const entry of webRoutes()) {
    lines.push(`- [${entry.section}] ${entry.label}: ${entry.path}`);
  }
  lines.push('');
  lines.push('مسیرهای اپ (نسخه موبایل داخل /app):');
  for (const entry of appRoutes()) {
    lines.push(`- ${entry.path}`);
  }

  lines.push('');
  lines.push(
    'برای ثبت نام، رزرو، پرداخت، پیگیری درخواست‌ها و تیکت پشتیبانی از بخش حساب کاربری و پشتیبانی استفاده کنید.',
  );

  return lines.join('\n');
}

export const SITE_MAP_DOCUMENT_TITLE = 'نقشه سایت و اپ پاستور پلاس';
