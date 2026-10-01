import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { notifyPatientVideoVisitSms } from '@/lib/jitsi/doctor-sms';
import { consultationPatientTrackUrl } from '@/lib/jitsi/patient-track';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/** ارسال دستی پیامک لینک پیگیری به بیمار */
export async function POST(request: Request) {
  const auth = await requireAdmin('consultations');
  if (auth.error) return auth.error;

  const body = await parseJson<{ id?: string }>(request);
  if (!body?.id) return jsonError('شناسه مشاوره الزامی است.');

  const row = await prisma.consultation.findUnique({ where: { id: body.id } });
  if (!row) return jsonError('مشاوره یافت نشد.', 404);
  if (row.status === 'cancelled') return jsonError('مشاوره لغو شده است.');
  if (row.videoStatus !== 'scheduled' && row.videoStatus !== 'in_call') {
    return jsonError('ابتدا جلسه ویدیو را باز کنید یا لینک اتاق را ثبت کنید.');
  }

  await notifyPatientVideoVisitSms(row.id);

  return NextResponse.json({
    ok: true,
    trackUrl: consultationPatientTrackUrl(row.id),
    message: 'پیامک لینک پیگیری برای بیمار ارسال شد (در صورت تنظیم پترن).',
  });
}
