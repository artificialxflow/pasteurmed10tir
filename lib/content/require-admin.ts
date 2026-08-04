import { buildAdminSession } from '@/lib/auth/admin-db';
import { jsonError } from '@/lib/auth/api-utils';
import { getAdminSession } from '@/lib/auth/session';
import type { AdminPermission, AdminSession } from '@/lib/adminAccess';
import type { NextResponse } from 'next/server';

type AdminResult =
  | { session: AdminSession; error?: never }
  | { session?: never; error: NextResponse };

export async function requireAdmin(permission?: AdminPermission): Promise<AdminResult> {
  const payload = await getAdminSession();
  if (!payload) return { error: jsonError('وارد نشده‌اید.', 401) };

  const session = await buildAdminSession(payload.adminUserId);
  if (!session) return { error: jsonError('نشست نامعتبر است.', 401) };

  if (permission && !session.permissions.includes(permission)) {
    return { error: jsonError('دسترسی ندارید.', 403) };
  }

  return { session };
}
