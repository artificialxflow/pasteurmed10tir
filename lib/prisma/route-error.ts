import { jsonError } from '@/lib/auth/api-utils';
import { Prisma } from '@prisma/client';

function messageLooksLikeSchemaDrift(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('does not exist') ||
    lower.includes('medicalcouncilnumber') ||
    lower.includes('discountpercent') ||
    lower.includes('column') && lower.includes('database')
  );
}

/** Map Prisma/DB failures to a JSON error the admin UI can show. */
export function prismaRouteError(e: unknown, context?: string) {
  console.error(`[prisma] ${context || 'route'}`, e);

  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2021') {
      return jsonError(
        'جدول دیتابیس یافت نشد. روی سرور دستور npm run db:deploy را اجرا کنید.',
        503,
      );
    }
    if (e.code === 'P2022') {
      return jsonError(
        'ستون دیتابیس با نسخهٔ برنامه هم‌خوان نیست. روی سرور: npm run db:deploy',
        503,
      );
    }
  }

  const msg = e instanceof Error ? e.message : String(e);
  if (messageLooksLikeSchemaDrift(msg)) {
    return jsonError(
      'مهاجرت دیتابیس (migration) اجرا نشده است. روی سرور: npm run db:deploy',
      503,
    );
  }

  return jsonError('خطای سرور در دسترسی به دیتابیس.', 500);
}
