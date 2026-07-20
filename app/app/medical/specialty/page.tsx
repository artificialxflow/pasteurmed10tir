"use client";

import { AppShell } from "@/components/app/AppShell";
import { MedicalSpecialtyList } from "@/components/medical/MedicalSpecialtyList";
import { ROUTES } from "@/lib/routes";

export default function AppMedicalSpecialtyPage() {
  return (
    <AppShell title="تخصص‌ها" backHref={ROUTES.app.medical}>
      <MedicalSpecialtyList basePath="/app/medical" />
    </AppShell>
  );
}
