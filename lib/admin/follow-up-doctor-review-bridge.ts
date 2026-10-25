import { FOLLOW_UP_UNKNOWN_DENTIST } from '@/lib/follow-up/types';
import { generateOperationId } from '@/lib/operations/mappers';
import { prisma } from '@/lib/prisma';
import type { FollowUpCase } from '@prisma/client';

/** پل خودکار: امتیاز رضایت دکتر در فالوآپ → میانگین سایت (بدون نام)؛ یادداشت → نظر در انتظار تأیید */
export async function bridgeFollowUpDoctorRatingToReview(row: FollowUpCase): Promise<void> {
  if (row.satisfactionDoctor == null || row.satisfactionDoctor < 1) return;
  if (!row.doctorName || row.doctorName === FOLLOW_UP_UNKNOWN_DENTIST) return;

  const dentist = await prisma.dentist.findFirst({
    where: { name: { equals: row.doctorName, mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  if (!dentist) return;

  const doctorId = String(dentist.id);
  const since = new Date(row.createdAt.getTime() - 60_000);
  const until = new Date(row.createdAt.getTime() + 60_000);
  const duplicate = await prisma.doctorReview.findFirst({
    where: {
      source: 'follow_up',
      patientPhone: row.patientPhone,
      doctorId,
      rating: row.satisfactionDoctor,
      createdAt: { gte: since, lte: until },
    },
  });
  if (duplicate) return;

  const noteText = row.notes?.trim() || '';
  const hasComment = noteText.length > 0;

  await prisma.doctorReview.create({
    data: {
      id: generateOperationId(),
      patientPhone: row.patientPhone,
      doctorId,
      doctorName: dentist.name,
      doctorKind: 'dental',
      rating: row.satisfactionDoctor,
      comment: hasComment ? noteText : '',
      source: 'follow_up',
      showSubmitterOnSite: false,
      ratingStatus: 'approved',
      commentStatus: hasComment ? 'pending' : 'hidden',
      status: hasComment ? 'pending' : 'approved',
    },
  });
}
