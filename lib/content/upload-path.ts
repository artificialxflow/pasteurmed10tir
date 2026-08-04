import path from 'path';

export const UPLOAD_PUBLIC_PREFIX = '/uploads';
export const PLACEHOLDER_IMAGE = '/uploads/placeholder.svg';

/** Filesystem dir for uploads (Runflare disk mounts at /app/public/uploads). */
export function getUploadDir(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) return configured;
  return path.join(process.cwd(), 'public', 'uploads');
}

export function toPublicUploadPath(filename: string): string {
  return `${UPLOAD_PUBLIC_PREFIX}/${filename}`;
}
