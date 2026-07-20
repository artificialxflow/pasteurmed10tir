import { AppShell } from "@/components/app/AppShell";
import { RemindersPage } from "@/components/reminders/RemindersPage";
import { ROUTES } from "@/lib/routes";

export default function AppRemindersPage() {
  return (
    <AppShell title="یادآور هوشمند" backHref={ROUTES.app.home} showNav>
      <RemindersPage variant="app" />
    </AppShell>
  );
}
