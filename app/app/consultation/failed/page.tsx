"use client";

import { AppShell } from "@/components/app/AppShell";
import { ConsultationPaymentFailed } from "@/components/consultation/ConsultationPayment";
import { ROUTES } from "@/lib/routes";

export default function AppConsultationFailedPage() {
  return (
    <AppShell title="پرداخت ناموفق" backHref={ROUTES.app.consultation}>
      <ConsultationPaymentFailed basePath="/app/consultation" />
    </AppShell>
  );
}
