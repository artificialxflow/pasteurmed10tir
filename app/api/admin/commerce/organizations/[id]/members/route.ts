import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;
  const { id } = await context.params;

  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) return jsonError('سازمان یافت نشد.', 404);

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
