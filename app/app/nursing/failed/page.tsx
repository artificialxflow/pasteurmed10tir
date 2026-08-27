"use client";

import { AppShell } from "@/components/app/AppShell";
import { NursingPaymentFailed } from "@/components/nursing/NursingPayment";
import { ROUTES } from "@/lib/routes";

export default function AppNursingFailedPage() {
  return (
    <AppShell title="پرداخت ناموفق" backHref={ROUTES.app.nursing}>
      <NursingPaymentFailed basePath="/app/nursing" />
    </AppShell>
  );
}
