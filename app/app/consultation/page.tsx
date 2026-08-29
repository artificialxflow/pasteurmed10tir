"use client";

import { AppShell } from "@/components/app/AppShell";
import { ConsultationForm } from "@/components/consultation/ConsultationForm";
import { ConsultationQuickLinks } from "@/components/consultation/ConsultationQuickLinks";
import { ROUTES } from "@/lib/routes";
import { Suspense } from "react";

export default function AppConsultationPage() {
  return (
    <AppShell title="مشاوره و ویزیت" backHref={ROUTES.app.home}>
      <ConsultationQuickLinks variant="app" />
      <Suspense fallback={<p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>}>
        <ConsultationForm variant="app" />
      </Suspense>
    </AppShell>
  );
}
