import { jsonError } from '@/lib/auth/api-utils';
import { walletToClient } from '@/lib/commerce/wallet-service';
import { loadWalletSettings, syncWalletFromMembership } from '@/lib/commerce/wallet-service';
import {
  assertPhoneAccess,
  requirePatient,
} from '@/lib/operations/require-patient';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const requested = normalizePhoneDigits(searchParams.get('phone') || auth.session.phone);
  if (!assertPhoneAccess(auth.session, requested)) {
    return jsonError('دسترسی ندارید.', 403);
  }

  const wallet = await syncWalletFromMembership(requested);
  if (!wallet) return jsonError('کیف اعتباری یافت نشد.', 404);

  const settings = await loadWalletSettings();
  return NextResponse.json({ wallet: walletToClient(wallet), settings });
}
