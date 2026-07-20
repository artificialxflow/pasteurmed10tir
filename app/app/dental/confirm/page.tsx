"use client";

import { AppShell } from "@/components/app/AppShell";
import { ConfirmPayment } from "@/components/dental/ConfirmPayment";
import { ROUTES } from "@/lib/routes";

export default function AppDentalConfirmPage() {
  return (
    <AppShell title="تأیید پرداخت" backHref={ROUTES.app.dentalGeneral} showNav={false}>
      <ConfirmPayment basePath="/app/dental" />
    </AppShell>
  );
}
