import { jsonError } from '@/lib/auth/api-utils';
import { listNearbyStaff } from '@/lib/home-visit/service';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get('kind') === 'physician' ? 'physician' : searchParams.get('kind') === 'nurse' ? 'nurse' : null;
  if (!kind) return jsonError('نوع نیرو نامعتبر است.');
  try {
    const items = await listNearbyStaff({
      kind,
      latitude: searchParams.get('lat'),
      longitude: searchParams.get('lng'),
    });
    return NextResponse.json({ items });
  } catch (e) {
    return prismaRouteError(e, 'nearest-staff GET');
  }
}
