import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const PLACEHOLDER = '/uploads/placeholder.svg';

/** Map remote URL → local /uploads path; download when possible. */
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

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const hash = createHash('sha1').update(trimmed).digest('hex').slice(0, 16);
    const ext = trimmed.includes('.png') ? 'png' : 'jpg';
    const filename = `${hash}.${ext}`;
    const diskPath = path.join(UPLOAD_DIR, filename);
    const publicPath = `/uploads/${filename}`;

    const res = await fetch(trimmed, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(diskPath, buf);
    cache.set(trimmed, publicPath);
    return publicPath;
  } catch {
    cache.set(trimmed, PLACEHOLDER);
    return PLACEHOLDER;
  }
}
