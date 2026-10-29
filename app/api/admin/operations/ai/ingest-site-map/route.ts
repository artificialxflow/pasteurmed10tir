import { jsonError } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { ingestSiteMapDocument } from '@/lib/ai/admin-knowledge';
import { NextResponse } from 'next/server';

export async function POST() {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  try {
    const doc = await ingestSiteMapDocument();
    return NextResponse.json({ ok: true, id: doc.id, title: doc.title });
  } catch (err) {
    console.error('[admin ai ingest-site-map]', err);
    return jsonError('بارگذاری نقشه سایت ناموفق بود.', 500);
  }
}
