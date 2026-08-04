import { mapDbToPatientProfile } from '@/lib/auth/patient-db';
import { getPatientSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ profile: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true },
  });
  if (!user) {
    return NextResponse.json({ profile: null }, { status: 401 });
  }

  return NextResponse.json({ profile: mapDbToPatientProfile(user) });
}
