import { AppShell } from "@/components/app/AppShell";
import { HealthRecordPage } from "@/components/health-record/HealthRecordPage";

export default function AppHealthRecordPage() {
  return (
    <AppShell title="پرونده سلامت" showNav>
      <HealthRecordPage variant="app" />
    </AppShell>
  );
}
