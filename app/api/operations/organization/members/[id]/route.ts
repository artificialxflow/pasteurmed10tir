import { jsonError } from '@/lib/auth/api-utils';
import { requireOrganizationForUser } from '@/lib/org/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const org = await requireOrganizationForUser(auth.session.userId).catch((e: Error) => e);
  if (org instanceof Error) return jsonError(org.message, 404);
  const { id } = await context.params;
  await prisma.organizationMember.deleteMany({
    where: { id, organizationId: org.id },
  });
  return NextResponse.json({ ok: true });
}
