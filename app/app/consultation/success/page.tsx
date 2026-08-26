"use client";

import { AppShell } from "@/components/app/AppShell";
import { ConsultationPaymentSuccess } from "@/components/consultation/ConsultationPayment";
import { ROUTES } from "@/lib/routes";

export default function AppConsultationSuccessPage() {
  return (
    <AppShell title="پرداخت موفق" backHref={ROUTES.app.consultation}>
      <ConsultationPaymentSuccess basePath="/app/consultation" />
    </AppShell>
  );
}
