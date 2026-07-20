"use client";

import { AppShell } from "@/components/app/AppShell";
import { PaymentSuccess } from "@/components/dental/PaymentResult";

export default function AppDentalSuccessPage() {
  return (
    <AppShell title="موفق" backHref={null} showNav={false}>
      <PaymentSuccess basePath="/app/dental" />
    </AppShell>
  );
}
