import { createHash, randomBytes } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { detectLoanDocumentMime, isAllowedLoanMime } from '@/lib/loan-documents/detect-mime';
import { LOAN_DOC_MAX_BYTES } from '@/lib/loan-documents/constants';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

export function getPrivateUploadDir(): string {
  const configured = process.env.PRIVATE_UPLOAD_DIR?.trim();
  if (configured) return configured;
  return path.join(process.cwd(), 'private-uploads');
}

export async function savePrivateLoanFile(file: File): Promise<{
  storagePath: string;
  mime: string;
  sizeBytes: number;
  filename: string;
}> {
  if (file.size > LOAN_DOC_MAX_BYTES) {
    throw new Error('حجم فایل بیش از حد مجاز است (حداکثر ۱۰ مگابایت).');
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const mime = detectLoanDocumentMime(buf);
  if (!mime || !isAllowedLoanMime(mime)) {
    throw new Error('فرمت فایل مجاز نیست (jpg، jpeg، png، pdf).');
  }

  const ext = EXT_BY_MIME[mime] || 'bin';
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16);
  const filename = `${Date.now()}-${randomBytes(8).toString('hex')}-${hash}.${ext}`;
  const dir = getPrivateUploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);

  return {
    storagePath: filename,
    mime,
    sizeBytes: buf.length,
    filename: file.name || filename,
  };
}

export async function removePrivateLoanFile(storagePath: string): Promise<void> {
  if (!storagePath || storagePath.includes('..') || storagePath.includes('/') || storagePath.includes('\\')) {
    return;
  }
  try {
    await unlink(path.join(getPrivateUploadDir(), storagePath));
  } catch {
    // فایل ممکن است از قبل نباشد
  }
}

export function mapLoanDocumentPublic(row: {
  id: string;
  applicationId: string | null;
  kind: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  uploadedAt: Date;
}) {
  return {
    id: row.id,
    applicationId: row.applicationId ?? undefined,
    kind: row.kind,
    filename: row.filename,
    mime: row.mime,
    sizeBytes: row.sizeBytes,
    uploadedAt: row.uploadedAt.toISOString(),
  };
}
