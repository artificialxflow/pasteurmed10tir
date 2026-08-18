import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

function mapUser(user: {
  id: string;
  username: string;
  displayName: string;
  roleId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    roleId: user.roleId,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function GET() {
  const auth = await requireAdmin('access');
  if (auth.error) return auth.error;

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ items: users.map(mapUser) });
}

export async function POST(request: Request) {
  const auth = await requireAdmin('access');
  if (auth.error) return auth.error;

  const body = await parseJson<{
    username?: string;
    password?: string;
    displayName?: string;
    roleId?: string;
    active?: boolean;
  }>(request);

  const username = String(body?.username || '')
    .trim()
    .toLowerCase();
  const password = String(body?.password || '').trim();
  const displayName = String(body?.displayName || '').trim() || username;
  const roleId = String(body?.roleId || '').trim();

  if (!username || !password || !roleId) {
    return jsonError('نام کاربری، رمز و نقش الزامی است.');
  }

  const role = await prisma.adminRole.findUnique({ where: { id: roleId } });
  if (!role) return jsonError('نقش یافت نشد.', 404);

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) return jsonError('این نام کاربری قبلاً ثبت شده است.', 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({
    data: {
      username,
      passwordHash,
      displayName,
      roleId,
      active: body?.active !== false,
    },
  });

  return NextResponse.json({ user: mapUser(user) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('access');
  if (auth.error) return auth.error;

  const body = await parseJson<{
    id?: string;
    username?: string;
    password?: string;
    displayName?: string;
    roleId?: string;
    active?: boolean;
  }>(request);

  const id = String(body?.id || '').trim();
  if (!id) return jsonError('شناسه کاربر الزامی است.');

  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) return jsonError('کاربر یافت نشد.', 404);

  const username =
    body?.username !== undefined
      ? String(body.username).trim().toLowerCase()
      : user.username;
  if (!username) return jsonError('نام کاربری الزامی است.');

  if (username !== user.username) {
    const duplicate = await prisma.adminUser.findUnique({ where: { username } });
    if (duplicate) return jsonError('این نام کاربری قبلاً ثبت شده است.', 409);
  }

  if (body?.roleId) {
    const role = await prisma.adminRole.findUnique({ where: { id: body.roleId } });
    if (!role) return jsonError('نقش یافت نشد.', 404);
  }

  if (user.roleId === 'superadmin' && body?.active === false) {
    const activeSuperadmins = await prisma.adminUser.count({
      where: { roleId: 'superadmin', active: true, id: { not: id } },
    });
    if (activeSuperadmins === 0) {
      return jsonError('حداقل یک مدیر کل فعال باید باقی بماند.', 403);
    }
  }

  const passwordHash = body?.password?.trim()
    ? await bcrypt.hash(body.password.trim(), 10)
    : undefined;

  const updated = await prisma.adminUser.update({
    where: { id },
    data: {
      username,
      displayName:
        body?.displayName !== undefined
          ? body.displayName.trim() || username
          : user.displayName,
      roleId: body?.roleId || user.roleId,
      active: body?.active !== undefined ? body.active : user.active,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  return NextResponse.json({ user: mapUser(updated) });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin('access');
  if (auth.error) return auth.error;

  const id = new URL(request.url).searchParams.get('id')?.trim();
  if (!id) return jsonError('شناسه کاربر الزامی است.');

  if (auth.session.userId === id) {
    return jsonError('نمی‌توانید کاربر فعلی واردشده را حذف کنید.', 403);
  }

  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) return jsonError('کاربر یافت نشد.', 404);

  if (user.roleId === 'superadmin') {
    const activeSuperadmins = await prisma.adminUser.count({
      where: { roleId: 'superadmin', active: true },
    });
    if (activeSuperadmins <= 1) {
      return jsonError('حذف آخرین مدیر کل مجاز نیست.', 403);
    }
  }

  await prisma.adminUser.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
