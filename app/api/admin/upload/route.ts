import { jsonError } from '@/lib/auth/api-utils';
import { saveUploadedImage } from '@/lib/content/save-upload';
import { requireAdmin } from '@/lib/content/require-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('درخواست نامعتبر است.', 400);
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return jsonError('فایل تصویر انتخاب نشده است.', 400);
  }

  try {
    const result = await saveUploadedImage(file);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'آپلود ناموفق بود.';
    return jsonError(message, 400);
  }
}
