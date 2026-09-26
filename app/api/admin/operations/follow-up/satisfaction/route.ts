import { jsonError } from '@/lib/auth/api-utils';
import {
  computeSatisfactionStats,
  type SatisfactionRole,
} from '@/lib/admin/follow-up-satisfaction';
import { requireAdmin } from '@/lib/content/require-admin';
import type { FollowUpServiceCategory } from '@prisma/client';
import { FOLLOW_UP_SERVICE_OPTIONS } from '@/lib/follow-up/types';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function parseRole(raw: string | null): SatisfactionRole {
  if (raw === 'assistants' || raw === 'reception') return raw;
  return 'doctor';
}

function parseCategory(raw: string | null): FollowUpServiceCategory | 'all' {
  if (raw && FOLLOW_UP_SERVICE_OPTIONS.some((o) => o.id === raw)) {
    return raw as FollowUpServiceCategory;
  }
  return 'all';
}

export async function GET(request: Request) {
  const auth = await requireAdmin('followUp');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const serviceCategory = parseCategory(searchParams.get('serviceCategory'));
  const role = parseRole(searchParams.get('role'));

  const rows = await prisma.followUpCase.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const stats = computeSatisfactionStats(rows, serviceCategory, role);
  return NextResponse.json(stats);
}

export async function POST() {
  return jsonError('Method not allowed', 405);
}
