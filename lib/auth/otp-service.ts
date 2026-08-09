import { createHash, randomInt } from 'crypto';
import { isDevOtpEnabled, devOtpPhone, validateDevOtpSend } from '@/lib/auth/otp';
import { prisma } from '@/lib/prisma';
import { isSmsConfigured, sendOtpSms } from '@/lib/sms/client';
import { normalizePhone } from '@/lib/utils';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashOtp(phone: string, code: string): string {
  const secret = process.env.SESSION_SECRET || 'pasteur-dev-insecure-secret';
  return createHash('sha256').update(`${phone}:${code}:${secret}`).digest('hex');
}

function generateCode(): string {
  return String(randomInt(10000, 99999));
}

export function isOtpServiceReady(): boolean {
  return isSmsConfigured() || isDevOtpEnabled();
}

export async function requestOtp(
  phoneRaw: string,
): Promise<{ ok: true; message: string; mode: 'sms' | 'dev' } | { ok: false; error: string; status: number }> {
  const phone = normalizePhone(phoneRaw);
  if (!phone || phone.length < 10) {
    return { ok: false, error: 'شماره موبایل معتبر نیست.', status: 400 };
  }

  const allowedDev = devOtpPhone();
  const isDevPhone = Boolean(allowedDev && phone === allowedDev && isDevOtpEnabled());

  // Dedicated test phone: no real SMS, classic DEV path
  if (isDevPhone) {
    const check = validateDevOtpSend(phone);
    if (!check.ok) return { ok: false, error: check.error, status: 400 };
    return { ok: true, message: 'کد تأیید ارسال شد (حالت توسعه).', mode: 'dev' };
  }

  if (!isSmsConfigured()) {
    if (isDevOtpEnabled()) {
      return {
        ok: false,
        error: 'در فاز توسعه فقط شماره مجاز قابل استفاده است. پیامک واقعی پیکربندی نشده.',
        status: 400,
      };
    }
    return { ok: false, error: 'سرویس پیامک هنوز فعال نشده است.', status: 503 };
  }

  const recent = await prisma.otpChallenge.findFirst({
    where: { phone },
    orderBy: { createdAt: 'desc' },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < OTP_COOLDOWN_MS) {
    const waitSec = Math.ceil(
      (OTP_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000,
    );
    return {
      ok: false,
      error: `لطفاً ${waitSec} ثانیه دیگر دوباره تلاش کنید.`,
      status: 429,
    };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpChallenge.deleteMany({ where: { phone } });
  await prisma.otpChallenge.create({
    data: {
      phone,
      codeHash: hashOtp(phone, code),
      expiresAt,
    },
  });

  const sent = await sendOtpSms(phone, code);
  if (!sent.ok) {
    await prisma.otpChallenge.deleteMany({ where: { phone } });
    return { ok: false, error: sent.error || 'ارسال پیامک ناموفق بود.', status: 502 };
  }

  return { ok: true, message: 'کد تأیید پیامک شد.', mode: 'sms' };
}

export async function verifyOtpCode(
  phoneRaw: string,
  codeRaw: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const phone = normalizePhone(phoneRaw);
  const code = codeRaw.trim();
  if (!phone || !code) return { ok: false, error: 'کد تأیید را وارد کنید.' };

  const allowedDev = devOtpPhone();
  if (isDevOtpEnabled() && allowedDev && phone === allowedDev) {
    const expected = process.env.DEV_OTP_CODE?.trim();
    if (expected && code === expected) return { ok: true };
    return { ok: false, error: 'کد تأیید اشتباه است.' };
  }

  const row = await prisma.otpChallenge.findFirst({
    where: { phone },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) return { ok: false, error: 'ابتدا درخواست کد تأیید بدهید.' };
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.otpChallenge.delete({ where: { id: row.id } });
    return { ok: false, error: 'کد منقضی شده است. دوباره درخواست دهید.' };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: 'تعداد تلاش بیش از حد مجاز است. دوباره کد بگیرید.' };
  }

  const match = row.codeHash === hashOtp(phone, code);
  if (!match) {
    await prisma.otpChallenge.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: 'کد تأیید اشتباه است.' };
  }

  await prisma.otpChallenge.deleteMany({ where: { phone } });
  return { ok: true };
}
