import { listHealthRecordRegistrarOptions } from '@/lib/health-record/registrar-options';
import { requirePatient } from '@/lib/operations/require-patient';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

/** لیست پرسنل اورژانس و پزشکان — برای انتخاب ثبت‌کننده در پرونده سلامت */
export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  try {
    const items = await listHealthRecordRegistrarOptions();
    return NextResponse.json({ items });
  } catch (e) {
    return prismaRouteError(e, 'operations/emergency-physicians GET');
  }
}
