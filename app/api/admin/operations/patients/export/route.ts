import { jsonError } from '@/lib/auth/api-utils';
import {
  buildPatientCsv,
  buildPatientPdfHtml,
  buildPatientXlsx,
} from '@/lib/admin/patient-export';
import {
  buildPatientReportRows,
  filterPatientsForReport,
  patientReportStatusLabel,
  type PatientReportStatusFilter,
} from '@/lib/admin/patient-report';
import { mapDbToPatientProfile } from '@/lib/auth/patient-db';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const VALID_STATUS = new Set<PatientReportStatusFilter>([
  'all',
  'pending',
  'approved',
  'rejected',
]);

function reportFilename(status: PatientReportStatusFilter, ext: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `patients-${status}-${stamp}.${ext}`;
}

export async function GET(request: Request) {
  const auth = await requireAdmin('patients');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get('format') || 'xlsx').toLowerCase();
  const statusParam = searchParams.get('status') || 'all';
  const status = VALID_STATUS.has(statusParam as PatientReportStatusFilter)
    ? (statusParam as PatientReportStatusFilter)
    : 'all';
  const search = searchParams.get('q') || '';

  const [users, baseInsurances, complementaryInsurances] = await Promise.all([
    prisma.user.findMany({
      where: { profile: { isNot: null } },
      include: { profile: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.baseInsurance.findMany(),
    prisma.complementaryInsurance.findMany(),
  ]);

  const insuranceMap = new Map<string, string>();
  for (const item of [...baseInsurances, ...complementaryInsurances]) {
    insuranceMap.set(item.id, item.name);
  }
  const insuranceName = (id?: string) => {
    if (!id) return '—';
    return insuranceMap.get(id) || id;
  };

  const items = users.map((u) => mapDbToPatientProfile(u));
  const filtered = filterPatientsForReport(items, status, search);
  const rows = buildPatientReportRows(filtered, insuranceName);
  const reportTitle = `گزارش کاربران — ${patientReportStatusLabel(status)}`;

  if (format === 'pdf') {
    const html = buildPatientPdfHtml(rows, reportTitle);
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${reportFilename(status, 'html')}"`,
      },
    });
  }

  if (format === 'csv') {
    const body = buildPatientCsv(rows);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${reportFilename(status, 'csv')}"`,
      },
    });
  }

  if (format === 'xlsx' || format === 'excel') {
    const body = await buildPatientXlsx(rows, reportTitle);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${reportFilename(status, 'xlsx')}"`,
      },
    });
  }

  return jsonError('فرمت گزارش پشتیبانی نمی‌شود.');
}
