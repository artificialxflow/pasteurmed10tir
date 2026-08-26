"use client";

import { AppShell } from "@/components/app/AppShell";
import { ConfirmConsultationPayment } from "@/components/consultation/ConsultationPayment";
import { ROUTES } from "@/lib/routes";

export default function AppConsultationConfirmPage() {
  return (
    <AppShell title="تأیید و پرداخت" backHref={ROUTES.app.consultation}>
      <ConfirmConsultationPayment basePath="/app/consultation" />
    </AppShell>
  );
}
