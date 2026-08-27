"use client";

import { AppShell } from "@/components/app/AppShell";
import { ConfirmNursingPayment } from "@/components/nursing/NursingPayment";
import { ROUTES } from "@/lib/routes";

export default function AppNursingConfirmPage() {
  return (
    <AppShell title="تأیید پرداخت پرستاری" backHref={ROUTES.app.nursing}>
      <ConfirmNursingPayment basePath="/app/nursing" />
    </AppShell>
  );
}
