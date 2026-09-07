import { HOME_VISIT_SERVICE_AREAS } from '@/lib/home-visit/areas';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ items: HOME_VISIT_SERVICE_AREAS });
}
