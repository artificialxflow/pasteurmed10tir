import { isShopVip } from '@/lib/commerce/wallet-service';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = normalizePhoneDigits(searchParams.get('phone') || '');
  if (!phone) return NextResponse.json({ vip: false });
  return NextResponse.json({ vip: await isShopVip(phone) });
}
