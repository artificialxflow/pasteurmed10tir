import { homeVisitStatusLabel } from '@/lib/home-visit/labels';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import {
  isSmsConfigured,
  sendConsultationSms,
  sendHomeVisitStaffAssignedSms,
} from '@/lib/sms/client';
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

/** پیامک تخصیص به نیروی میدانی — اگر موبایل خالی یا SMS خاموش باشد بی‌صدا */
export async function notifyHomeVisitStaffAssignedSms(phone: string, requestId: string) {
  const digits = normalizePhoneDigits(phone);
  if (!digits || digits.length < 10 || !isSmsConfigured()) return;
  try {
    const result = await sendHomeVisitStaffAssignedSms(digits, requestId);
    if (!result.ok) {
      console.error('[sms] home-visit-staff', result.error);
    }
  } catch (e) {
    console.error('[sms] home-visit-staff', e);
  }
}
