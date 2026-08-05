import { prisma } from '@/lib/prisma';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { generateCommerceId } from '@/lib/commerce/mappers';
import type { ClubHistoryItem, ClubProfile } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export const BRUSH_POINTS = 5;
export const BRUSH_MAX_PER_DAY = 3;
export const BRUSH_COOLDOWN_MS = 8 * 60 * 60 * 1000;

export type BrushStatus = {
  canBrush: boolean;
  brushesToday: number;
  maxPerDay: number;
  remainingCooldownMs: number | null;
  errorMessage: string | null;
};

export type ClubProfileClient = {
  phone: string;
  points: number;
  visits: number;
  referrals: number;
  referredPhones: string[];
  redeemed: unknown[];
  history: { points: number; reason: string; date: string }[];
  brushHistory: string[];
};

function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatBrushRemainingTime(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours.toLocaleString('fa-IR')} ساعت و ${minutes.toLocaleString('fa-IR')} دقیقه`;
  }
  if (hours > 0) {
    return `${hours.toLocaleString('fa-IR')} ساعت`;
  }
  return `${minutes.toLocaleString('fa-IR')} دقیقه`;
}

export function getBrushStatus(
  brushHistory: string[],
  now = new Date(),
): BrushStatus {
  const todayKey = localDayKey(now);
  const brushesToday = brushHistory.filter(
    (iso) => localDayKey(new Date(iso)) === todayKey,
  ).length;

  if (brushesToday >= BRUSH_MAX_PER_DAY) {
    return {
      canBrush: false,
      brushesToday,
      maxPerDay: BRUSH_MAX_PER_DAY,
      remainingCooldownMs: null,
      errorMessage: `سقف روزانه (${BRUSH_MAX_PER_DAY.toLocaleString('fa-IR')} بار) تکمیل شده است. فردا دوباره امتحان کنید.`,
    };
  }

  const lastBrushAt = brushHistory.length
    ? new Date(brushHistory[brushHistory.length - 1]!).getTime()
    : null;

  if (lastBrushAt !== null) {
    const elapsed = now.getTime() - lastBrushAt;
    const remaining = BRUSH_COOLDOWN_MS - elapsed;
    if (remaining > 0) {
      return {
        canBrush: false,
        brushesToday,
        maxPerDay: BRUSH_MAX_PER_DAY,
        remainingCooldownMs: remaining,
        errorMessage: `حداقل ۸ ساعت بین هر «مسواک زدم» لازم است. ${formatBrushRemainingTime(remaining)} دیگر صبر کنید.`,
      };
    }
  }

  return {
    canBrush: true,
    brushesToday,
    maxPerDay: BRUSH_MAX_PER_DAY,
    remainingCooldownMs: null,
    errorMessage: null,
  };
}

function parseRedeemed(raw: Prisma.JsonValue): unknown[] {
  if (Array.isArray(raw)) return raw;
  return [];
}

export function mapClubProfile(
  row: ClubProfile & { history?: ClubHistoryItem[] },
): ClubProfileClient {
  return {
    phone: row.phone,
    points: row.points,
    visits: row.visits,
    referrals: row.referrals,
    referredPhones: [...row.referredPhones],
    redeemed: parseRedeemed(row.redeemed),
    brushHistory: [...row.brushHistory],
    history: (row.history || []).map((h) => ({
      points: h.points,
      reason: h.reason,
      date: h.createdAt.toISOString(),
    })),
  };
}

async function resolveUserId(phone: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { phone } });
  return user?.id ?? null;
}

export async function getOrCreateClubProfile(phone?: string | null) {
  const key = normalizePhoneDigits(phone || '');
  if (!key || key.length < 10) return null;

  const existing = await prisma.clubProfile.findUnique({
    where: { phone: key },
    include: { history: { orderBy: { createdAt: 'desc' } } },
  });
  if (existing) return existing;

  const userId = await resolveUserId(key);
  return prisma.clubProfile.create({
    data: {
      phone: key,
      userId,
      points: 0,
      visits: 0,
      referrals: 0,
      referredPhones: [],
      redeemed: [],
      brushHistory: [],
    },
    include: { history: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function addClubPoints(
  phone: string | null | undefined,
  points: number,
  reason: string,
) {
  const profile = await getOrCreateClubProfile(phone);
  if (!profile) return null;

  const updated = await prisma.clubProfile.update({
    where: { phone: profile.phone },
    data: { points: { increment: points } },
  });

  await prisma.clubHistoryItem.create({
    data: {
      id: generateCommerceId(),
      profilePhone: profile.phone,
      points,
      reason,
    },
  });

  return prisma.clubProfile.findUnique({
    where: { phone: updated.phone },
    include: { history: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function recordBrush(phone?: string | null) {
  const profile = await getOrCreateClubProfile(phone);
  if (!profile) {
    return { ok: false as const, error: 'ابتدا شماره موبایل باشگاه را وارد کنید.' };
  }

  const status = getBrushStatus(profile.brushHistory);
  if (!status.canBrush) {
    return {
      ok: false as const,
      error: status.errorMessage || 'در حال حاضر امکان ثبت مسواک وجود ندارد.',
    };
  }

  const nowIso = new Date().toISOString();
  await prisma.clubProfile.update({
    where: { phone: profile.phone },
    data: {
      points: { increment: BRUSH_POINTS },
      brushHistory: [...profile.brushHistory, nowIso],
    },
  });

  await prisma.clubHistoryItem.create({
    data: {
      id: generateCommerceId(),
      profilePhone: profile.phone,
      points: BRUSH_POINTS,
      reason: 'مسواک زدم',
    },
  });

  const fresh = await prisma.clubProfile.findUnique({
    where: { phone: profile.phone },
    include: { history: { orderBy: { createdAt: 'desc' } } },
  });

  return { ok: true as const, profile: fresh! };
}

export async function redeemReward(
  phone: string | null | undefined,
  reward: { id: string | number; title: string; points: number; emoji?: string },
) {
  const profile = await getOrCreateClubProfile(phone);
  if (!profile) return { ok: false as const, error: 'پروفایل باشگاه یافت نشد.' };
  if (profile.points < reward.points) {
    return { ok: false as const, error: 'امتیاز کافی نیست.' };
  }

  const redeemed = parseRedeemed(profile.redeemed);
  redeemed.push({ ...reward, date: new Date().toISOString() });

  await prisma.clubProfile.update({
    where: { phone: profile.phone },
    data: {
      points: { decrement: reward.points },
      redeemed: redeemed as Prisma.InputJsonValue,
    },
  });

  await prisma.clubHistoryItem.create({
    data: {
      id: generateCommerceId(),
      profilePhone: profile.phone,
      points: -reward.points,
      reason: `دریافت: ${reward.title}`,
    },
  });

  const fresh = await prisma.clubProfile.findUnique({
    where: { phone: profile.phone },
    include: { history: { orderBy: { createdAt: 'desc' } } },
  });

  return { ok: true as const, profile: fresh! };
}

export async function addReferralClubPoints(input: {
  visitorPhone: string;
  customerPhone: string;
  customerName?: string;
}) {
  const visitorPhone = normalizePhoneDigits(input.visitorPhone);
  const customerPhone = normalizePhoneDigits(input.customerPhone);
  if (!visitorPhone || !customerPhone || visitorPhone === customerPhone) return null;

  const profile = await getOrCreateClubProfile(visitorPhone);
  if (!profile) return null;
  if (profile.referredPhones.includes(customerPhone)) return profile;

  await prisma.clubProfile.update({
    where: { phone: visitorPhone },
    data: {
      referrals: { increment: 1 },
      referredPhones: [customerPhone, ...profile.referredPhones],
      points: { increment: 100 },
    },
  });

  await prisma.clubHistoryItem.create({
    data: {
      id: generateCommerceId(),
      profilePhone: visitorPhone,
      points: 100,
      reason: `معرفی بیمار جدید: ${input.customerName || customerPhone}`,
    },
  });

  return prisma.clubProfile.findUnique({
    where: { phone: visitorPhone },
    include: { history: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function incrementClubVisits(phone?: string | null) {
  const profile = await getOrCreateClubProfile(phone);
  if (!profile) return null;
  return prisma.clubProfile.update({
    where: { phone: profile.phone },
    data: { visits: { increment: 1 } },
  });
}
