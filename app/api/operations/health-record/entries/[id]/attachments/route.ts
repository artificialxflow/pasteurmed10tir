import { jsonError } from '@/lib/auth/api-utils';
import { saveUploadedImage } from '@/lib/content/save-upload';
import { addHealthAttachment } from '@/lib/health-record/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { NextResponse } from 'next/server';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('درخواست نامعتبر است.', 400);
  }
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return jsonError('فایل انتخاب نشده است.', 400);
  }

  try {
    const uploaded = await saveUploadedImage(file);
    const attachment = await addHealthAttachment({
      userId: auth.session.userId,
      entryId: id,
      path: uploaded.path,
      mimeType: file.type || 'application/octet-stream',
      originalName: file.name || 'upload',
    });
    return NextResponse.json({ item: attachment }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'آپلود ناموفق', 400);
  }
}
