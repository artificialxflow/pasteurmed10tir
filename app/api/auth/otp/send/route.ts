import { validateDevOtpSend } from '@/lib/auth/otp';
import { jsonError } from '@/lib/auth/api-utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { phone?: string } | null;
  const phone = body?.phone ?? '';
  const result = validateDevOtpSend(phone);
  if (!result.ok) return jsonError(result.error, result.error.includes('پیامک') ? 503 : 400);
  return NextResponse.json({ ok: true, message: 'کد تأیید ارسال شد (حالت توسعه).' });
}
