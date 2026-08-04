import { readFile } from 'fs/promises';
import path from 'path';
import { getUploadDir } from '@/lib/content/upload-path';
import { NextResponse } from 'next/server';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

type RouteContext = { params: Promise<{ path: string[] }> };

/** Serve uploaded files from disk (Runflare persistent volume). */
export async function GET(_request: Request, context: RouteContext) {
  const { path: segments } = await context.params;
  const filename = segments.join('/');

  if (!filename || filename.includes('..')) {
    return new NextResponse('Not found', { status: 404 });
  }

  const filePath = path.join(getUploadDir(), filename);

  try {
    const buf = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    return new NextResponse(buf, {
      headers: {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
