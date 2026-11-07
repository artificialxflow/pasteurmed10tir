import { jsonError } from '@/lib/auth/api-utils';
import {
  institutionsToCsv,
  listMarketingInstitutions,
} from '@/lib/admin/marketing-institutions';
import { adminExportFilename } from '@/lib/admin/export-filename';
import { requireAdmin } from '@/lib/content/require-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('visitors');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const format = searchParams.get('format')?.toLowerCase();

  const items = await listMarketingInstitutions(q || undefined);

  if (format === 'csv') {
    const body = institutionsToCsv(items);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${adminExportFilename('marketing-institutions', 'csv')}"`,
      },
    });
  }

  return NextResponse.json({ items });
}
