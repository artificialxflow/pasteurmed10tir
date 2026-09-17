"use client";

import { AppShell } from "@/components/app/AppShell";
import { BookingWizard } from "@/components/dental/BookingWizard";
import { ROUTES } from "@/lib/routes";
import { Suspense } from "react";

export default function AppDentalGeneralPage() {
  return (
    <AppShell title="رزرو نوبت دندانپزشکی" backHref={ROUTES.app.dental}>
      <Suspense fallback={<p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>}>
        <BookingWizard basePath="/app/dental" />
      </Suspense>
    </AppShell>
  );
}
