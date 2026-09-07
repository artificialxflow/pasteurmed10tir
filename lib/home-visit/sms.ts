import { homeVisitStatusLabel } from '@/lib/home-visit/labels';
import { isSmsConfigured, sendConsultationSms } from '@/lib/sms/client';
import type { HomeVisitStatus } from '@prisma/client';

const SMS_STATUSES: HomeVisitStatus[] = ['staff_assigned', 'en_route', 'completed'];

export async function notifyHomeVisitStatusSms(
  phone: string,
  status: HomeVisitStatus,
  requestId: string,
) {
  if (!SMS_STATUSES.includes(status) || !isSmsConfigured()) return;
  try {
    await sendConsultationSms(phone, `${homeVisitStatusLabel(status)} ${requestId}`);
  } catch (e) {
    console.error('[sms] home-visit', e);
  }
}
