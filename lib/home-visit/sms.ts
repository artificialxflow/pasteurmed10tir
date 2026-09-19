import { buildMapsUrl, parseLatLng } from '@/lib/home-visit/geo';
import { homeVisitStatusLabel } from '@/lib/home-visit/labels';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import {
  isSmsConfigured,
  sendConsultationSms,
  sendHomeVisitStaffAssignedSms,
} from '@/lib/sms/client';
import { getSiteUrl } from '@/lib/zibal/config';
import type { HomeVisitStatus } from '@prisma/client';

const SMS_STATUSES: HomeVisitStatus[] = ['staff_assigned', 'en_route', 'completed'];

export type HomeVisitStaffSmsDetails = {
  requestId: string;
  areaLabel?: string;
  serviceTitle?: string | null;
  specialtyLabel?: string | null;
  patientName?: string | null;
  patientAddress?: string;
  patientPhone?: string;
  latitude?: number | null;
  longitude?: number | null;
};

function truncateSmsText(value: string, maxLen: number): string {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '—';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, Math.max(0, maxLen - 1))}…`;
}

function formatSmsPhone(phone?: string): string {
  const digits = normalizePhoneDigits(phone || '');
  if (!digits) return '—';
  if (digits.startsWith('98') && digits.length >= 12) return `0${digits.slice(2)}`;
  if (digits.startsWith('9') && digits.length === 10) return `0${digits}`;
  return digits.startsWith('0') ? digits : `0${digits}`;
}

/** متغیرهای payamak: {0}…{6} — متن پیشنهادی در .env.example */
export function buildHomeVisitStaffSmsVars(details: HomeVisitStaffSmsDetails): string[] {
  const coords = parseLatLng(details.latitude, details.longitude);
  const mapsUrl = coords ? buildMapsUrl(coords.lat, coords.lng) : '';
  const serviceLabel =
    String(details.serviceTitle || details.specialtyLabel || '').trim() || 'اعزام منزل';
  const areaLine =
    [details.areaLabel, serviceLabel].filter((part) => part && part !== '—').join(' · ') || '—';

  return [
    details.requestId || '—',
    areaLine,
    truncateSmsText(details.patientName || '—', 40),
    truncateSmsText(details.patientAddress || '—', 120),
    formatSmsPhone(details.patientPhone),
    mapsUrl || '—',
    `${getSiteUrl()}/account`,
  ];
}

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
export async function notifyHomeVisitStaffAssignedSms(
  phone: string,
  details: HomeVisitStaffSmsDetails,
) {
  const digits = normalizePhoneDigits(phone);
  if (!digits || digits.length < 10 || !isSmsConfigured()) return;
  try {
    const result = await sendHomeVisitStaffAssignedSms(
      digits,
      buildHomeVisitStaffSmsVars(details),
    );
    if (!result.ok) {
      console.error('[sms] home-visit-staff', result.error);
    }
  } catch (e) {
    console.error('[sms] home-visit-staff', e);
  }
}
