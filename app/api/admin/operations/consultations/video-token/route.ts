import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mintConsultationVideoAccess } from '@/lib/jitsi/consultation-video';
import { requireAdmin } from '@/lib/content/require-admin';
import { NextResponse } from 'next/server';

/** Admin / operator join — moderator:true. */
export async function POST(request: Request) {
  const auth = await requireAdmin('consultations');
  if (auth.error) return auth.error;

  const body = await parseJson<{ id?: string }>(request);
  if (!body?.id) return jsonError('شناسه مشاوره الزامی است.');

  try {
    const token = await mintConsultationVideoAccess({
      consultationId: String(body.id),
      sub: `admin:${auth.session.userId}`,
      displayName: 'پزشک / اپراتور',
      moderator: true,
    });
    return NextResponse.json(token);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'صدور توکن ویدیو ناموفق بود.');
  }
}
