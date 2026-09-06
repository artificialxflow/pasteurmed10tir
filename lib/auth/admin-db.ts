import { ALL_ADMIN_PERMISSIONS, type AdminPermission, type AdminSession } from '@/lib/adminAccess';
import { prisma } from '@/lib/prisma';

export async function buildAdminSession(adminUserId: string): Promise<AdminSession | null> {
  const user = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    include: { role: true },
  });
  if (!user || !user.active) return null;
  const stored = user.role.permissions as AdminPermission[];
  const permissions =
    user.roleId === 'superadmin'
      ? [...new Set([...stored, ...ALL_ADMIN_PERMISSIONS])]
      : stored;
  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions,
  };
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<AdminSession | null> {
  const bcrypt = await import('bcryptjs');
  const user = await prisma.adminUser.findUnique({
    where: { username: username.trim().toLowerCase() },
    include: { role: true },
  });
  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return buildAdminSession(user.id);
}
