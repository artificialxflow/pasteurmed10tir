import {
  DEFAULT_ADMIN_ROLES,
  DEFAULT_ADMIN_USERS,
  type AdminPermission,
} from '@/lib/adminAccess';
import { resolveAdminPasswords } from '@/lib/admin-credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwords = resolveAdminPasswords(DEFAULT_ADMIN_USERS.map((u) => u.username));

  for (const role of DEFAULT_ADMIN_ROLES) {
    await prisma.adminRole.upsert({
      where: { id: role.id },
      create: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions as AdminPermission[],
      },
      update: {
        name: role.name,
        description: role.description,
        permissions: role.permissions as AdminPermission[],
      },
    });
  }

  for (const user of DEFAULT_ADMIN_USERS) {
    const password = passwords[user.username];
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.adminUser.upsert({
      where: { username: user.username },
      create: {
        username: user.username,
        passwordHash,
        displayName: user.displayName,
        roleId: user.roleId,
        active: user.active,
      },
      update: {
        passwordHash,
        displayName: user.displayName,
        roleId: user.roleId,
        active: user.active,
      },
    });
  }

  const devPhone = '09126723365';
  const devUser = await prisma.user.upsert({
    where: { phone: devPhone },
    create: { phone: devPhone, name: 'کاربر تست' },
    update: { name: 'کاربر تست' },
  });

  await prisma.patientProfile.upsert({
    where: { userId: devUser.id },
    create: {
      userId: devUser.id,
      franchisePercent: 30,
      status: 'pending',
    },
    update: {},
  });

  console.log('Seed complete: admin roles, admin users, dev patient', devPhone);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
