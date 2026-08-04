import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import {
  copyBundledImageForUrl,
  ensurePlaceholder,
  PLACEHOLDER,
} from '@/lib/content/seed-assets';
import {
  getUploadDir,
  toPublicUploadPath,
} from '@/lib/content/upload-path';

/** Map remote URL → local /uploads path; bundled copy, then download fallback. */
export async function localizeImageUrl(
  url: string,
  cache: Map<string, string>,
): Promise<string> {
  const trimmed = url?.trim() || '';
  if (!trimmed) return PLACEHOLDER;
  if (trimmed.startsWith('/')) return trimmed;
  if (cache.has(trimmed)) return cache.get(trimmed)!;

  if (!trimmed.includes('unsplash.com') && !trimmed.startsWith('http')) {
    cache.set(trimmed, trimmed);
    return trimmed;
  }

  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const bundled = await copyBundledImageForUrl(trimmed, uploadDir);
  if (bundled) {
    cache.set(trimmed, bundled);
    return bundled;
  }

  try {
    const hash = createHash('sha1').update(trimmed).digest('hex').slice(0, 16);
    const ext = trimmed.includes('.png') ? 'png' : 'jpg';
    const filename = `${hash}.${ext}`;
    const diskPath = path.join(uploadDir, filename);
    const publicPath = toPublicUploadPath(filename);

    const res = await fetch(trimmed, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(diskPath, buf);
    cache.set(trimmed, publicPath);
    return publicPath;
  } catch {
    await ensurePlaceholder(uploadDir);
    cache.set(trimmed, PLACEHOLDER);
    return PLACEHOLDER;
  }
}
