"use client";

import { AppShell } from "@/components/app/AppShell";
import { NursingPaymentSuccess } from "@/components/nursing/NursingPayment";
import { ROUTES } from "@/lib/routes";

export default function AppNursingSuccessPage() {
  return (
    <AppShell title="پرداخت موفق" backHref={ROUTES.app.nursing}>
      <NursingPaymentSuccess basePath="/app/nursing" />
    </AppShell>
  );
}
