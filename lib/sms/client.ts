/**
 * Host Iran / payamak-panel REST client (pattern / BaseServiceNumber).
 * Docs: https://docs.payamak-panel.com/
 * REST pattern endpoint: POST https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber
 */

export type SmsSendResult =
  | { ok: true; value: string }
  | { ok: false; error: string; raw?: unknown };

function env(name: string): string {
  return process.env[name]?.trim() || '';
}

export function isSmsConfigured(): boolean {
  return Boolean(env('SMS_USERNAME') && env('SMS_API_KEY') && env('SMS_OTP_BODY_ID'));
}

export function smsBodyIds() {
  return {
    otp: Number(env('SMS_OTP_BODY_ID') || 0),
    reminder24h: Number(env('SMS_REMINDER_24H_BODY_ID') || 0),
    reminder2h: Number(env('SMS_REMINDER_2H_BODY_ID') || 0),
    booking: Number(env('SMS_BOOKING_BODY_ID') || 0),
    consultation: Number(env('SMS_CONSULTATION_BODY_ID') || 0),
  };
}

/** Panel expects 09xxxxxxxxx */
export function toSmsRecipient(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('98') && digits.length >= 12) return `0${digits.slice(2)}`;
  if (digits.startsWith('9') && digits.length === 10) return `0${digits}`;
  return digits;
}

/**
 * Send pattern SMS. `vars` filled into {0},{1},... joined with `;`
 * (BaseServiceNumber / SendByBaseNumber2 convention).
 */
export async function sendByPattern(
  bodyId: number,
  to: string,
  vars: string[],
): Promise<SmsSendResult> {
  if (!bodyId || Number.isNaN(bodyId)) {
    return { ok: false, error: 'شناسه الگوی پیامک تنظیم نشده است.' };
  }
  const username = env('SMS_USERNAME');
  const password = env('SMS_API_KEY');
  if (!username || !password) {
    return { ok: false, error: 'تنظیمات پیامک ناقص است.' };
  }

  const base = (env('SMS_BASE_URL') || 'https://rest.payamak-panel.com').replace(/\/$/, '');
  const url = `${base}/api/SendSMS/BaseServiceNumber`;
  const recipient = toSmsRecipient(to);
  const text = vars.map((v) => String(v ?? '').replace(/;/g, '،')).join(';');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({
        username,
        password,
        to: recipient,
        bodyId: String(bodyId),
        text,
      }),
      cache: 'no-store',
    });

    const rawText = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      data = { Value: rawText };
    }

    const retStatus = Number(data.RetStatus ?? data.retStatus ?? NaN);
    const value = String(data.Value ?? data.value ?? '');
    // Success: RetStatus === 1, or Value looks like a numeric recId
    const valueOk = /^\d{5,}$/.test(value.trim());
    if (retStatus === 1 || (res.ok && valueOk)) {
      return { ok: true, value };
    }

    const str =
      String(data.StrRetStatus ?? data.strRetStatus ?? data.Message ?? rawText).slice(0, 200) ||
      'ارسال پیامک ناموفق بود.';
    console.error('[sms] send failed', { bodyId, recipient, retStatus, str });
    return { ok: false, error: str, raw: data };
  } catch (e) {
    console.error('[sms] network error', e);
    return { ok: false, error: 'خطا در ارتباط با سرویس پیامک.' };
  }
}

export async function sendOtpSms(phone: string, code: string): Promise<SmsSendResult> {
  return sendByPattern(smsBodyIds().otp, phone, [code]);
}

export async function sendConsultationSms(
  phone: string,
  trackingCode: string,
): Promise<SmsSendResult> {
  const id = smsBodyIds().consultation;
  if (!id) return { ok: false, error: 'پترن مشاوره تنظیم نشده.' };
  return sendByPattern(id, phone, [trackingCode]);
}

export async function sendBookingSms(
  phone: string,
  timeLabel: string,
  serviceLabel: string,
): Promise<SmsSendResult> {
  const id = smsBodyIds().booking;
  if (!id) return { ok: false, error: 'پترن رزرو تنظیم نشده.' };
  return sendByPattern(id, phone, [timeLabel || '—', serviceLabel || 'نوبت']);
}

export async function sendReminder24hSms(
  phone: string,
  timeLabel: string,
  serviceLabel: string,
): Promise<SmsSendResult> {
  const id = smsBodyIds().reminder24h;
  if (!id) return { ok: false, error: 'پترن یادآور ۲۴س تنظیم نشده.' };
  return sendByPattern(id, phone, [timeLabel || '—', serviceLabel || 'نوبت']);
}

export async function sendReminder2hSms(
  phone: string,
  timeLabel: string,
  serviceLabel: string,
): Promise<SmsSendResult> {
  const id = smsBodyIds().reminder2h;
  if (!id) return { ok: false, error: 'پترن یادآور ۲س تنظیم نشده.' };
  return sendByPattern(id, phone, [timeLabel || '—', serviceLabel || 'نوبت']);
}
