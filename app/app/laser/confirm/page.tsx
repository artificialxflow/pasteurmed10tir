"use client";

import { AppShell } from "@/components/app/AppShell";
import { ConfirmLaserPayment } from "@/components/laser/LaserPayment";
import { ROUTES } from "@/lib/routes";

export default function AppLaserConfirmPage() {
  return (
    <AppShell title="تأیید پرداخت لیزر" backHref={ROUTES.app.laser}>
      <ConfirmLaserPayment basePath="/app/laser" />
    </AppShell>
  );
}
