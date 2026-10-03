import { createHash, randomBytes } from 'crypto';
import type { Consultation, ConsultationVideoStatus } from '@prisma/client';
import { consultationSupportsVideoSession } from '@/lib/consultation/modality';
import { mintJitsiJwt } from '@/lib/jitsi/jwt';
import {
  consultationVideoExpiresAt,
  isConsultationVideoWindowExpired,
} from '@/lib/jitsi/video-window';
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

async function closeExpiredVideoSession(row: Consultation): Promise<void> {
  if (row.videoStatus === 'completed' || row.videoStatus === 'none') return;
  await prisma.consultation.update({
    where: { id: row.id },
    data: { videoStatus: 'completed' },
  });
}

export async function openConsultationVideoSession(consultationId: string): Promise<Consultation> {
  const existing = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!existing) throw new Error('مشاوره یافت نشد.');
  if (!consultationSupportsVideoSession({ category: existing.category, type: existing.type })) {
    throw new Error('ویزیت تصویری فقط برای مشاوره تصویری فعال است.');
  }
  if (existing.videoStatus === 'completed') {
    throw new Error('جلسه ویدیو این مشاوره پایان یافته است.');
  }
  if (isConsultationVideoWindowExpired(existing)) {
    await closeExpiredVideoSession(existing);
    throw new Error('مهلت اتاق ویدیو پایان یافته است (۳۰ دقیقه پس از وقت ویزیت).');
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
  if (!consultationSupportsVideoSession({ category: existing.category, type: existing.type })) {
    throw new Error('ویزیت تصویری فقط برای مشاوره تصویری فعال است.');
  }
  if (!canJoinConsultationVideo(existing.videoStatus)) {
    throw new Error(
      existing.videoStatus === 'completed'
        ? 'جلسه ویدیو پایان یافته است.'
        : 'ویزیت تصویری هنوز توسط مرکز باز نشده است.',
    );
  }
  if (isConsultationVideoWindowExpired(existing)) {
    await closeExpiredVideoSession(existing);
    throw new Error('مهلت ورود به اتاق ویدیو پایان یافته است (۳۰ دقیقه پس از وقت ویزیت).');
  }

  const { row, room } = await ensureConsultationVideoRoom(input.consultationId);

  const windowExpiresAt = consultationVideoExpiresAt(row);
  let ttlSeconds: number | undefined;
  if (windowExpiresAt) {
    ttlSeconds = Math.max(30, Math.floor((windowExpiresAt.getTime() - Date.now()) / 1000));
  }

  const minted = mintJitsiJwt({
    room,
    sub: input.sub,
    displayName: input.displayName,
    moderator: input.moderator,
    ttlSeconds,
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
export { canJoinConsultationVideoNow } from '@/lib/jitsi/video-window';
