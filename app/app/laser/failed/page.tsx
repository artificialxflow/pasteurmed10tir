"use client";

import { AppShell } from "@/components/app/AppShell";
import { LaserPaymentFailed } from "@/components/laser/LaserPayment";
import { ROUTES } from "@/lib/routes";

export default function AppLaserFailedPage() {
  return (
    <AppShell title="پرداخت ناموفق" backHref={ROUTES.app.laser}>
      <LaserPaymentFailed basePath="/app/laser" />
    </AppShell>
  );
}
