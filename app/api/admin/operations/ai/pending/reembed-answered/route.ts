import { jsonError } from '@/lib/auth/api-utils';
import { reembedAllAnsweredPendingKnowledge } from '@/lib/ai/admin-knowledge';
import { requireAdmin } from '@/lib/content/require-admin';
import { NextResponse } from 'next/server';

export async function POST() {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  try {
    const { count } = await reembedAllAnsweredPendingKnowledge();
    return NextResponse.json({ ok: true, count });
  } catch (err) {
    console.error('[admin ai reembed answered]', err);
    return jsonError('بازسازی ایندکس ناموفق بود.', 500);
  }
}
