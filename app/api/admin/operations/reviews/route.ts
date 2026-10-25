import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapServiceReview } from '@/lib/home-visit/mappers';
import { updateServiceReviewStatus } from '@/lib/home-visit/service';
import { mapDoctorReview } from '@/lib/operations/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import type { ReviewStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

function reviewSubmitterLabel(input: {
  patientPhone: string;
  user?: { name?: string | null } | null;
  source?: string;
}): string {
  if (input.source === 'follow_up') return 'فالوآپ (بدون نام در سایت)';
  const name = input.user?.name?.trim();
  if (name) return `${name} (${input.patientPhone})`;
  return input.patientPhone;
}

function syncLegacyStatus(ratingStatus: ReviewStatus, commentStatus: ReviewStatus): ReviewStatus {
  if (ratingStatus === 'hidden' && commentStatus === 'hidden') return 'hidden';
  if (ratingStatus === 'approved' && commentStatus === 'approved') return 'approved';
  return 'pending';
}

export async function GET() {
  const auth = await requireAdmin('reviews');
  if (auth.error) return auth.error;

  const rows = await prisma.doctorReview.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { include: { profile: true } } },
  });
  const serviceRows = await prisma.serviceReview.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { include: { profile: true } } },
  });

  const items = rows.map((row) => ({
    ...mapDoctorReview(row),
    patientName: row.user?.name?.trim() || undefined,
    submittedBy: reviewSubmitterLabel({
      patientPhone: row.patientPhone,
      user: row.user,
      source: row.source,
    }),
  }));

  const serviceReviews = serviceRows.map((row) => ({
    ...mapServiceReview(row),
    patientName: row.user?.name?.trim() || undefined,
    submittedBy: reviewSubmitterLabel({ patientPhone: row.patientPhone, user: row.user }),
  }));

  return NextResponse.json({ items, serviceReviews });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('reviews');
  if (auth.error) return auth.error;

  const body = await parseJson<{
    id?: string;
    status?: string;
    ratingStatus?: string;
    commentStatus?: string;
    kind?: string;
  }>(request);
  if (!body?.id) return jsonError('شناسه الزامی است.');

  const parseStatus = (raw?: string): ReviewStatus | undefined => {
    if (raw === 'approved' || raw === 'hidden' || raw === 'pending') return raw;
    return undefined;
  };

  if (body.kind === 'service') {
    const legacy = parseStatus(body.status);
    if (!legacy) return jsonError('وضعیت نامعتبر است.');
    const item = await updateServiceReviewStatus(body.id, legacy);
    return NextResponse.json({ item });
  }

  const existing = await prisma.doctorReview.findUnique({ where: { id: body.id } });
  if (!existing) return jsonError('نظر یافت نشد.', 404);

  let ratingStatus = existing.ratingStatus;
  let commentStatus = existing.commentStatus;

  const nextRating = parseStatus(body.ratingStatus);
  const nextComment = parseStatus(body.commentStatus);
  const legacy = parseStatus(body.status);

  if (legacy && !nextRating && !nextComment) {
    ratingStatus = legacy;
    commentStatus = legacy;
  } else {
    if (nextRating) ratingStatus = nextRating;
    if (nextComment) commentStatus = nextComment;
  }

  const row = await prisma.doctorReview.update({
    where: { id: body.id },
    data: {
      ratingStatus,
      commentStatus,
      status: syncLegacyStatus(ratingStatus, commentStatus),
    },
  });

  return NextResponse.json({ item: mapDoctorReview(row) });
}
