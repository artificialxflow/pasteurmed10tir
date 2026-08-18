import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import type { AdminPermission } from '@/lib/adminAccess';
import { ALL_ADMIN_PERMISSIONS } from '@/lib/adminAccess';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function mapRole(role: {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}) {
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? undefined,
    permissions: role.permissions as AdminPermission[],
  };
}

function sanitizePermissions(permissions: AdminPermission[], roleId: string): AdminPermission[] {
  const allowed = new Set(ALL_ADMIN_PERMISSIONS);
  const next = permissions.filter((p) => allowed.has(p));
  if (roleId === 'superadmin' && !next.includes('access')) {
    next.push('access');
  }
  return next;
}

export async function GET() {
  const auth = await requireAdmin('access');
  if (auth.error) return auth.error;

  const roles = await prisma.adminRole.findMany({ orderBy: { id: 'asc' } });
  return NextResponse.json({ items: roles.map(mapRole) });
}

export async function POST(request: Request) {
  const auth = await requireAdmin('access');
  if (auth.error) return auth.error;

  const body = await parseJson<{
    name?: string;
    description?: string;
    permissions?: AdminPermission[];
  }>(request);

  const name = String(body?.name || '').trim();
  if (!name) return jsonError('نام نقش الزامی است.');

  const id = `role-${Date.now().toString(36)}`;
  const permissions = sanitizePermissions(
    Array.isArray(body?.permissions) ? body.permissions : ['dashboard'],
    id,
  );

  const role = await prisma.adminRole.create({
    data: {
      id,
      name,
      description: body?.description?.trim() || null,
      permissions,
    },
  });

  return NextResponse.json({ role: mapRole(role) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('access');
  if (auth.error) return auth.error;

  const body = await parseJson<{
    id?: string;
    name?: string;
    description?: string;
    permissions?: AdminPermission[];
  }>(request);

  const id = String(body?.id || '').trim();
  if (!id) return jsonError('شناسه نقش الزامی است.');

  const role = await prisma.adminRole.findUnique({ where: { id } });
  if (!role) return jsonError('نقش یافت نشد.', 404);

  const permissions =
    body?.permissions !== undefined
      ? sanitizePermissions(body.permissions, id)
      : (role.permissions as AdminPermission[]);

  const updated = await prisma.adminRole.update({
    where: { id },
    data: {
      name: body?.name !== undefined ? body.name.trim() || role.name : role.name,
      description:
        body?.description !== undefined
          ? body.description.trim() || null
          : role.description,
      permissions,
    },
  });

  return NextResponse.json({ role: mapRole(updated) });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin('access');
  if (auth.error) return auth.error;

  const id = new URL(request.url).searchParams.get('id')?.trim();
  if (!id) return jsonError('شناسه نقش الزامی است.');

  if (id === 'superadmin') {
    return jsonError('نقش مدیر کل قابل حذف نیست.', 403);
  }

  const usersOnRole = await prisma.adminUser.count({ where: { roleId: id } });
  if (usersOnRole > 0) {
    return jsonError('ابتدا کاربران این نقش را به نقش دیگری منتقل کنید.', 403);
  }

  await prisma.adminRole.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
