import { mapUserProfileWithOrg } from '@/lib/auth/map-profile-org';
import { getPatientSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ profile: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true },
  });
  if (!user) {
    return NextResponse.json({ profile: null });
  }

  return NextResponse.json({ profile: await mapUserProfileWithOrg(user) });
}
