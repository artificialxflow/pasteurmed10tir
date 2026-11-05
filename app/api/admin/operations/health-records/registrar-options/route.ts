import { requireAdminAny } from '@/lib/content/require-admin';
import { listHealthRecordRegistrarOptions } from '@/lib/health-record/registrar-options';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

/** گزینه‌های «نام ثبت‌کننده» برای فرم پرونده سلامت در پنل ادمین */
export async function GET() {
  const auth = await requireAdminAny(['patients', 'fieldStaff', 'consultations']);
  if (auth.error) return auth.error;

  try {
    const items = await listHealthRecordRegistrarOptions();
    return NextResponse.json({ items });
  } catch (e) {
    return prismaRouteError(e, 'admin/health-records/registrar-options GET');
  }
}
