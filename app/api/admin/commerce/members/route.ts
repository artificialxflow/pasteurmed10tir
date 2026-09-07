import { mapMember, mapMembershipApplication } from '@/lib/commerce/mappers';
import { getOrCreateWallet } from '@/lib/commerce/wallet-service';
import { LOAN_DOC_REQUIRED_KINDS } from '@/lib/loan-documents/constants';
import { mapLoanDocumentPublic } from '@/lib/loan-documents/storage';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const [members, applications] = await Promise.all([
    prisma.member.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.membershipApplication.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { documents: { where: { deletedAt: null } } },
    }),
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
    applications: applications.map((app) => {
      const documents = (app.documents || []).map(mapLoanDocumentPublic);
      const requiredReady = LOAN_DOC_REQUIRED_KINDS.filter((k) =>
        documents.some((d) => d.kind === k),
      ).length;
      return {
        ...mapMembershipApplication(app),
        documents,
        requiredDocumentsReady: requiredReady,
        requiredDocumentsTotal: LOAN_DOC_REQUIRED_KINDS.length,
      };
    }),
  });
}
