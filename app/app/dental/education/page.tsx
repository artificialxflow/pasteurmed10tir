"use client";

import { AppShell } from "@/components/app/AppShell";
import { EducationList } from "@/components/dental/EducationList";
import { ROUTES } from "@/lib/routes";

export default function AppDentalEducationPage() {
  return (
    <AppShell title="آموزش دندان" backHref={ROUTES.app.dental}>
      <EducationList basePath="/app/dental" />
    </AppShell>
  );
}
