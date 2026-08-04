import { PrismaClient } from '@prisma/client';
import { generateOperationId } from '@/lib/operations/mappers';

const prisma = new PrismaClient();

async function main() {
  const devPhone = '09126723365';
  const user = await prisma.user.findUnique({ where: { phone: devPhone } });
  if (!user) {
    console.error('Dev user not found — run npm run db:seed first');
    process.exit(1);
  }

  await prisma.booking.deleteMany({ where: { patientPhone: devPhone } });
  await prisma.consultation.deleteMany({ where: { patientPhone: devPhone } });
  await prisma.insuranceInquiry.deleteMany({ where: { patientPhone: devPhone } });

  const bookingId = generateOperationId();
  await prisma.booking.create({
    data: {
      id: bookingId,
      userId: user.id,
      patientPhone: devPhone,
      patientName: user.name,
      doctorId: '1',
      doctorName: 'دکتر نمونه',
      specialty: 'دندانپزشک عمومی',
      type: 'visit',
      typeLabel: 'ویزیت',
      day: 'شنبه',
      timeValue: '10',
      timeLabel: 'ساعت 10',
      amount: 200000,
      isDeposit: true,
      depositNonRefundable: true,
      status: 'confirmed',
      dateLabel: new Date().toLocaleDateString('fa-IR'),
    },
  });

  await prisma.consultation.create({
    data: {
      id: generateOperationId(),
      userId: user.id,
      patientPhone: devPhone,
      patientName: user.name,
      type: 'text',
      typeLabel: 'مشاوره متنی',
      category: 'medical-specialty',
      categoryLabel: 'پزشک متخصص',
      specialty: 'internal',
      specialtyLabel: 'داخلی',
      description: 'نمونه درخواست مشاوره — seed فاز ۳',
      amount: 150000,
      estimate: '۱۵۰,۰۰۰ تومان',
      status: 'pending',
    },
  });

  await prisma.insuranceInquiry.create({
    data: {
      id: generateOperationId(),
      userId: user.id,
      patientPhone: devPhone,
      patientName: user.name,
      mode: 'complementary',
      complementaryInsuranceId: 'dana',
      franchisePercent: 30,
      visitFee: 350000,
      depositAmount: 200000,
      status: 'pending',
    },
  });

  console.log('Phase 3 seed complete — booking, consultation, insurance inquiry for', devPhone);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
