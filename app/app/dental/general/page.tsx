"use client";

import { AppShell } from "@/components/app/AppShell";
import { DentistList } from "@/components/dental/DentistList";
import { ROUTES } from "@/lib/routes";

export default function AppDentalGeneralPage() {
  return (
    <AppShell title="دندانپزشکان" backHref={ROUTES.app.dental}>
      <DentistList basePath="/app/dental" />
    </AppShell>
  );
}
