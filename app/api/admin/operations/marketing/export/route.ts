import { buildAdminMarketingWhere } from '@/lib/marketing/service';
import { buildMarketingCsv, buildMarketingXlsx } from '@/lib/admin/marketing-export';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('visitors');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format')?.toLowerCase() || 'xlsx';

  const where = buildAdminMarketingWhere({
    visitorId: searchParams.get('visitorId'),
    kind: searchParams.get('kind'),
    blockedOnly: searchParams.get('blocked') === '1',
    from: searchParams.get('from'),
    to: searchParams.get('to'),
  });

  const rows = await prisma.marketingReport.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    take: 5000,
    include: {
      visitor: { select: { name: true } },
      followUpSlots: { orderBy: { slotIndex: 'asc' } },
    },
  });

  if (format === 'csv') {
    const body = buildMarketingCsv(rows);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="marketing-reports.csv"',
      },
    });
  }

  const body = await buildMarketingXlsx(rows);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="marketing-reports.xlsx"',
    },
  });
}
