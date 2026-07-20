import { AppShell } from "@/components/app/AppShell";
import { ClubPage } from "@/components/club/ClubPage";
import { ROUTES } from "@/lib/routes";

export default function AppClubPage() {
  return (
    <AppShell title="باشگاه" backHref={ROUTES.app.home} showNav>
      <ClubPage variant="app" />
    </AppShell>
  );
}
