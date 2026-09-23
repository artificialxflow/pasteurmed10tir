import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; memberId: string }> },
) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;
  const { id, memberId } = await context.params;

  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: id },
  });
  if (!member) return jsonError('عضو یافت نشد.', 404);

  const body = await parseJson<{
    name?: string;
    phone?: string;
    nationalId?: string | null;
    membershipPaid?: boolean;
    membershipAmount?: number | null;
  }>(request);

  const name = body?.name !== undefined ? body.name.trim() : member.name;
  if (name.length < 2) return jsonError('نام عضو را وارد کنید.');

  const phone =
    body?.phone !== undefined ? normalizePhoneDigits(body.phone) : member.phone;
  if (phone.length < 10) return jsonError('موبایل عضو معتبر نیست.');

  const paid =
    body?.membershipPaid !== undefined ? Boolean(body.membershipPaid) : member.membershipPaid;
  const amount =
    body?.membershipAmount !== undefined
      ? body.membershipAmount == null
        ? null
        : Math.max(0, Math.round(Number(body.membershipAmount)))
      : member.membershipAmount;

  const row = await prisma.organizationMember.update({
    where: { id: memberId },
    data: {
      name,
      phone,
      nationalId:
        body?.nationalId !== undefined
          ? (body.nationalId || '').trim() || null
          : member.nationalId,
      membershipPaid: paid,
      membershipAmount: paid ? amount : amount,
      lastPaidAt: paid ? member.lastPaidAt || new Date() : null,
    },
  });

  return NextResponse.json({ member: row });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; memberId: string }> },
) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;
  const { id, memberId } = await context.params;
  await prisma.organizationMember.deleteMany({
    where: { id: memberId, organizationId: id },
  });
  return NextResponse.json({ ok: true });
}
