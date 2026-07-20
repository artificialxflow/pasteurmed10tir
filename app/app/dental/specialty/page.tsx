"use client";

import { AppShell } from "@/components/app/AppShell";
import { SpecialtyList } from "@/components/dental/SpecialtyList";
import { ROUTES } from "@/lib/routes";

export default function AppDentalSpecialtyPage() {
  return (
    <AppShell title="تخصص دندان" backHref={ROUTES.app.dental}>
      <SpecialtyList basePath="/app/dental" />
    </AppShell>
  );
}
