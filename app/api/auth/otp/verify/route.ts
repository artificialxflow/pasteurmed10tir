import { mapUserProfileWithOrg } from '@/lib/auth/map-profile-org';
import { verifyOtpCode } from '@/lib/auth/otp-service';
import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { setPatientSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { parseAcquisitionSource } from '@/lib/patient/acquisition-source';
import { normalizePhone } from '@/lib/utils';
import { NextResponse } from 'next/server';

type Body = {
  phone?: string;
  code?: string;
  name?: string;
  loginKind?: 'person' | 'organization';
  organizationName?: string;
  acquisitionSource?: string;
};

export async function POST(request: Request) {
  const body = await parseJson<Body>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const phone = normalizePhone(body.phone ?? '');
  const code = (body.code ?? '').trim();
  const name = (body.name ?? '').trim();
  const loginKind = body.loginKind === 'organization' ? 'organization' : 'person';
  const organizationName = (body.organizationName ?? '').trim();

  if (!phone || phone.length < 10) return jsonError('شماره موبایل معتبر نیست.');
  if (!code) return jsonError('کد تأیید را وارد کنید.');

  const check = await verifyOtpCode(phone, code);
  if (!check.ok) return jsonError(check.error);

  const existing = await prisma.user.findUnique({
    where: { phone },
    include: { organization: true },
  });
  if (!existing && !name) {
    return jsonError(
      loginKind === 'organization'
        ? 'برای ثبت سازمان، نام نماینده را وارد کنید.'
        : 'برای ثبت‌نام، نام و نام خانوادگی را وارد کنید.',
    );
  }
  if (loginKind === 'organization' && !existing?.organization && !organizationName) {
    return jsonError('نام سازمان را وارد کنید.');
  }

  const isNewPerson = !existing && loginKind === 'person';
  const acquisitionSource = parseAcquisitionSource(body.acquisitionSource);
  if (isNewPerson && !acquisitionSource) {
    return jsonError('لطفاً نحوه آشنایی با ما را انتخاب کنید.');
  }

  const user = await prisma.user.upsert({
    where: { phone },
    create: { phone, name },
    update: name ? { name } : {},
    include: { profile: true, organization: true },
  });

  if (!user.profile) {
    await prisma.patientProfile.create({
      data: {
        userId: user.id,
        franchisePercent: 30,
        status: 'pending',
        ...(isNewPerson && acquisitionSource ? { acquisitionSource } : {}),
      },
    });
  }

  if (loginKind === 'organization' && !user.organization && organizationName) {
    await prisma.organization.create({
      data: { name: organizationName, representativeUserId: user.id },
    });
  }

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });
  if (!fresh) return jsonError('خطا در ایجاد کاربر.', 500);

  await setPatientSession({ userId: fresh.id, phone: fresh.phone });

  return NextResponse.json({ profile: await mapUserProfileWithOrg(fresh) });
}
