import { requestOtp } from '@/lib/auth/otp-service';
import { jsonError } from '@/lib/auth/api-utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { phone?: string } | null;
  const result = await requestOtp(body?.phone ?? '');
  if (!result.ok) return jsonError(result.error, result.status);
  return NextResponse.json({ ok: true, message: result.message, mode: result.mode });
}
