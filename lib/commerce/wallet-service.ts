import { prisma } from '@/lib/prisma';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { generateCommerceId, mapWallet } from '@/lib/commerce/mappers';
import {
  computeWalletCeiling,
  DEFAULT_WALLET_SETTINGS,
  planIdToWalletKinds,
  type WalletKind,
  type WalletSettings,
} from '@/lib/wallet';
import type { Wallet, WalletTransaction } from '@prisma/client';

export async function loadWalletSettings(): Promise<WalletSettings> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  if (!settings) return { ...DEFAULT_WALLET_SETTINGS };
  return {
    regularCap: settings.walletRegularCap,
    membershipVipCap: settings.walletMembershipVipCap,
    shopVipCap: settings.walletShopVipCap,
    graceMonths: settings.walletGraceMonths,
    installmentMin: settings.walletInstallmentMin,
    installmentMax: settings.walletInstallmentMax,
  };
}

export async function deriveWalletKinds(phone: string): Promise<WalletKind[]> {
  const key = normalizePhoneDigits(phone);
  const kinds: WalletKind[] = ['regular'];

  const members = await prisma.member.findMany({
    where: { patientPhone: key, status: 'paid' },
  });

  for (const member of members) {
    const planId = String(member.planId || '');
    if (planId === 'regular') kinds.push('regular');
    if (planId === 'vip') {
      kinds.push('membership-vip');
      kinds.push('shop-vip');
    }
    if (planId === 'shop-vip') kinds.push('shop-vip');
  }

  const wallet = await prisma.wallet.findUnique({ where: { phone: key } });
  if (wallet?.shopVip) kinds.push('shop-vip');
  if (wallet?.activeKinds?.length) {
    for (const k of wallet.activeKinds) {
      if (k === 'regular' || k === 'membership-vip' || k === 'shop-vip') {
        kinds.push(k);
      }
    }
  }

  return [...new Set(kinds)];
}

async function resolveUserId(phone: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { phone } });
  return user?.id ?? null;
}

export async function getOrCreateWallet(phone?: string | null) {
  const key = normalizePhoneDigits(phone || '');
  if (!key) return null;

  const settings = await loadWalletSettings();
  const existing = await prisma.wallet.findUnique({
    where: { phone: key },
    include: { transactions: { orderBy: { createdAt: 'desc' } } },
  });

  if (existing) return existing;

  const activeKinds = await deriveWalletKinds(key);
  const userId = await resolveUserId(key);
  return prisma.wallet.create({
    data: {
      phone: key,
      userId,
      balance: 0,
      ceiling: computeWalletCeiling(activeKinds, settings),
      activeKinds,
      status: 'active',
      shopVip: activeKinds.includes('shop-vip'),
    },
    include: { transactions: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function syncWalletFromMembership(phone?: string | null) {
  const wallet = await getOrCreateWallet(phone);
  if (!wallet) return null;

  const settings = await loadWalletSettings();
  const derived = await deriveWalletKinds(wallet.phone);
  const merged = [...new Set([...wallet.activeKinds, ...derived])] as string[];
  const newCeiling = computeWalletCeiling(merged as WalletKind[], settings);

  return prisma.wallet.update({
    where: { phone: wallet.phone },
    data: {
      activeKinds: merged,
      ceiling: newCeiling,
      shopVip: merged.includes('shop-vip') || wallet.shopVip,
      userId: wallet.userId || (await resolveUserId(wallet.phone)),
    },
    include: { transactions: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function upgradeWalletForUser(phone?: string | null, kinds: WalletKind[] = []) {
  const wallet = await getOrCreateWallet(phone);
  if (!wallet || !kinds.length) return wallet;

  const settings = await loadWalletSettings();
  const merged = [...new Set([...wallet.activeKinds, ...kinds])] as string[];
  const oldCeiling = wallet.ceiling;
  const newCeiling = computeWalletCeiling(merged as WalletKind[], settings);

  const updated = await prisma.wallet.update({
    where: { phone: wallet.phone },
    data: {
      activeKinds: merged,
      ceiling: newCeiling,
      shopVip: merged.includes('shop-vip') || wallet.shopVip,
    },
  });

  if (newCeiling > oldCeiling) {
    await prisma.walletTransaction.create({
      data: {
        id: generateCommerceId(),
        walletPhone: wallet.phone,
        type: 'upgrade',
        amount: newCeiling - oldCeiling,
        balanceAfter: updated.balance,
        description: `ارتقای سقف اعتبار به ${newCeiling.toLocaleString('fa-IR')} تومان`,
        status: 'completed',
      },
    });
  }

  return prisma.wallet.findUnique({
    where: { phone: wallet.phone },
    include: { transactions: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function activateShopVip(phone?: string | null) {
  const wallet = await getOrCreateWallet(phone);
  if (!wallet) return null;
  await prisma.wallet.update({
    where: { phone: wallet.phone },
    data: { shopVip: true },
  });
  return upgradeWalletForUser(wallet.phone, planIdToWalletKinds('shop-vip'));
}

export async function isShopVip(phone?: string | null): Promise<boolean> {
  const key = normalizePhoneDigits(phone || '');
  if (!key) return false;
  const wallet = await prisma.wallet.findUnique({ where: { phone: key } });
  if (wallet?.shopVip || wallet?.activeKinds.includes('shop-vip')) return true;
  const member = await prisma.member.findFirst({
    where: {
      patientPhone: key,
      status: 'paid',
      planId: { in: ['vip', 'shop-vip'] },
    },
  });
  return Boolean(member);
}

export function walletToClient(row: Wallet & { transactions?: WalletTransaction[] }) {
  return mapWallet(row);
}
