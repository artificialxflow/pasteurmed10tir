import { mapMember, mapMembershipApplication } from '@/lib/commerce/mappers';
import { getOrCreateWallet } from '@/lib/commerce/wallet-service';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const [members, applications] = await Promise.all([
    prisma.member.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.membershipApplication.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  const items = [];
  for (const m of members) {
    const wallet = await getOrCreateWallet(m.patientPhone);
    items.push({
      ...mapMember(m),
      walletCeiling: wallet?.ceiling ?? null,
    });
  }

  return NextResponse.json({
    members: items,
    applications: applications.map(mapMembershipApplication),
  });
}
