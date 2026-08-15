import { handleZibalCallback } from '@/lib/commerce/zibal-intent-service';
import { getSiteUrl } from '@/lib/zibal/config';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    const result = await handleZibalCallback(url.searchParams);
    return NextResponse.redirect(new URL(result.redirectPath, getSiteUrl()));
  } catch (e) {
    console.error('[zibal] callback', e);
    return NextResponse.redirect(new URL('/dental/failed', getSiteUrl()));
  }
}
