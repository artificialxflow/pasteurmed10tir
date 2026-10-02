import { supportsConsultationVideo } from '@/lib/consultation/categories';
import { mintConsultationVideoAccess } from '@/lib/jitsi/consultation-video';
import { consultationPatientTrackUrl } from '@/lib/jitsi/patient-track';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import {
  isSmsConfigured,
  sendVideoVisitDoctorSms,
  sendVideoVisitPatientSms,
} from '@/lib/sms/client';
import { getSiteUrl } from '@/lib/zibal/config';
import type { Consultation } from '@prisma/client';

async function resolveDoctorPhone(doctorId: string | null | undefined): Promise<string | null> {
  if (!doctorId) return null;
  const id = Number(doctorId);
  if (!Number.isFinite(id)) return null;

  const physician = await prisma.physician.findUnique({
    where: { id },
    select: { phone: true },
  });
  const phone = normalizePhoneDigits(physician?.phone || '');
  return phone.length >= 10 ? phone : null;
}

function visitTimeLabel(row: Consultation): string {
  const date = String(row.preferredDateLabel || '').trim();
  const time = String(row.preferredTimeLabel || row.preferredTime || '').trim();
  if (date && time) return `${date} ${time}`;
  if (time) return time;
  if (date) return date;
  return 'به‌زودی';
}

async function buildDoctorJoinUrl(row: Consultation): Promise<string> {
  const external = String(row.videoMeetingUrl || '').trim();
  if (external) return external;

  if (row.videoStatus === 'scheduled' || row.videoStatus === 'in_call') {
    try {
      const token = await mintConsultationVideoAccess({
        consultationId: row.id,
        sub: `doctor:${row.doctorId || row.id}`,
        displayName: row.doctorName || 'پزشک',
        moderator: true,
      });
      return token.url;
    } catch {
      /* fall through */
    }
  }

  return `${getSiteUrl()}/admin/consultations`;
}

/** پیامک به پزشک وقتی ویزیت تصویری آماده شد — خطا جریان ادمین را قطع نمی‌کند */
export async function notifyDoctorVideoVisitSms(consultationId: string) {
  if (!isSmsConfigured()) return;

  try {
    const row = await prisma.consultation.findUnique({ where: { id: consultationId } });
    if (!row || row.status === 'cancelled') return;
    if (!supportsConsultationVideo(row.category)) return;
    if (row.videoStatus !== 'scheduled' && row.videoStatus !== 'in_call') return;

    const doctorPhone = await resolveDoctorPhone(row.doctorId);
    if (!doctorPhone) {
      console.warn('[sms] video-doctor skipped — no physician phone', {
        consultationId,
        doctorId: row.doctorId,
      });
      return;
    }

    const patientName = String(row.patientName || 'بیمار').slice(0, 40);
    const timeLabel = visitTimeLabel(row).slice(0, 40);
    const joinUrl = (await buildDoctorJoinUrl(row)).slice(0, 200);

    const result = await sendVideoVisitDoctorSms(doctorPhone, patientName, timeLabel, joinUrl);
    if (!result.ok) {
      console.error('[sms] video-doctor', result.error);
    }
  } catch (e) {
    console.error('[sms] video-doctor', e);
  }
}

/** پیامک به بیمار با لینک صفحه پیگیری (ورود با اکانت خودش) */
export async function notifyPatientVideoVisitSms(consultationId: string) {
  if (!isSmsConfigured()) return;

  try {
    const row = await prisma.consultation.findUnique({ where: { id: consultationId } });
    if (!row || row.status === 'cancelled') return;
    if (!supportsConsultationVideo(row.category)) return;
    if (row.videoStatus !== 'scheduled' && row.videoStatus !== 'in_call') return;

    const phone = normalizePhoneDigits(row.patientPhone || '');
    if (phone.length < 10) {
      console.warn('[sms] video-patient skipped — no phone', { consultationId });
      return;
    }

    const timeLabel = visitTimeLabel(row).slice(0, 40);
    const trackUrl = consultationPatientTrackUrl(row.id).slice(0, 200);
    const result = await sendVideoVisitPatientSms(phone, timeLabel, trackUrl);
    if (!result.ok) {
      console.error('[sms] video-patient', result.error);
    }
  } catch (e) {
    console.error('[sms] video-patient', e);
  }
}

/** اطلاع‌رسانی همزمان پزشک + بیمار هنگام آماده‌شدن جلسه */
export async function notifyVideoVisitReadySms(consultationId: string) {
  await Promise.all([
    notifyDoctorVideoVisitSms(consultationId),
    notifyPatientVideoVisitSms(consultationId),
  ]);
}
