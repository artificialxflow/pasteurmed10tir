import { HEALTH_SECTIONS, isKnownSection } from '@/lib/health-record/sections';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { isSmsConfigured, sendHealthRecordUpdateSms } from '@/lib/sms/client';
import { getSiteUrl } from '@/lib/zibal/config';

function sectionLabel(section: string): string {
  if (isKnownSection(section)) {
    return HEALTH_SECTIONS.find((s) => s.id === section)?.label || section;
  }
  return 'پرونده سلامت';
}

/** پیامک به بیمار بعد از ثبت مورد جدید توسط پزشک/ادمین — خطا ثبت را قطع نمی‌کند */
export async function notifyHealthRecordEntrySms(input: {
  patientPhone: string;
  section: string;
}) {
  const digits = normalizePhoneDigits(input.patientPhone);
  if (!digits || digits.length < 10 || !isSmsConfigured()) return;

  const label = sectionLabel(input.section);
  const url = `${getSiteUrl()}/account/health-record?section=${encodeURIComponent(input.section)}`;

  try {
    const result = await sendHealthRecordUpdateSms(digits, label, url);
    if (!result.ok) {
      console.error('[sms] health-record', result.error);
    }
  } catch (e) {
    console.error('[sms] health-record', e);
  }
}
