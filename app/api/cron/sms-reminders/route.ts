import { jsonError } from '@/lib/auth/api-utils';
import {
  isSmsConfigured,
  sendReminder24hSms,
  sendReminder2hSms,
} from '@/lib/sms/client';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Secure cron endpoint for appointment reminder SMS.
 * Auth: Authorization: Bearer $CRON_SECRET  (or x-cron-secret header)
 *
 * Schedule externally every 10–15 minutes against:
 *   POST https://pasteur.plus/api/cron/sms-reminders
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return jsonError('CRON_SECRET تنظیم نشده است.', 503);
  }
  const auth = request.headers.get('authorization') || '';
  const headerSecret = request.headers.get('x-cron-secret') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : headerSecret;
  if (token !== secret) return jsonError('غیرمجاز', 401);

  if (!isSmsConfigured()) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'sms not configured' });
  }

  const now = Date.now();
  const in25h = new Date(now + 25 * 60 * 60 * 1000);
  const in23h = new Date(now + 23 * 60 * 60 * 1000);
  const in3h = new Date(now + 3 * 60 * 60 * 1000);
  const in1h = new Date(now + 1 * 60 * 60 * 1000);

  const due24 = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      reminder24Sent: false,
      appointmentAt: { gte: in23h, lte: in25h },
    },
    take: 50,
  });

  const due2 = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      reminder2Sent: false,
      appointmentAt: { gte: in1h, lte: in3h },
    },
    take: 50,
  });

  let sent24 = 0;
  let sent2 = 0;

  for (const b of due24) {
    const timeLabel = b.timeLabel || `${b.day ?? ''} ${b.timeValue ?? ''}`.trim() || '—';
    const service = b.typeLabel || b.specialty || 'نوبت';
    const r = await sendReminder24hSms(b.patientPhone, timeLabel, service);
    if (r.ok) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { reminder24Sent: true },
      });
      sent24 += 1;
    }
  }

  for (const b of due2) {
    const timeLabel = b.timeLabel || `${b.day ?? ''} ${b.timeValue ?? ''}`.trim() || '—';
    const service = b.typeLabel || b.specialty || 'نوبت';
    const r = await sendReminder2hSms(b.patientPhone, timeLabel, service);
    if (r.ok) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { reminder2Sent: true },
      });
      sent2 += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    sent24,
    sent2,
    scanned24: due24.length,
    scanned2: due2.length,
  });
}
