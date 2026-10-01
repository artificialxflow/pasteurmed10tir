import { createHash, randomBytes } from 'crypto';
import type { Consultation, ConsultationVideoStatus } from '@prisma/client';
import { mintJitsiJwt } from '@/lib/jitsi/jwt';
import { prisma } from '@/lib/prisma';

export function newOpaqueVideoRoomName(consultationId: string): string {
  const digest = createHash('sha256')
    .update(`pasteur-meet:${consultationId}`)
    .update(randomBytes(8))
    .digest('hex')
    .slice(0, 28);
  return `pp${digest}`;
}

export async function ensureConsultationVideoRoom(
  consultationId: string,
): Promise<{ row: Consultation; room: string }> {
  const existing = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!existing) throw new Error('مشاوره یافت نشد.');

  if (existing.videoRoomName) {
    return { row: existing, room: existing.videoRoomName };
  }

  const room = newOpaqueVideoRoomName(consultationId);
  const row = await prisma.consultation.update({
    where: { id: consultationId },
    data: { videoRoomName: room },
  });
  return { row, room };
}

export async function openConsultationVideoSession(consultationId: string): Promise<Consultation> {
  const existing = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!existing) throw new Error('مشاوره یافت نشد.');
  if (existing.videoStatus === 'completed') {
    throw new Error('جلسه ویدیو این مشاوره پایان یافته است.');
  }

  const room = existing.videoRoomName || newOpaqueVideoRoomName(consultationId);
  const nextStatus: ConsultationVideoStatus =
    existing.videoStatus === 'in_call' ? 'in_call' : 'scheduled';

  return prisma.consultation.update({
    where: { id: consultationId },
    data: {
      videoRoomName: room,
      videoStatus: nextStatus,
    },
  });
}

export async function completeConsultationVideoSession(
  consultationId: string,
): Promise<Consultation> {
  const existing = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!existing) throw new Error('مشاوره یافت نشد.');
  return prisma.consultation.update({
    where: { id: consultationId },
    data: { videoStatus: 'completed' },
  });
}

const JOINABLE: ConsultationVideoStatus[] = ['scheduled', 'in_call'];

export function canJoinConsultationVideo(status: ConsultationVideoStatus): boolean {
  return JOINABLE.includes(status);
}

export async function mintConsultationVideoAccess(input: {
  consultationId: string;
  sub: string;
  displayName: string;
  moderator: boolean;
}): Promise<{
  room: string;
  jwt: string;
  url: string;
  expiresAt: string;
  videoStatus: ConsultationVideoStatus;
}> {
  const existing = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
  });
  if (!existing) throw new Error('مشاوره یافت نشد.');
  if (!canJoinConsultationVideo(existing.videoStatus)) {
    throw new Error(
      existing.videoStatus === 'completed'
        ? 'جلسه ویدیو پایان یافته است.'
        : 'ویزیت تصویری هنوز توسط مرکز باز نشده است.',
    );
  }

  const { row, room } = await ensureConsultationVideoRoom(input.consultationId);
  const minted = mintJitsiJwt({
    room,
    sub: input.sub,
    displayName: input.displayName,
    moderator: input.moderator,
  });

  let videoStatus = row.videoStatus;
  if (videoStatus === 'scheduled') {
    const updated = await prisma.consultation.update({
      where: { id: input.consultationId },
      data: { videoStatus: 'in_call' },
    });
    videoStatus = updated.videoStatus;
  }

  return {
    room: minted.room,
    jwt: minted.jwt,
    url: minted.url,
    expiresAt: minted.expiresAt,
    videoStatus,
  };
}

export { videoStatusLabel, canJoinConsultationVideoStatus } from '@/lib/jitsi/labels';
