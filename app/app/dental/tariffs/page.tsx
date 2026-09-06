"use client";

import { AppShell } from "@/components/app/AppShell";
import { DentalTariffs } from "@/components/dental/DentalTariffs";
import { ROUTES } from "@/lib/routes";

export default function AppDentalTariffsPage() {
  return (
    <AppShell title="تعرفه‌های دندانپزشکی" backHref={ROUTES.app.dental}>
      <DentalTariffs basePath="/app/dental" />
    </AppShell>
  );
}
