import { AppShell } from "@/components/app/AppShell";
import { HealthRecordPage } from "@/components/health-record/HealthRecordPage";
import { Suspense } from "react";

export default function AppHealthRecordPage() {
  return (
    <AppShell title="پرونده سلامت" showNav>
      <Suspense fallback={<p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>}>
        <HealthRecordPage variant="app" />
      </Suspense>
    </AppShell>
  );
}
