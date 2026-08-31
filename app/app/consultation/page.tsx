"use client";

import { AppShell } from "@/components/app/AppShell";
import {
  ConsultationPageContent,
  useConsultationPageTitle,
} from "@/components/consultation/ConsultationPageContent";
import { ROUTES } from "@/lib/routes";
import { Suspense } from "react";

function AppConsultationShell() {
  const title = useConsultationPageTitle();

  return (
    <AppShell title={title} backHref={ROUTES.app.home}>
      <ConsultationPageContent variant="app" />
    </AppShell>
  );
}

export default function AppConsultationPage() {
  return (
    <Suspense fallback={<p className="p-4 text-center text-sm text-slate-500">در حال بارگذاری...</p>}>
      <AppConsultationShell />
    </Suspense>
  );
}
