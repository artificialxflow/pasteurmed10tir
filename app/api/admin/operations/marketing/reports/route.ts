import {
  computeMarketingSuccessRates,
  getMarketingReportAdmin,
  listMarketingReportsAdmin,
} from '@/lib/marketing/service';
import { requireAdmin } from '@/lib/content/require-admin';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('visitors');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  try {
    if (mode === 'stats') {
      const items = await computeMarketingSuccessRates();
      const overall = items.reduce(
        (acc, row) => {
          acc.success += row.successCount;
          acc.unsuccessful += row.unsuccessfulCount;
          acc.followUp += row.followUpCount;
          acc.total += row.totalActivity;
          return acc;
        },
        { success: 0, unsuccessful: 0, followUp: 0, total: 0 },
      );
      const denom = overall.success + overall.unsuccessful + overall.followUp;
      const overallSuccessRate =
        denom > 0 ? Math.round((overall.success / denom) * 100) : null;
      return NextResponse.json({ items, overallSuccessRate });
    }

    const items = await listMarketingReportsAdmin({
      visitorId: searchParams.get('visitorId'),
      kind: searchParams.get('kind'),
      blockedOnly: searchParams.get('blocked') === '1',
      from: searchParams.get('from'),
      to: searchParams.get('to'),
    });
    return NextResponse.json({ items });
  } catch (e) {
    return prismaRouteError(e, 'admin/marketing/reports GET');
  }
}
