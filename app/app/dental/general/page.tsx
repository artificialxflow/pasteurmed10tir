"use client";

import { AppShell } from "@/components/app/AppShell";
import { DentistList } from "@/components/dental/DentistList";
import { ROUTES } from "@/lib/routes";
import { Suspense } from "react";

export default function AppDentalGeneralPage() {
  return (
    <AppShell title="دندانپزشکان" backHref={ROUTES.app.dental}>
      <Suspense fallback={<p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>}>
        <DentistList basePath="/app/dental" />
      </Suspense>
    </AppShell>
  );
}
