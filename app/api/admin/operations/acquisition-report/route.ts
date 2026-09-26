import { jsonError } from '@/lib/auth/api-utils';
import {
  buildAcquisitionReportCsv,
  buildAcquisitionReportPdfHtml,
  buildAcquisitionReportXlsx,
} from '@/lib/admin/acquisition-report-export';
import {
  buildAcquisitionReportRows,
  parseAcquisitionReportRange,
  summarizeAcquisitionCounts,
  type AcquisitionReportStats,
} from '@/lib/admin/acquisition-report';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

async function loadAcquisitionReportStats(
  searchParams: URLSearchParams,
): Promise<AcquisitionReportStats> {
  const range = parseAcquisitionReportRange(searchParams);
  const createdAt =
    range.period === 'all'
      ? undefined
      : range.from != null
        ? { gte: range.from, lte: range.to }
        : { lte: range.to };

  const where = createdAt ? { createdAt } : {};

  const [grouped, totalProfiles] = await Promise.all([
    prisma.patientProfile.groupBy({
      by: ['acquisitionSource'],
      where,
      _count: { _all: true },
    }),
    prisma.patientProfile.count({ where }),
  ]);

  const mapped = grouped.map((g) => ({
    acquisitionSource: g.acquisitionSource,
    _count: g._count._all,
  }));
  const { withSource, withoutSource, counts } = summarizeAcquisitionCounts(mapped);

  return {
    generatedAt: new Date().toISOString(),
    periodLabel: range.periodLabel,
    period: range.period,
    from: range.from?.toISOString() ?? null,
    to: range.to.toISOString(),
    totalProfiles,
    withSource,
    withoutSource,
    rows: buildAcquisitionReportRows(counts),
  };
}

function reportFilename(ext: string, period: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `acquisition-report-${period}-${stamp}.${ext}`;
}

export async function GET(request: Request) {
  const auth = await requireAdmin('dashboard');
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const format = (url.searchParams.get('format') || 'json').toLowerCase();
  const stats = await loadAcquisitionReportStats(url.searchParams);

  if (format === 'json') {
    return NextResponse.json(stats);
  }

  const reportTitle = 'آمار نحوه آشنایی با ما';
  const periodKey = stats.period === 'custom' ? 'custom' : stats.period;

  if (format === 'pdf') {
    const html = buildAcquisitionReportPdfHtml(stats, reportTitle);
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${reportFilename('html', periodKey)}"`,
      },
    });
  }

  if (format === 'csv') {
    const body = buildAcquisitionReportCsv(stats);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${reportFilename('csv', periodKey)}"`,
      },
    });
  }

  if (format === 'xlsx' || format === 'excel') {
    const body = await buildAcquisitionReportXlsx(stats, reportTitle);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${reportFilename('xlsx', periodKey)}"`,
      },
    });
  }

  return jsonError('فرمت گزارش پشتیبانی نمی‌شود.');
}
