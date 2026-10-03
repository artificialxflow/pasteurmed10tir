import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { consultationSupportsVideoSession } from '@/lib/consultation/modality';
import {
  completeConsultationVideoSession,
  openConsultationVideoSession,
} from '@/lib/jitsi/consultation-video';
import { notifyVideoVisitReadySms } from '@/lib/jitsi/doctor-sms';
import { mapConsultation } from '@/lib/operations/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { upsertConsultationStaffCommission } from '@/lib/home-visit/service';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function normalizeMeetingUrl(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  const value = String(raw || '').trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('invalid');
    }
    return parsed.toString();
  } catch {
    throw new Error('لینک اتاق باید یک آدرس معتبر http/https باشد.');
  }
}

export async function GET() {
  const auth = await requireAdmin('consultations');
  if (auth.error) return auth.error;

  const rows = await prisma.consultation.findMany({
    include: { dependent: { select: { name: true, fileNumber: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ items: rows.map(mapConsultation) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('consultations');
  if (auth.error) return auth.error;

  const body = await parseJson<{
    id?: string;
    status?: string;
    videoStatus?: string;
    videoMeetingUrl?: string | null;
    preferredTime?: string | null;
    preferredTimeLabel?: string | null;
    preferredDate?: string | null;
    preferredDateLabel?: string | null;
  }>(request);
  if (!body?.id) return jsonError('شناسه الزامی است.');

  const existing = await prisma.consultation.findUnique({ where: { id: body.id } });
  if (!existing) return jsonError('درخواست یافت نشد.', 404);

  const hasMeetingSchedulePatch =
    body.videoMeetingUrl !== undefined ||
    body.preferredTime !== undefined ||
    body.preferredTimeLabel !== undefined ||
    body.preferredDate !== undefined ||
    body.preferredDateLabel !== undefined;

  if (hasMeetingSchedulePatch) {
    if (!consultationSupportsVideoSession({ category: existing.category, type: existing.type })) {
      return jsonError('ویزیت تصویری / لینک اتاق فقط برای مشاوره تصویری فعال است.');
    }
    let videoMeetingUrl: string | null | undefined;
    try {
      videoMeetingUrl = normalizeMeetingUrl(body.videoMeetingUrl);
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : 'لینک اتاق نامعتبر است.');
    }

    if (existing.videoStatus === 'completed' && videoMeetingUrl) {
      return jsonError('جلسه ویدیو این مشاوره پایان یافته است.');
    }

    const data: {
      videoMeetingUrl?: string | null;
      preferredTime?: string | null;
      preferredTimeLabel?: string | null;
      preferredDate?: string | null;
      preferredDateLabel?: string | null;
      videoStatus?: 'scheduled';
    } = {};

    if (videoMeetingUrl !== undefined) data.videoMeetingUrl = videoMeetingUrl;
    if (body.preferredTime !== undefined) {
      data.preferredTime = body.preferredTime ? String(body.preferredTime).trim() || null : null;
    }
    if (body.preferredTimeLabel !== undefined) {
      data.preferredTimeLabel = body.preferredTimeLabel
        ? String(body.preferredTimeLabel).trim() || null
        : null;
    }
    if (body.preferredDate !== undefined) {
      data.preferredDate = body.preferredDate ? String(body.preferredDate).trim() || null : null;
    }
    if (body.preferredDateLabel !== undefined) {
      data.preferredDateLabel = body.preferredDateLabel
        ? String(body.preferredDateLabel).trim() || null
        : null;
    }

    const nextUrl = videoMeetingUrl !== undefined ? videoMeetingUrl : existing.videoMeetingUrl;
    if (nextUrl && existing.videoStatus !== 'completed' && existing.videoStatus !== 'in_call') {
      data.videoStatus = 'scheduled';
    }

    const row = await prisma.consultation.update({
      where: { id: body.id },
      data,
    });

    const becameScheduled =
      existing.videoStatus !== 'scheduled' && row.videoStatus === 'scheduled';
    const urlChanged =
      videoMeetingUrl !== undefined &&
      Boolean(videoMeetingUrl) &&
      videoMeetingUrl !== existing.videoMeetingUrl;
    const timeChanged =
      (body.preferredTimeLabel !== undefined &&
        String(body.preferredTimeLabel || '').trim() !==
          String(existing.preferredTimeLabel || '').trim()) ||
      (body.preferredDateLabel !== undefined &&
        String(body.preferredDateLabel || '').trim() !==
          String(existing.preferredDateLabel || '').trim());
    if (
      (becameScheduled || urlChanged || timeChanged) &&
      (row.videoStatus === 'scheduled' || row.videoStatus === 'in_call')
    ) {
      void notifyVideoVisitReadySms(row.id);
    }

    return NextResponse.json({ item: mapConsultation(row) });
  }

  if (body.videoStatus === 'scheduled' || body.videoStatus === 'open') {
    try {
      const row = await openConsultationVideoSession(body.id);
      if (existing.videoStatus === 'none' || existing.videoStatus !== 'scheduled') {
        void notifyVideoVisitReadySms(row.id);
      }
      return NextResponse.json({ item: mapConsultation(row) });
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : 'باز کردن جلسه ویدیو ناموفق بود.');
    }
  }

  if (body.videoStatus === 'completed') {
    try {
      const row = await completeConsultationVideoSession(body.id);
      return NextResponse.json({ item: mapConsultation(row) });
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : 'پایان جلسه ویدیو ناموفق بود.');
    }
  }

  if (body.status === 'cancelled') {
    if (existing.status === 'cancelled') {
      return jsonError('این مشاوره قبلاً لغو شده است.');
    }
    const row = await prisma.consultation.update({
      where: { id: body.id },
      data: {
        status: 'cancelled',
        ...(existing.videoStatus === 'scheduled' || existing.videoStatus === 'in_call'
          ? { videoStatus: 'completed' as const }
          : {}),
      },
    });
    return NextResponse.json({ item: mapConsultation(row) });
  }

  const status = body.status === 'answered' ? 'answered' : undefined;
  if (!status) return jsonError('وضعیت نامعتبر است.');
  if (existing.status === 'cancelled') {
    return jsonError('مشاوره لغو‌شده را نمی‌توان پاسخ‌داده‌شده کرد.');
  }

  const row = await prisma.consultation.update({
    where: { id: body.id },
    data: { status },
  });

  if (existing.status !== 'answered') {
    try {
      await upsertConsultationStaffCommission(row.id);
    } catch {
      /* پورسانت جدا از پاسخ‌دهی؛ خطا گزارش نمی‌شود تا PATCH مشاوره نشکند */
    }
  }

  return NextResponse.json({ item: mapConsultation(row) });
}
