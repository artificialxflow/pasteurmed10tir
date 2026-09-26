import { jsonError } from '@/lib/auth/api-utils';
import { buildFollowUpWhere, parseFollowUpTab } from '@/lib/admin/follow-up-service';
import {
  buildFollowUpCsv,
  buildFollowUpReportPdfHtml,
  buildFollowUpXlsx,
} from '@/lib/admin/follow-up-export';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('followUp');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format')?.toLowerCase() || 'xlsx';
  const tab = parseFollowUpTab(searchParams.get('tab') || 'completed');
  const where = buildFollowUpWhere(tab, {
    followUpDate: searchParams.get('followUpDate') ?? undefined,
    serviceCategory: searchParams.get('serviceCategory') ?? undefined,
    search: searchParams.get('q') ?? undefined,
  });

  const rows = await prisma.followUpCase.findMany({
    where,
    orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
    take: 5000,
  });

  if (format === 'pdf' || format === 'html') {
    const html = buildFollowUpReportPdfHtml(rows, 'گزارش فالوآپ');
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline; filename="follow-up-report.html"',
      },
    });
  }

  if (format === 'csv') {
    const body = buildFollowUpCsv(rows);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="follow-up-report.csv"',
      },
    });
  }

  if (format === 'xlsx' || format === 'excel') {
    const body = await buildFollowUpXlsx(rows);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="follow-up-report.xlsx"',
      },
    });
  }

  return jsonError('فرمت پشتیبانی نمی‌شود.');
}
