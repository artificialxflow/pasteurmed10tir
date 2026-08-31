import { jsonError } from '@/lib/auth/api-utils';
import {
  buildInstallmentReportRows,
  filterInstallmentPlansForReport,
  installmentReportSourceLabel,
  type InstallmentReportSource,
} from '@/lib/admin/installment-report';
import {
  buildInstallmentCsv,
  buildInstallmentPdfHtml,
  buildInstallmentXlsx,
} from '@/lib/admin/installment-export';
import { mapInstallmentPlan } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const VALID_SOURCES = new Set<InstallmentReportSource>([
  'all',
  'loan',
  'facility',
  'credit',
  'legacy-membership',
]);

function reportFilename(source: InstallmentReportSource, ext: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `installments-${source}-${stamp}.${ext}`;
}

export async function GET(request: Request) {
  const auth = await requireAdmin('installments');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get('format') || 'xlsx').toLowerCase();
  const sourceParam = searchParams.get('source') || 'all';
  const source = VALID_SOURCES.has(sourceParam as InstallmentReportSource)
    ? (sourceParam as InstallmentReportSource)
    : 'all';

  const [visibleRows, rawRows] = await Promise.all([
    prisma.installmentPlan.findMany({
      where: { status: { not: 'hidden' }, source: { not: 'membership' } },
      include: {
        scheduleItems: { orderBy: { index: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.installmentPlan.findMany({
      include: {
        scheduleItems: { orderBy: { index: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const items = visibleRows.map(mapInstallmentPlan);
  const rawItems = rawRows.map(mapInstallmentPlan);
  const filtered = filterInstallmentPlansForReport(items, rawItems, source);
  const rows = buildInstallmentReportRows(filtered);
  const reportTitle = `گزارش اقساط — ${installmentReportSourceLabel(source)}`;

  if (format === 'pdf') {
    const html = buildInstallmentPdfHtml(rows, reportTitle);
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${reportFilename(source, 'html')}"`,
      },
    });
  }

  if (format === 'csv') {
    const body = buildInstallmentCsv(rows);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${reportFilename(source, 'csv')}"`,
      },
    });
  }

  if (format === 'xlsx' || format === 'excel') {
    const body = await buildInstallmentXlsx(rows, reportTitle);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${reportFilename(source, 'xlsx')}"`,
      },
    });
  }

  return jsonError('فرمت گزارش پشتیبانی نمی‌شود.');
}
