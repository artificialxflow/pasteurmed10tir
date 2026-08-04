import { normalizePhone } from '@/lib/utils';

export function isDevOtpEnabled(): boolean {
  return Boolean(process.env.DEV_OTP_PHONE?.trim() && process.env.DEV_OTP_CODE?.trim());
}

export function devOtpPhone(): string | null {
  if (!isDevOtpEnabled()) return null;
  return normalizePhone(process.env.DEV_OTP_PHONE ?? '');
}

export function devOtpCode(): string | null {
  if (!isDevOtpEnabled()) return null;
  return process.env.DEV_OTP_CODE!.trim();
}

export function validateDevOtpSend(phone: string): { ok: true } | { ok: false; error: string } {
  if (!isDevOtpEnabled()) {
    return { ok: false, error: 'سرویس پیامک هنوز فعال نشده است.' };
  }
  const normalized = normalizePhone(phone);
  const allowed = devOtpPhone();
  if (!normalized || normalized.length < 10) {
    return { ok: false, error: 'شماره موبایل معتبر نیست.' };
  }
  if (allowed && normalized !== allowed) {
    return { ok: false, error: 'در فاز توسعه فقط شماره مجاز قابل استفاده است.' };
  }
  return { ok: true };
}

export function validateDevOtpCode(
  code: string,
): { ok: true } | { ok: false; error: string } {
  if (!isDevOtpEnabled()) {
    return { ok: false, error: 'سرویس پیامک هنوز فعال نشده است.' };
  }
  const expected = devOtpCode();
  if (!expected || code.trim() !== expected) {
    return { ok: false, error: 'کد تأیید اشتباه است.' };
  }
  return { ok: true };
}
