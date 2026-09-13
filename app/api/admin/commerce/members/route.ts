import { mapMember, mapMembershipApplication } from '@/lib/commerce/mappers';
import { getOrCreateWallet } from '@/lib/commerce/wallet-service';
import { LOAN_DOC_REQUIRED_KINDS } from '@/lib/loan-documents/constants';
import { mapLoanDocumentPublic } from '@/lib/loan-documents/storage';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const fromRaw = searchParams.get('from');
  const toRaw = searchParams.get('to');
  const fromDate = fromRaw ? new Date(fromRaw) : null;
  const toDate = toRaw ? new Date(toRaw) : null;
  const hasFrom = Boolean(fromDate && !Number.isNaN(fromDate.getTime()));
  const hasTo = Boolean(toDate && !Number.isNaN(toDate.getTime()));

  const createdAt =
    hasFrom || hasTo
      ? {
          ...(hasFrom ? { gte: fromDate! } : {}),
          ...(hasTo ? { lte: new Date(toDate!.getTime() + 24 * 60 * 60 * 1000 - 1) } : {}),
        }
      : undefined;

  const [members, applications] = await Promise.all([
    prisma.member.findMany({
      where: {
        ...(status && status !== 'all' ? { status } : {}),
        ...(createdAt ? { createdAt } : {}),
      },
      orderBy: { createdAt: 'desc' },
    }),
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

  const paid = items.filter((m) => m.status === 'paid');
  const summary = {
    count: items.length,
    paidCount: paid.length,
    totalAmount: items.reduce((sum, m) => sum + Number(m.amount || 0), 0),
    paidAmount: paid.reduce((sum, m) => sum + Number(m.amount || 0), 0),
  };

  return NextResponse.json({
    members: items,
    summary,
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
