import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function commerceId(): string {
  return `PST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function main() {
  const devPhone = '09126723365';
  const user = await prisma.user.findUnique({ where: { phone: devPhone } });
  if (!user) {
    console.error('Dev user not found — run npm run db:seed first');
    process.exit(1);
  }

  await prisma.clubHistoryItem.deleteMany({ where: { profilePhone: devPhone } });
  await prisma.clubProfile.deleteMany({ where: { phone: devPhone } });

  await prisma.clubProfile.create({
    data: {
      phone: devPhone,
      userId: user.id,
      points: 55,
      visits: 1,
      referrals: 0,
      referredPhones: [],
      redeemed: [],
      brushHistory: [],
      history: {
        create: [
          {
            id: commerceId(),
            points: 50,
            reason: 'رزرو نوبت (seed فاز ۵)',
          },
          {
            id: commerceId(),
            points: 5,
            reason: 'مسواک زدم',
          },
        ],
      },
    },
  });

  console.log('Phase 5 seed complete — club profile for', devPhone);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
