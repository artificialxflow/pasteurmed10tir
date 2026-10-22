import { jsonError } from '@/lib/auth/api-utils';
import { findActiveVisitorByPhone, type VisitorSelf } from '@/lib/commerce/visitor-service';
import { requirePatient } from '@/lib/operations/require-patient';
import type { NextResponse } from 'next/server';

export async function requireActiveVisitor(): Promise<
  { error: NextResponse; visitor: null } | { error: null; visitor: VisitorSelf }
> {
  const auth = await requirePatient();
  if (auth.error) return { error: auth.error, visitor: null };
  const visitor = await findActiveVisitorByPhone(auth.session.phone);
  if (!visitor) {
    return {
      error: jsonError('حساب ویزیتور یا معرف فعال برای این موبایل یافت نشد.'),
      visitor: null,
    };
  }
  return { error: null, visitor };
}

/** فقط نقش ویزیتور — معرف به بازاریابی و تحلیل رقبا دسترسی ندارد. */
export async function requireVisitorRoleVisitor(): Promise<
  { error: NextResponse; visitor: null } | { error: null; visitor: VisitorSelf }
> {
  const result = await requireActiveVisitor();
  if (result.error) return result;
  if (result.visitor.role !== 'visitor') {
    return {
      error: jsonError('این بخش فقط برای ویزیتورها فعال است.', 403),
      visitor: null,
    };
  }
  return result;
}
