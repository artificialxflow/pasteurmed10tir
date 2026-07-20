"use client";

import { AppShell } from "@/components/app/AppShell";
import { DentalHub } from "@/components/dental/DentalHub";
import { ROUTES } from "@/lib/routes";

export default function AppDentalPage() {
  return (
    <AppShell title="دندانپزشکی" backHref={ROUTES.app.home}>
      <DentalHub basePath="/app/dental" />
    </AppShell>
  );
}
