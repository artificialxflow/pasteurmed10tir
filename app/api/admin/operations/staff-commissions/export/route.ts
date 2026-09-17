import { jsonError } from '@/lib/auth/api-utils';
import {
  buildStaffCommissionCsv,
  buildStaffCommissionPdfHtml,
  buildStaffCommissionXlsx,
} from '@/lib/admin/staff-commission-export';
import { requireAdminAny } from '@/lib/content/require-admin';
import { listStaffCommissions } from '@/lib/home-visit/service';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

function reportFilename(ext: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `staff-commissions-${stamp}.${ext}`;
}

export async function GET(request: Request) {
  const auth = await requireAdminAny(['fieldStaff', 'commissions']);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get('format') || 'xlsx').toLowerCase();

  try {
    const result = await listStaffCommissions({
      kind: searchParams.get('kind') || undefined,
      status: searchParams.get('status') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
    });
    const rows = result.items;
    const title = 'گزارش پورسانت نیرو';

    if (format === 'pdf') {
      const html = buildStaffCommissionPdfHtml(rows, title);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="${reportFilename('html')}"`,
        },
      });
    }

    if (format === 'csv') {
      const body = buildStaffCommissionCsv(rows);
      return new NextResponse(new Uint8Array(body), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${reportFilename('csv')}"`,
        },
      });
    }

    if (format === 'xlsx' || format === 'excel') {
      const body = await buildStaffCommissionXlsx(rows, title);
      return new NextResponse(new Uint8Array(body), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${reportFilename('xlsx')}"`,
        },
      });
    }

    return jsonError('فرمت گزارش پشتیبانی نمی‌شود.');
  } catch (e) {
    return prismaRouteError(e, 'admin/staff-commissions export GET');
  }
}
