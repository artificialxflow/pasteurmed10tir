import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getUploadDir, toPublicUploadPath } from '@/lib/content/upload-path';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const MAX_BYTES = 5 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

export async function saveUploadedImage(
  file: File,
): Promise<{ path: string; assetId: string }> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error('فرمت تصویر مجاز نیست (jpg, png, webp, gif, svg).');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('حجم فایل بیش از حد مجاز است (حداکثر ۵ مگابایت).');
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = EXT_BY_MIME[file.type] || 'jpg';
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16);
  const filename = `${Date.now()}-${hash}.${ext}`;
  const dir = getUploadDir();

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);

  const publicPath = toPublicUploadPath(filename);
  const asset = await prisma.mediaAsset.create({
    data: {
      path: publicPath,
      mime: file.type,
      filename: file.name || filename,
    },
  });

  return { path: publicPath, assetId: asset.id };
}

const HEALTH_RECORD_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const HEALTH_RECORD_EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const HEALTH_RECORD_MAX_BYTES = 12 * 1024 * 1024;

/** گزارش پرونده سلامت: jpg / png / webp / pdf */
export async function saveHealthRecordAttachment(
  file: File,
): Promise<{ path: string; assetId: string }> {
  const mime = file.type || '';
  const name = (file.name || '').toLowerCase();
  const extFromName = name.endsWith('.pdf')
    ? 'pdf'
    : name.endsWith('.png')
      ? 'png'
      : name.endsWith('.webp')
        ? 'webp'
        : name.endsWith('.jpg') || name.endsWith('.jpeg')
          ? 'jpg'
          : '';
  const resolvedMime =
    mime && HEALTH_RECORD_MIME.has(mime)
      ? mime
      : extFromName === 'pdf'
        ? 'application/pdf'
        : extFromName === 'png'
          ? 'image/png'
          : extFromName === 'webp'
            ? 'image/webp'
            : extFromName === 'jpg'
              ? 'image/jpeg'
              : '';

  if (!resolvedMime || !HEALTH_RECORD_MIME.has(resolvedMime)) {
    throw new Error('فرمت مجاز نیست (jpg، png، webp، pdf).');
  }
  if (file.size > HEALTH_RECORD_MAX_BYTES) {
    throw new Error('حجم فایل بیش از حد مجاز است (حداکثر ۱۲ مگابایت).');
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = HEALTH_RECORD_EXT_BY_MIME[resolvedMime] || extFromName || 'bin';
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16);
  const filename = `${Date.now()}-${hash}.${ext}`;
  const dir = getUploadDir();

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);

  const publicPath = toPublicUploadPath(filename);
  const asset = await prisma.mediaAsset.create({
    data: {
      path: publicPath,
      mime: resolvedMime,
      filename: file.name || filename,
    },
  });

  return { path: publicPath, assetId: asset.id };
}
