import type { PrismaClient } from '@prisma/client';

/** Delete all application rows except AdminRole + AdminUser. */
export async function wipeAppData(prisma: PrismaClient): Promise<void> {
  await prisma.paymentIntent.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.clubHistoryItem.deleteMany();
  await prisma.clubProfile.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.shopOrder.deleteMany();
  await prisma.installmentPlan.deleteMany();
  await prisma.facilityRequest.deleteMany();
  await prisma.membershipApplication.deleteMany();
  await prisma.member.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.insuranceInquiry.deleteMany();
  await prisma.doctorReview.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.partnerRequest.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.mediaAsset.deleteMany();

  await prisma.nursingItem.deleteMany();
  await prisma.nursingService.deleteMany();
  await prisma.laserService.deleteMany();
  await prisma.laserCategory.deleteMany();
  await prisma.service.deleteMany();
  await prisma.dentist.deleteMany();
  await prisma.physician.deleteMany();
  await prisma.galleryItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.baseInsurance.deleteMany();
  await prisma.complementaryInsurance.deleteMany();
  await prisma.consultationType.deleteMany();
  await prisma.specialtyTariff.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.visitor.deleteMany();
}

export async function resetSiteSettingsDefaults(prisma: PrismaClient): Promise<void> {
  await prisma.siteSettings.deleteMany();
  await prisma.siteSettings.create({
    data: { id: 'default' },
  });
}
