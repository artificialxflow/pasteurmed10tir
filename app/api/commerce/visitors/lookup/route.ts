import { findVisitorByCode } from '@/lib/commerce/commission-service';
import { mapVisitor } from '@/lib/commerce/mappers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '';
  const visitor = await findVisitorByCode(code);
  return NextResponse.json({ visitor: visitor ? mapVisitor(visitor) : null });
}
