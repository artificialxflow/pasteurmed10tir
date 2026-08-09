import { mapDbToPatientProfile } from '@/lib/auth/patient-db';
import { verifyOtpCode } from '@/lib/auth/otp-service';
import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { setPatientSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/utils';
import { NextResponse } from 'next/server';

type Body = { phone?: string; code?: string; name?: string };

export async function POST(request: Request) {
  const body = await parseJson<Body>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const phone = normalizePhone(body.phone ?? '');
  const code = (body.code ?? '').trim();
  const name = (body.name ?? '').trim();

  if (!phone || phone.length < 10) return jsonError('شماره موبایل معتبر نیست.');
  if (!name) return jsonError('نام را وارد کنید.');
  if (!code) return jsonError('کد تأیید را وارد کنید.');

  const check = await verifyOtpCode(phone, code);
  if (!check.ok) return jsonError(check.error);

  const user = await prisma.user.upsert({
    where: { phone },
    create: { phone, name },
    update: { name },
    include: { profile: true },
  });

  if (!user.profile) {
    await prisma.patientProfile.create({
      data: { userId: user.id, franchisePercent: 30, status: 'pending' },
    });
  }

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });
  if (!fresh) return jsonError('خطا در ایجاد کاربر.', 500);

  await setPatientSession({ userId: fresh.id, phone: fresh.phone });

  return NextResponse.json({ profile: mapDbToPatientProfile(fresh) });
}
