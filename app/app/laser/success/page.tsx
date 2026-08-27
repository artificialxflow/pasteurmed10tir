"use client";

import { AppShell } from "@/components/app/AppShell";
import { LaserPaymentSuccess } from "@/components/laser/LaserPayment";
import { ROUTES } from "@/lib/routes";

export default function AppLaserSuccessPage() {
  return (
    <AppShell title="پرداخت موفق" backHref={ROUTES.app.laser}>
      <LaserPaymentSuccess basePath="/app/laser" />
    </AppShell>
  );
}
