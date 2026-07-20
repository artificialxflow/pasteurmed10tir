"use client";

import { AppShell } from "@/components/app/AppShell";
import { MedicalHub } from "@/components/medical/MedicalHub";
import { ROUTES } from "@/lib/routes";

export default function AppMedicalPage() {
  return (
    <AppShell title="بخش پزشکی" backHref={ROUTES.app.home}>
      <MedicalHub basePath="/app/medical" />
    </AppShell>
  );
}
