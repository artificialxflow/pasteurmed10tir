import { HealthRecordPage } from "@/components/health-record/HealthRecordPage";
import { Suspense } from "react";

export default function WebHealthRecordPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-center text-sm text-slate-500">در حال بارگذاری...</p>}>
      <HealthRecordPage variant="web" />
    </Suspense>
  );
}
