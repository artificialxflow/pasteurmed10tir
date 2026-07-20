"use client";

import { AppShell } from "@/components/app/AppShell";
import { PaymentFailed } from "@/components/dental/PaymentResult";
import { ROUTES } from "@/lib/routes";

export default function AppDentalFailedPage() {
  return (
    <AppShell title="خطا" backHref={ROUTES.app.dentalBooking} showNav={false}>
      <PaymentFailed basePath="/app/dental" />
    </AppShell>
  );
}
