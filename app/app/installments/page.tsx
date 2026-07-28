"use client";

import { InstallmentsPage } from "@/components/account/InstallmentsPage";
import { AppShell } from "@/components/app/AppShell";
import { ROUTES } from "@/lib/routes";

export default function AppInstallmentsPage() {
  return (
    <AppShell title="اقساط من" backHref={ROUTES.app.account} showNav>
      <InstallmentsPage variant="app" />
    </AppShell>
  );
}
