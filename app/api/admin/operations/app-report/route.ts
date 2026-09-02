import { jsonError } from '@/lib/auth/api-utils';
import {
  buildAppReportCsv,
  buildAppReportPdfHtml,
  buildAppReportXlsx,
} from '@/lib/admin/app-report-export';
import {
  buildAppOverviewMetrics,
  buildAppReportRows,
  type AppOverviewStats,
} from '@/lib/admin/app-report';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

async function loadAppOverviewStats(): Promise<AppOverviewStats> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    usersTotal,
    usersPending,
    usersApproved,
    usersRejected,
    usersWithNationalId,
    bookingsTotal,
    bookingsConfirmed,
    bookingsToday,
    consultationsTotal,
    insurancePending,
    complaintsNew,
    supportOpen,
    membersPaid,
    loanApplicationsPending,
    facilityPending,
    installmentsActive,
    commissionsPending,
    clubProfiles,
    visitors,
    reviewsPending,
  ] = await Promise.all([
    prisma.patientProfile.count(),
    prisma.patientProfile.count({ where: { status: 'pending' } }),
    prisma.patientProfile.count({ where: { status: 'approved' } }),
    prisma.patientProfile.count({ where: { status: 'rejected' } }),
    prisma.patientProfile.count({
      where: {
        AND: [{ nationalId: { not: null } }, { nationalId: { not: '' } }],
      },
    }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'confirmed' } }),
    prisma.booking.count({
      where: {
        status: 'confirmed',
        OR: [
          { createdAt: { gte: startOfToday } },
          { appointmentAt: { gte: startOfToday } },
        ],
      },
    }),
    prisma.consultation.count(),
    prisma.insuranceInquiry.count({ where: { status: 'pending' } }),
    prisma.complaint.count({ where: { status: 'new' } }),
    prisma.supportTicket.count({ where: { status: { not: 'closed' } } }),
    prisma.member.count({ where: { status: 'paid' } }),
    prisma.membershipApplication.count({
      where: {
        status: 'pending',
        OR: [{ loanAmount: { gt: 0 } }, { source: 'loan-request' }],
      },
    }),
    prisma.facilityRequest.count({ where: { status: 'pending' } }),
    prisma.installmentPlan.count({
      where: { status: 'active', source: { not: 'membership' } },
    }),
    prisma.commission.count({ where: { status: { not: 'paid' } } }),
    prisma.clubProfile.count(),
    prisma.visitor.count(),
    prisma.doctorReview.count({ where: { status: 'pending' } }),
  ]);

  const base = {
    users: {
      total: usersTotal,
      pending: usersPending,
      approved: usersApproved,
      rejected: usersRejected,
      withNationalId: usersWithNationalId,
    },
    operations: {
      bookingsTotal,
      bookingsConfirmed,
      bookingsToday,
      consultationsTotal,
      insurancePending,
      complaintsNew,
      supportOpen,
    },
    commerce: {
      membersPaid,
      loanApplicationsPending,
      facilityPending,
      installmentsActive,
      commissionsPending,
    },
    engagement: {
      clubProfiles,
      visitors,
      reviewsPending,
    },
  };

  return {
    generatedAt: new Date().toISOString(),
    metrics: buildAppOverviewMetrics(base),
    ...base,
  };
}

function reportFilename(ext: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `app-report-${stamp}.${ext}`;
}

export async function GET(request: Request) {
  const auth = await requireAdmin('dashboard');
  if (auth.error) return auth.error;

  const format = (new URL(request.url).searchParams.get('format') || 'json').toLowerCase();
  const stats = await loadAppOverviewStats();

  if (format === 'json') {
    return NextResponse.json(stats);
  }

  const rows = buildAppReportRows(stats);
  const reportTitle = 'گزارش استاندارد اپلیکیشن';

  if (format === 'pdf') {
    const html = buildAppReportPdfHtml(rows, reportTitle);
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${reportFilename('html')}"`,
      },
    });
  }

  if (format === 'csv') {
    const body = buildAppReportCsv(rows);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${reportFilename('csv')}"`,
      },
    });
  }

  if (format === 'xlsx' || format === 'excel') {
    const body = await buildAppReportXlsx(rows, reportTitle);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${reportFilename('xlsx')}"`,
      },
    });
  }

  return jsonError('فرمت گزارش پشتیبانی نمی‌شود.');
}
