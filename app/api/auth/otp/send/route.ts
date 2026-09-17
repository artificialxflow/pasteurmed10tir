import { requestOtp } from '@/lib/auth/otp-service';
import { jsonError } from '@/lib/auth/api-utils';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { phone?: string } | null;
  const result = await requestOtp(body?.phone ?? '');
  if (!result.ok) return jsonError(result.error, result.status);
  const phone = normalizePhone(body?.phone ?? '');
  const existing = phone
    ? await prisma.user.findUnique({ where: { phone }, select: { id: true } })
    : null;
  return NextResponse.json({
    ok: true,
    message: result.message,
    mode: result.mode,
    registered: Boolean(existing),
  });
}
