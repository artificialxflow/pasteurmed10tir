import { createHash } from 'crypto';
import { access, copyFile, mkdir, readdir, writeFile } from 'fs/promises';
import path from 'path';
import { getUploadDir, PLACEHOLDER_IMAGE } from '@/lib/content/upload-path';

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#e8f7fc"/>
  <text x="300" y="200" text-anchor="middle" fill="#0891b2" font-family="sans-serif" font-size="24">Pasteur Plus</text>
</svg>`;

/** Bundled images — outside mounted disk path on Runflare. */
export function getSeedAssetsDir(): string {
  return path.join(process.cwd(), 'scripts', 'seed-assets', 'uploads');
}

export function hashUrlToFilename(url: string): string {
  const trimmed = url.trim();
  const hash = createHash('sha1').update(trimmed).digest('hex').slice(0, 16);
  const ext = trimmed.includes('.png') ? 'png' : 'jpg';
  return `${hash}.${ext}`;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Copy all bundled seed images onto the live upload disk/volume. */
export async function syncSeedAssetsToUploadDir(): Promise<number> {
  const src = getSeedAssetsDir();
  const dest = getUploadDir();
  await mkdir(dest, { recursive: true });

  let count = 0;
  try {
    const files = await readdir(src);
    for (const file of files) {
      await copyFile(path.join(src, file), path.join(dest, file));
      count += 1;
    }
  } catch {
    // seed-assets missing — skip
  }
  return count;
}

export async function ensurePlaceholder(uploadDir?: string): Promise<void> {
  const dir = uploadDir ?? getUploadDir();
  await mkdir(dir, { recursive: true });
  const dest = path.join(dir, 'placeholder.svg');
  if (await exists(dest)) return;

  const bundled = path.join(getSeedAssetsDir(), 'placeholder.svg');
  if (await exists(bundled)) {
    await copyFile(bundled, dest);
    return;
  }

  await writeFile(dest, PLACEHOLDER_SVG, 'utf8');
}

/** Resolve bundled file for a remote image URL (Unsplash hash filename). */
export async function copyBundledImageForUrl(
  url: string,
  uploadDir?: string,
): Promise<string | null> {
  const filename = hashUrlToFilename(url);
  const dir = uploadDir ?? getUploadDir();
  await mkdir(dir, { recursive: true });
  const diskPath = path.join(dir, filename);
  const publicPath = `/uploads/${filename}`;

  if (await exists(diskPath)) return publicPath;

  const bundledPath = path.join(getSeedAssetsDir(), filename);
  if (await exists(bundledPath)) {
    await copyFile(bundledPath, diskPath);
    return publicPath;
  }

  return null;
}

export { PLACEHOLDER_IMAGE as PLACEHOLDER };
