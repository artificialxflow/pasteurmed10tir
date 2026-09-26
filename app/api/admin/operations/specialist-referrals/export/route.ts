import { jsonError } from '@/lib/auth/api-utils';
import {
  buildReferralsCsv,
  buildReferralsXlsx,
} from '@/lib/admin/follow-up-export';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('specialistReferrals');
  if (auth.error) return auth.error;

  const format = new URL(request.url).searchParams.get('format')?.toLowerCase() || 'xlsx';
  const rows = await prisma.specialistReferral.findMany({ orderBy: { createdAt: 'desc' } });

  if (format === 'csv') {
    const body = buildReferralsCsv(rows);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="specialist-referrals.csv"',
      },
    });
  }

  if (format === 'xlsx' || format === 'excel') {
    const body = await buildReferralsXlsx(rows);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="specialist-referrals.xlsx"',
      },
    });
  }

  return jsonError('فرمت پشتیبانی نمی‌شود.');
}
