import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireOrganizationForUser } from '@/lib/org/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const org = await requireOrganizationForUser(auth.session.userId).catch((e: Error) => e);
  if (org instanceof Error) return jsonError(org.message, 404);

  const body = await parseJson<{ name?: string; phone?: string; nationalId?: string }>(request);
  const name = (body?.name || '').trim();
  const phone = normalizePhoneDigits(body?.phone || '');
  const nationalId = (body?.nationalId || '').trim() || null;
  if (name.length < 2) return jsonError('نام عضو را وارد کنید.');
  if (phone.length < 10) return jsonError('موبایل عضو معتبر نیست.');

  const member = await prisma.organizationMember.create({
    data: { organizationId: org.id, name, phone, nationalId },
  });
  return NextResponse.json({ member }, { status: 201 });
}
